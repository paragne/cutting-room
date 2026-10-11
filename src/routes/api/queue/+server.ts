import { error, json } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import { clockinPage } from '$lib/server/clockin';
import { parseMode } from '$lib/server/modes';
import { nextPage } from '$lib/server/queueModes';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const mode = parseMode(url.searchParams);
	if (mode === null) error(400, 'invalid mode');
	const cursor = url.searchParams.get('cursor');
	const page =
		mode.kind === 'clockin'
			? await clockinPage(getDb(), cursor)
			: await nextPage(getDb(), mode, cursor);
	if (page === null) error(400, 'invalid cursor');
	return json(page);
};
