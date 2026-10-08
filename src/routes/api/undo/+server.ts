import { error, json } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import { parseUndo, undo } from '$lib/server/decide';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const req = parseUndo(await request.json().catch(() => null));
	if (typeof req === 'string') error(400, req);
	const outcome = await undo(getDb(), req.id);
	if (outcome.status !== 200) error(outcome.status, outcome.message);
	return json({ ok: true });
};
