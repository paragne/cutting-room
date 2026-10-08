import { building, dev } from '$app/environment';
import { json, type Handle, type ServerInit } from '@sveltejs/kit';
import { isValidSession, SESSION_COOKIE } from '$lib/server/auth';
import { getDb } from '$lib/server/db';
import { guard } from '$lib/server/guard';
import { checkServer } from '$lib/server/immich';

// Fail fast: a bad env, wrong Immich version or disabled trash stops the server.
export const init: ServerInit = async () => {
	if (building) return;
	await checkServer();
};

// CSP comes from kit.csp in svelte.config.js, which adds nonces for Kit's inline scripts.
const SECURITY_HEADERS: Record<string, string> = {
	'X-Content-Type-Options': 'nosniff',
	'X-Frame-Options': 'DENY',
	'Referrer-Policy': 'no-referrer',
	'Cross-Origin-Opener-Policy': 'same-origin',
	'Cross-Origin-Resource-Policy': 'same-origin',
	'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
	...(dev ? {} : { 'Strict-Transport-Security': 'max-age=31536000' })
};

export const handle: Handle = async ({ event, resolve }) => {
	const response = await authorize({ event, resolve });
	for (const [name, value] of Object.entries(SECURITY_HEADERS)) response.headers.set(name, value);
	return response;
};

// Returns plain responses instead of throwing, so refusals get the security headers too.
const authorize: Handle = ({ event, resolve }) => {
	const token = event.cookies.get(SESSION_COOKIE);
	event.locals.authenticated = token !== undefined && isValidSession(getDb(), token);

	const result = guard({
		method: event.request.method,
		pathname: event.url.pathname,
		origin: event.request.headers.get('origin'),
		appOrigin: event.url.origin,
		hasSession: event.locals.authenticated
	});
	if (result === 'forbidden') return new Response('Cross-origin request refused', { status: 403 });
	if (result === 'unauthorized') return json({ message: 'Not logged in' }, { status: 401 });
	if (result === 'login')
		return new Response(null, { status: 303, headers: { location: '/login' } });
	return resolve(event);
};
