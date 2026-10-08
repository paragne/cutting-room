import { fetchMedia, type MediaKind } from './immich';
import { log } from './log';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// One range only. Anything else is dropped and the full body is served.
const SINGLE_RANGE = /^bytes=(\d+-\d*|-\d+)$/;
const KINDS: readonly string[] = ['thumbnail', 'preview', 'video'] satisfies MediaKind[];
const PASSED_HEADERS = ['content-type', 'content-length', 'content-range', 'accept-ranges'];
const PASSED_STATUS = [200, 206, 416];

export function isUuid(value: string): boolean {
	return UUID.test(value);
}

function isMediaKind(value: string): value is MediaKind {
	return KINDS.includes(value);
}

export async function proxyMedia(id: string, kind: string, request: Request): Promise<Response> {
	if (!isMediaKind(kind)) return new Response(null, { status: 404 });
	if (!isUuid(id)) return new Response(null, { status: 400 });

	const range = request.headers.get('range');
	let upstream: Response;
	try {
		upstream = await fetchMedia(
			id,
			kind,
			range !== null && SINGLE_RANGE.test(range) ? range : null,
			request.signal
		);
	} catch (err) {
		if (request.signal.aborted) throw err;
		log.warn('media fetch failed', { kind, reason: err instanceof Error ? err.message : 'unknown' });
		return new Response(null, { status: 502 });
	}

	const type = upstream.headers.get('content-type') ?? '';
	const isMedia = type.startsWith('image/') || type.startsWith('video/');
	if (!PASSED_STATUS.includes(upstream.status) || (upstream.status !== 416 && !isMedia)) {
		await upstream.body?.cancel();
		if (upstream.status === 404) return new Response(null, { status: 404 });
		log.warn('media upstream refused', { kind, status: upstream.status });
		return new Response(null, { status: 502 });
	}

	const headers = new Headers({ 'cache-control': 'private, max-age=86400' });
	for (const name of PASSED_HEADERS) {
		const value = upstream.headers.get(name);
		if (value !== null) headers.set(name, value);
	}
	return new Response(upstream.body, { status: upstream.status, headers });
}
