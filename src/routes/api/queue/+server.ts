import { error, json } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import { decodeCursor, encodeCursor, nextPage } from '$lib/server/queue';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const order = url.searchParams.get('order') ?? 'oldest';
	if (order !== 'oldest' && order !== 'newest') error(400, 'order must be oldest or newest');
	const raw = url.searchParams.get('cursor');
	const cursor = raw === null ? null : decodeCursor(raw);
	if (raw !== null && cursor === null) error(400, 'invalid cursor');
	const page = await nextPage(getDb(), order, cursor);
	return json({
		items: page.items,
		cursor: page.cursor && encodeCursor(page.cursor)
	});
};
