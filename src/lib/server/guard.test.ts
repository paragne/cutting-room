import { describe, expect, it } from 'vitest';
import { guard, type GuardRequest } from './guard';

const appOrigin = 'https://cr.example.com';
const base: GuardRequest = {
	method: 'GET',
	pathname: '/',
	origin: null,
	appOrigin,
	hasSession: true
};

describe('guard', () => {
	it('allows a GET with a session', () => {
		expect(guard(base)).toBe('allow');
	});

	it('sends pages without a session to login', () => {
		expect(guard({ ...base, hasSession: false })).toBe('login');
		expect(guard({ ...base, pathname: '/media/x', hasSession: false })).toBe('login');
	});

	it('answers API calls without a session with 401, not a redirect', () => {
		expect(guard({ ...base, pathname: '/api/queue', hasSession: false })).toBe('unauthorized');
		expect(guard({ ...base, pathname: '/api', hasSession: false })).toBe('unauthorized');
		expect(guard({ ...base, pathname: '/apiary', hasSession: false })).toBe('login');
	});

	it('lets /login through without a session', () => {
		expect(guard({ ...base, pathname: '/login', hasSession: false })).toBe('allow');
		expect(guard({ ...base, pathname: '/login/x', hasSession: false })).toBe('login');
	});

	it('refuses non-GET without a matching Origin, even with a session', () => {
		for (const method of ['POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']) {
			expect(guard({ ...base, method })).toBe('forbidden');
			expect(guard({ ...base, method, origin: 'https://evil.example.com' })).toBe('forbidden');
			expect(guard({ ...base, method, origin: 'http://cr.example.com' })).toBe('forbidden');
		}
		expect(guard({ ...base, method: 'POST', pathname: '/login', hasSession: false })).toBe(
			'forbidden'
		);
	});

	it('allows non-GET with a matching Origin', () => {
		expect(guard({ ...base, method: 'POST', origin: appOrigin })).toBe('allow');
		expect(
			guard({
				...base,
				method: 'POST',
				origin: appOrigin,
				pathname: '/login',
				hasSession: false
			})
		).toBe('allow');
		expect(
			guard({
				...base,
				method: 'POST',
				origin: appOrigin,
				pathname: '/api/x',
				hasSession: false
			})
		).toBe('unauthorized');
	});

	it('does not require Origin on HEAD', () => {
		expect(guard({ ...base, method: 'HEAD' })).toBe('allow');
	});
});
