import { error, json } from '@sveltejs/kit';
import { loadInfo } from '$lib/server/assetInfo';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	const outcome = await loadInfo(params.id);
	if (outcome.status !== 200) error(outcome.status, outcome.message);
	return json(outcome.info);
};
