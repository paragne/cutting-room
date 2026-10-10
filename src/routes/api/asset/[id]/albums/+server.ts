import { error, json } from '@sveltejs/kit';
import { albumsOf, parseMembership, setMembership } from '$lib/server/assetActions';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	const outcome = await albumsOf(params.id);
	if (outcome.status !== 200) error(outcome.status, outcome.message);
	return json({ albumIds: outcome.albumIds });
};

export const PUT: RequestHandler = async ({ params, request }) => {
	const req = parseMembership(await request.json().catch(() => null));
	if (typeof req === 'string') error(400, req);
	const outcome = await setMembership(params.id, req.albumId, req.member);
	if (outcome.status !== 200) error(outcome.status, outcome.message);
	return json({ ok: true });
};
