import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchMedia } from './immich';
import { proxyMedia } from './media';

vi.mock('./immich', () => ({ fetchMedia: vi.fn() }));
vi.mock('./log', () => ({ log: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));

const fetchMock = vi.mocked(fetchMedia);
const id = '0b6f2c1e-8a4d-4f7e-9c3b-2d5a6e7f8091';

function request(headers: Record<string, string> = {}): Request {
	return new Request(`http://app.test/media/${id}/video`, { headers });
}

function upstream(status: number, headers: Record<string, string>, body = 'bytes'): Response {
	return new Response(status === 416 ? null : body, { status, headers });
}

beforeEach(() => {
	vi.clearAllMocks();
	fetchMock.mockResolvedValue(upstream(200, { 'content-type': 'image/webp' }));
});

describe('proxyMedia', () => {
	it.each(['not-a-uuid', `${id}x`, '../../server/config', ''])('rejects id %j', async (bad) => {
		const res = await proxyMedia(bad, 'thumbnail', request());
		expect(res.status).toBe(400);
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it.each(['fullsize', 'original', 'download', ''])('has no %j kind', async (kind) => {
		const res = await proxyMedia(id, kind, request());
		expect(res.status).toBe(404);
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('forwards a single range and nothing else from the client', async () => {
		await proxyMedia(id, 'video', request({ range: 'bytes=0-1023', cookie: 'session=abc' }));
		expect(fetchMock).toHaveBeenCalledWith(id, 'video', 'bytes=0-1023', expect.any(AbortSignal));
	});

	it.each(['bytes=0-1,5-9', 'items=0-1', 'bytes=abc-'])(
		'drops malformed range %j',
		async (range) => {
			await proxyMedia(id, 'video', request({ range }));
			expect(fetchMock.mock.calls[0]?.[2]).toBeNull();
		}
	);

	it('returns only allowlisted headers plus its own cache policy', async () => {
		fetchMock.mockResolvedValue(
			upstream(206, {
				'content-type': 'video/mp4',
				'content-length': '1024',
				'content-range': 'bytes 0-1023/5000',
				'accept-ranges': 'bytes',
				'set-cookie': 'immich_access_token=x',
				'cache-control': 'public, max-age=999',
				etag: '"abc"',
				server: 'immich'
			})
		);
		const res = await proxyMedia(id, 'video', request({ range: 'bytes=0-1023' }));
		expect(res.status).toBe(206);
		expect(Object.fromEntries(res.headers)).toEqual({
			'content-type': 'video/mp4',
			'content-length': '1024',
			'content-range': 'bytes 0-1023/5000',
			'accept-ranges': 'bytes',
			'cache-control': 'private, max-age=86400'
		});
		expect(await res.text()).toBe('bytes');
	});

	it('passes 416 through with its content range', async () => {
		fetchMock.mockResolvedValue(upstream(416, { 'content-range': 'bytes */5000' }));
		const res = await proxyMedia(id, 'video', request({ range: 'bytes=9000-' }));
		expect(res.status).toBe(416);
		expect(res.headers.get('content-range')).toBe('bytes */5000');
	});

	it('maps a missing asset to 404', async () => {
		fetchMock.mockResolvedValue(upstream(404, { 'content-type': 'application/json' }, '{}'));
		expect((await proxyMedia(id, 'preview', request())).status).toBe(404);
	});

	it.each([
		['unauthorized', 401, 'application/json'],
		['redirect', 302, 'text/plain'],
		['server error', 500, 'application/json'],
		['non-media body', 200, 'text/html']
	])('returns 502 with no upstream body on %s', async (_, status, type) => {
		fetchMock.mockResolvedValue(upstream(status, { 'content-type': type }, 'upstream detail'));
		const res = await proxyMedia(id, 'preview', request());
		expect(res.status).toBe(502);
		expect(await res.text()).toBe('');
	});

	it('returns 502 when fetch refuses a redirect', async () => {
		fetchMock.mockRejectedValue(new TypeError('fetch failed'));
		expect((await proxyMedia(id, 'preview', request())).status).toBe(502);
	});
});
