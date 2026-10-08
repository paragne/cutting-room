import { describe, expect, it } from 'vitest';
import { migrate, openDb, type Decision } from './db';

describe('openDb', () => {
	it('applies migrations to a new database', () => {
		const { db } = openDb(':memory:');
		expect(db.pragma('user_version', { simple: true })).toBeGreaterThanOrEqual(1);
		expect(db.prepare("SELECT name FROM sqlite_master WHERE name = 'sessions'").get()).toEqual({
			name: 'sessions'
		});
	});

	it('does nothing when migrations already ran', () => {
		const { db } = openDb(':memory:');
		const version = db.pragma('user_version', { simple: true });
		expect(() => migrate(db)).not.toThrow();
		expect(db.pragma('user_version', { simple: true })).toBe(version);
	});

	it('applies later migrations on top of an existing database', () => {
		const { db } = openDb(':memory:');
		db.exec('DROP TABLE decisions; DROP TABLE daily_stats; DROP TABLE settings');
		db.pragma('user_version = 1');
		migrate(db);
		expect(db.pragma('user_version', { simple: true })).toBe(2);
		expect(db.prepare("SELECT count(*) AS n FROM sqlite_master WHERE type = 'table'").get()).toEqual({
			n: 4
		});
	});
});

const A = '6f1c2b1e-8a4d-4c5e-9f0a-1b2c3d4e5f60';
const B = '7a2d3c4f-9b5e-4d6f-8a1b-2c3d4e5f6071';

const keep = (assetId: string, day = '2026-10-08'): Decision => ({
	assetId,
	action: 'keep',
	bytes: null,
	decidedAt: 1,
	day
});
const trash = (assetId: string, bytes: number | null, day = '2026-10-08'): Decision => ({
	assetId,
	action: 'trash',
	bytes,
	decidedAt: 2,
	day
});

describe('decisions', () => {
	it('records a decision and counts it toward its day', () => {
		const d = openDb(':memory:');
		d.recordDecision(keep(A));
		d.recordDecision(trash(B, 500));
		expect(d.findDecision.get(B)).toEqual(trash(B, 500));
		expect(d.countDecisions.get()).toEqual({ count: 2 });
		expect(d.statTotals.get()).toEqual({ kept: 1, trashed: 1, bytesTrashed: 500 });
	});

	it('counts an asset once when it is decided again', () => {
		const d = openDb(':memory:');
		d.recordDecision(trash(A, 500, '2026-10-07'));
		d.recordDecision(keep(A));
		expect(d.findDecision.get(A)).toEqual(keep(A));
		expect(d.countDecisions.get()).toEqual({ count: 1 });
		expect(d.statTotals.get()).toEqual({ kept: 1, trashed: 0, bytesTrashed: 0 });
		expect(d.activeDays.all()).toEqual([{ day: '2026-10-08' }]);
	});

	it('removes a decision and takes back its count', () => {
		const d = openDb(':memory:');
		d.recordDecision(trash(A, 500));
		d.recordDecision(trash(B, 300));
		expect(d.removeDecision(A)).toEqual(trash(A, 500));
		expect(d.findDecision.get(A)).toBeUndefined();
		expect(d.statTotals.get()).toEqual({ kept: 0, trashed: 1, bytesTrashed: 300 });
	});

	it('returns undefined when removing an asset with no decision', () => {
		const d = openDb(':memory:');
		expect(d.removeDecision(A)).toBeUndefined();
		expect(d.statTotals.get()).toEqual({ kept: 0, trashed: 0, bytesTrashed: 0 });
	});

	it('counts a trashed asset with unknown size as zero bytes', () => {
		const d = openDb(':memory:');
		d.recordDecision(trash(A, null));
		expect(d.statTotals.get()).toEqual({ kept: 0, trashed: 1, bytesTrashed: 0 });
	});

	it('lists only days with decisions left, newest first', () => {
		const d = openDb(':memory:');
		d.recordDecision(keep(A, '2026-10-06'));
		d.recordDecision(keep(B, '2026-10-08'));
		d.recordDecision(trash('8b3e4d5a-0c6f-4e7a-9b2c-3d4e5f607182', 1, '2026-10-07'));
		d.removeDecision('8b3e4d5a-0c6f-4e7a-9b2c-3d4e5f607182');
		expect(d.activeDays.all()).toEqual([{ day: '2026-10-08' }, { day: '2026-10-06' }]);
	});

	it('rejects a keep that carries bytes', () => {
		const d = openDb(':memory:');
		expect(() => d.recordDecision({ ...keep(A), bytes: 5 })).toThrow(/CHECK/);
		expect(d.countDecisions.get()).toEqual({ count: 0 });
		expect(d.statTotals.get()).toEqual({ kept: 0, trashed: 0, bytesTrashed: 0 });
	});
});

describe('settings', () => {
	it('returns undefined for a missing key', () => {
		expect(openDb(':memory:').getSetting.get('hotkeys')).toBeUndefined();
	});

	it('stores and overwrites a value', () => {
		const d = openDb(':memory:');
		d.setSetting.run('hotkeys', '{"1":"a"}');
		d.setSetting.run('hotkeys', '{"1":"b"}');
		expect(d.getSetting.get('hotkeys')).toEqual({ value: '{"1":"b"}' });
	});
});
