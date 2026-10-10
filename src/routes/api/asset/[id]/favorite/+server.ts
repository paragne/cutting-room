import { error, json } from '@sveltejs/kit';
import { favorite, parseFavorite } from '$lib/server/assetActions';
import type { RequestHandler } from './$types';

export const PUT: RequestHandler = async ({ params, request }) => {
	const value = parseFavorite(await request.json().catch(() => null));
	if (typeof value === 'string') error(400, value);
	const outcome = await favorite(params.id, value);
	if (outcome.status !== 200) error(outcome.status, outcome.message);
	return json({ ok: true });
};
