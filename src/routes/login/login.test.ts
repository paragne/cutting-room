import { hash } from '@node-rs/argon2';
import { isRedirect, type Cookies } from '@sveltejs/kit';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { isValidSession, LOGIN_MAX_FAILURES, SESSION_COOKIE } from '$lib/server/auth';
import { openDb } from '$lib/server/db';
import { actions } from './+page.server';
import type { RequestEvent } from './$types';

const config = vi.hoisted(() => ({ appPasswordHash: '' }));
vi.mock('$lib/server/config', () => ({ getConfig: () => config }));
const db = vi.hoisted(() => ({
	current: undefined as ReturnType<typeof openDb> | undefined
}));
vi.mock('$lib/server/db', async (importOriginal) => ({
	...(await importOriginal<typeof import('$lib/server/db')>()),
	getDb: () => db.current
}));
vi.mock('$lib/server/log', () => ({
	log: { info() {}, warn() {}, error() {} }
}));

type SetCall = {
	name: string;
	value: string;
	opts: Parameters<Cookies['set']>[2];
};

function event(password: string | null, ip: string) {
	const body = new FormData();
	if (password !== null) body.set('password', password);
	const set: SetCall[] = [];
	const cookies = {
		set: (name: string, value: string, opts: SetCall['opts']) => set.push({ name, value, opts })
	};
	const ev = {
		request: new Request('http://localhost/login', { method: 'POST', body }),
		cookies,
		getClientAddress: () => ip
	} as unknown as RequestEvent;
	return { ev, set };
}

async function login(password: string | null, ip: string) {
	const { ev, set } = event(password, ip);
	try {
		return { result: await actions.default!(ev), set };
	} catch (thrown) {
		if (isRedirect(thrown)) return { result: thrown, set };
		throw thrown;
	}
}

describe('login action', () => {
	beforeAll(async () => {
		config.appPasswordHash = await hash('right password', {
			memoryCost: 1024,
			timeCost: 1
		});
		db.current = openDb(':memory:');
	});

	it('rejects a wrong or missing password without a cookie', async () => {
		for (const password of ['wrong', null]) {
			const { result, set } = await login(password, '10.0.0.1');
			expect(result).toMatchObject({ status: 401 });
			expect(set).toHaveLength(0);
		}
	});

	it('sets a valid session cookie with strict flags and redirects home', async () => {
		const { result, set } = await login('right password', '10.0.0.2');
		expect(result).toMatchObject({ status: 303, location: '/' });
		expect(set).toHaveLength(1);
		const [{ name, value, opts }] = set as [SetCall];
		expect(name).toBe(SESSION_COOKIE);
		expect(opts).toMatchObject({
			path: '/',
			httpOnly: true,
			sameSite: 'strict'
		});
		expect(isValidSession(db.current!, value)).toBe(true);
	});

	it('blocks an IP after repeated failures, even with the right password', async () => {
		const ip = '10.0.0.3';
		for (let i = 0; i < LOGIN_MAX_FAILURES; i++) await login('wrong', ip);
		const { result, set } = await login('right password', ip);
		expect(result).toMatchObject({ status: 429 });
		expect(set).toHaveLength(0);
		expect((await login('right password', '10.0.0.4')).result).toMatchObject({
			status: 303
		});
	});
});
