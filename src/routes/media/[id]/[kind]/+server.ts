import { proxyMedia } from '$lib/server/media';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ params, request }) =>
	proxyMedia(params.id, params.kind, request);
