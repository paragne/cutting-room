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

export function openDb(path: string) {
	const db = new Database(path);
	db.pragma('journal_mode = WAL');
	db.pragma('foreign_keys = ON');
	migrate(db);
	return {
		db,
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
