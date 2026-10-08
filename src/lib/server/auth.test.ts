import { hash } from '@node-rs/argon2';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import {
	checkPassword,
	clearLoginFailures,
	createSession,
	deleteSession,
	isLoginBlocked,
	isValidSession,
	LOGIN_MAX_FAILURES,
	LOGIN_WINDOW_MS,
	recordLoginFailure,
	SESSION_TTL_MS
} from './auth';
import { openDb } from './db';

const config = vi.hoisted(() => ({ appPasswordHash: '' }));
vi.mock('./config', () => ({ getConfig: () => config }));

describe('checkPassword', () => {
	beforeAll(async () => {
		config.appPasswordHash = await hash('correct horse battery', { memoryCost: 1024, timeCost: 1 });
	});

	it('accepts the right password', async () => {
		expect(await checkPassword('correct horse battery')).toBe(true);
	});

	it('rejects a wrong password', async () => {
		expect(await checkPassword('correct horse batter')).toBe(false);
	});
});

describe('sessions', () => {
	const now = 1_800_000_000_000;

	it('validates a new session until it expires', () => {
		const db = openDb(':memory:');
		const { token, expiresAt } = createSession(db, now);
		expect(expiresAt).toBe(now + SESSION_TTL_MS);
		expect(isValidSession(db, token, now)).toBe(true);
		expect(isValidSession(db, token, expiresAt - 1)).toBe(true);
		expect(isValidSession(db, token, expiresAt)).toBe(false);
	});

	it('rejects unknown and deleted tokens', () => {
		const db = openDb(':memory:');
		const { token } = createSession(db, now);
		expect(isValidSession(db, token + 'x', now)).toBe(false);
		deleteSession(db, token);
		expect(isValidSession(db, token, now)).toBe(false);
	});

	it('stores only a hash of the token', () => {
		const db = openDb(':memory:');
		const { token } = createSession(db, now);
		const rows = db.db.prepare('SELECT token_hash FROM sessions').all() as { token_hash: string }[];
		expect(rows).toHaveLength(1);
		expect(rows[0]!.token_hash).not.toContain(token);
	});

	it('removes expired sessions when creating one', () => {
		const db = openDb(':memory:');
		createSession(db, now);
		createSession(db, now + SESSION_TTL_MS);
		expect(db.db.prepare('SELECT COUNT(*) AS n FROM sessions').get()).toEqual({ n: 1 });
	});
});

describe('login rate limit', () => {
	const now = 1_800_000_000_000;

	function fail(ip: string, times: number, at = now): void {
		for (let i = 0; i < times; i++) recordLoginFailure(ip, at);
	}

	it('blocks after the maximum failures', () => {
		fail('10.0.0.1', LOGIN_MAX_FAILURES - 1);
		expect(isLoginBlocked('10.0.0.1', now)).toBe(false);
		fail('10.0.0.1', 1);
		expect(isLoginBlocked('10.0.0.1', now)).toBe(true);
	});

	it('counts each address separately', () => {
		fail('10.0.0.2', LOGIN_MAX_FAILURES);
		expect(isLoginBlocked('10.0.0.3', now)).toBe(false);
	});

	it('unblocks when the window ends', () => {
		fail('10.0.0.4', LOGIN_MAX_FAILURES);
		expect(isLoginBlocked('10.0.0.4', now + LOGIN_WINDOW_MS)).toBe(false);
		fail('10.0.0.4', 1, now + LOGIN_WINDOW_MS);
		expect(isLoginBlocked('10.0.0.4', now + LOGIN_WINDOW_MS)).toBe(false);
	});

	it('unblocks after a successful login clears the count', () => {
		fail('10.0.0.5', LOGIN_MAX_FAILURES);
		clearLoginFailures('10.0.0.5');
		expect(isLoginBlocked('10.0.0.5', now)).toBe(false);
	});
});
