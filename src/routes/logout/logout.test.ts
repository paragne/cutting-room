import { isRedirect, type Cookies } from '@sveltejs/kit';
import { describe, expect, it, vi } from 'vitest';
import { createSession, isValidSession, SESSION_COOKIE } from '$lib/server/auth';
import { openDb } from '$lib/server/db';
import { POST } from './+server';
import type { RequestEvent } from './$types';

const db = vi.hoisted(() => ({
	current: undefined as ReturnType<typeof openDb> | undefined
}));
vi.mock('$lib/server/db', async (importOriginal) => ({
	...(await importOriginal<typeof import('$lib/server/db')>()),
	getDb: () => db.current
}));
vi.mock('$lib/server/config', () => ({ getConfig: () => ({}) }));

describe('logout', () => {
	it('deletes the session, clears the cookie and redirects to login', async () => {
		db.current = openDb(':memory:');
		const { token } = createSession(db.current);
		const deleted: string[] = [];
		const cookies: Partial<Cookies> = {
			get: (name) => (name === SESSION_COOKIE ? token : undefined),
			delete: (name) => void deleted.push(name)
		};
		const thrown = await Promise.resolve()
			.then(() => POST({ cookies } as unknown as RequestEvent))
			.catch((e: unknown) => e);
		expect(isRedirect(thrown) && thrown.location).toBe('/login');
		expect(deleted).toEqual([SESSION_COOKIE]);
		expect(isValidSession(db.current, token)).toBe(false);
	});
});
