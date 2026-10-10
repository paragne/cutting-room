import { error, json } from '@sveltejs/kit';
import { listAlbums, parseHotkeys, saveHotkeys } from '$lib/server/albums';
import { getDb } from '$lib/server/db';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => json(await listAlbums(getDb()));

export const PUT: RequestHandler = async ({ request }) => {
	const hotkeys = parseHotkeys(await request.json().catch(() => null));
	if (typeof hotkeys === 'string') error(400, hotkeys);
	saveHotkeys(getDb(), hotkeys);
	return json({ ok: true });
};
