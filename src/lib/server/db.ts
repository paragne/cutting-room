import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { getConfig } from './config';

// Bundled at build time, so the production server does not read .sql files from disk.
// Names are zero-padded, so sorting by path gives apply order.
const migrations = Object.entries(
	import.meta.glob<string>('./migrations/*.sql', { query: '?raw', import: 'default', eager: true })
)
	.sort(([a], [b]) => a.localeCompare(b))
	.map(([, sql]) => sql);

export function migrate(db: Database.Database): void {
	const applied = db.pragma('user_version', { simple: true }) as number;
	for (let i = applied; i < migrations.length; i++) {
		db.transaction(() => {
			db.exec(migrations[i]!);
			// PRAGMA takes no bound parameters; the value is our own loop index.
			db.pragma(`user_version = ${i + 1}`);
		})();
	}
}

export type Action = 'keep' | 'trash';

export interface Decision {
	assetId: string;
	action: Action;
	/** File size of a trashed asset, null for keep or when Immich does not report it. */
	bytes: number | null;
	decidedAt: number;
	/** Local calendar date, YYYY-MM-DD, that the decision counts toward. */
	day: string;
}

export function openDb(path: string) {
	const db = new Database(path);
	db.pragma('journal_mode = WAL');
	db.pragma('foreign_keys = ON');
	migrate(db);

	const findDecision = db.prepare<[string], Decision>(
		'SELECT asset_id AS assetId, action, bytes, decided_at AS decidedAt, day FROM decisions WHERE asset_id = ?'
	);
	const upsertDecision = db.prepare<[string, Action, number | null, number, string]>(
		`INSERT INTO decisions (asset_id, action, bytes, decided_at, day) VALUES (?, ?, ?, ?, ?)
		ON CONFLICT (asset_id) DO UPDATE SET
			action = excluded.action, bytes = excluded.bytes,
			decided_at = excluded.decided_at, day = excluded.day`
	);
	const deleteDecision = db.prepare<[string]>('DELETE FROM decisions WHERE asset_id = ?');
	// sign is 1 to count a decision and -1 to take it back.
	const bumpDay = db.prepare<{ day: string; sign: number; keep: number; bytes: number }>(
		`INSERT INTO daily_stats (day, kept, trashed, bytes_trashed)
		VALUES (@day, @keep, 1 - @keep, @bytes)
		ON CONFLICT (day) DO UPDATE SET
			kept = kept + @sign * @keep,
			trashed = trashed + @sign * (1 - @keep),
			bytes_trashed = bytes_trashed + @sign * @bytes`
	);
	const countDay = (d: Decision, sign: 1 | -1) =>
		bumpDay.run({ day: d.day, sign, keep: d.action === 'keep' ? 1 : 0, bytes: d.bytes ?? 0 });

	return {
		db,
		findDecision,
		// Replacing an earlier decision moves its count, so an asset is counted once.
		recordDecision: db.transaction((d: Decision) => {
			const previous = findDecision.get(d.assetId);
			if (previous) countDay(previous, -1);
			upsertDecision.run(d.assetId, d.action, d.bytes, d.decidedAt, d.day);
			countDay(d, 1);
		}),
		// Returns the removed decision so the caller knows whether to restore from trash.
		removeDecision: db.transaction((assetId: string): Decision | undefined => {
			const previous = findDecision.get(assetId);
			if (!previous) return undefined;
			deleteDecision.run(assetId);
			countDay(previous, -1);
			return previous;
		}),
		countDecisions: db.prepare<[], { count: number }>('SELECT count(*) AS count FROM decisions'),
		statTotals: db.prepare<[], { kept: number; trashed: number; bytesTrashed: number }>(
			`SELECT coalesce(sum(kept), 0) AS kept, coalesce(sum(trashed), 0) AS trashed,
			coalesce(sum(bytes_trashed), 0) AS bytesTrashed FROM daily_stats`
		),
		activeDays: db.prepare<[], { day: string }>(
			'SELECT day FROM daily_stats WHERE kept + trashed > 0 ORDER BY day DESC'
		),
		getSetting: db.prepare<[string], { value: string }>('SELECT value FROM settings WHERE key = ?'),
		setSetting: db.prepare<[string, string]>(
			'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value'
		),
		insertSession: db.prepare<[string, number]>(
			'INSERT INTO sessions (token_hash, expires_at) VALUES (?, ?)'
		),
		findSession: db.prepare<[string, number], { expires_at: number }>(
			'SELECT expires_at FROM sessions WHERE token_hash = ? AND expires_at > ?'
		),
		deleteSession: db.prepare<[string]>('DELETE FROM sessions WHERE token_hash = ?'),
		deleteExpiredSessions: db.prepare<[number]>('DELETE FROM sessions WHERE expires_at <= ?')
	};
}

export type Db = ReturnType<typeof openDb>;

let instance: Db | undefined;

export function getDb(): Db {
	if (!instance) {
		const { dataDir } = getConfig();
		mkdirSync(dataDir, { recursive: true, mode: 0o700 });
		instance = openDb(join(dataDir, 'cutting-room.db'));
	}
	return instance;
}
