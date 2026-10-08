import { dev } from '$app/environment';
import { fail, redirect } from '@sveltejs/kit';
import {
	checkPassword,
	clearLoginFailures,
	createSession,
	isLoginBlocked,
	recordLoginFailure,
	SESSION_COOKIE
} from '$lib/server/auth';
import { getDb } from '$lib/server/db';
import { log } from '$lib/server/log';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals }) => {
	if (locals.authenticated) redirect(303, '/');
};

export const actions: Actions = {
	default: async ({ request, cookies, getClientAddress }) => {
		const ip = getClientAddress();
		if (isLoginBlocked(ip)) {
			log.warn('login blocked', { ip });
			return fail(429, {
				message: 'Too many failed attempts. Try again in 15 minutes.'
			});
		}

		const password = (await request.formData()).get('password');
		if (typeof password !== 'string' || !(await checkPassword(password))) {
			recordLoginFailure(ip);
			log.warn('login failed', { ip });
			return fail(401, { message: 'Wrong password.' });
		}

		clearLoginFailures(ip);
		const { token, expiresAt } = createSession(getDb());
		cookies.set(SESSION_COOKIE, token, {
			path: '/',
			httpOnly: true,
			sameSite: 'strict',
			secure: !dev,
			expires: new Date(expiresAt)
		});
		log.info('login', { ip });
		redirect(303, '/');
	}
};
