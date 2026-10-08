import { error, json } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import { decide, parseDecide } from '$lib/server/decide';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const now = Date.now();
	const req = parseDecide(await request.json().catch(() => null), now);
	if (typeof req === 'string') error(400, req);
	const outcome = await decide(getDb(), req, now);
	if (outcome.status !== 200) error(outcome.status, outcome.message);
	return json({ ok: true });
};
