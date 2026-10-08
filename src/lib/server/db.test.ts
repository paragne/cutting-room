import { describe, expect, it } from 'vitest';
import { migrate, openDb } from './db';

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
});
