import { beforeEach, describe, expect, it, vi } from 'vitest';
import { listAlbums, parseHotkeys, saveHotkeys } from './albums';
import { openDb, type Db } from './db';
import { getAlbums } from './immich';

vi.mock('./immich', () => ({ getAlbums: vi.fn() }));

const a = '7c9e6679-7425-40de-944b-e07fc1f90ae7';
const b = '0b6f2c1e-8a4d-4f7e-9c3b-2d5a6e7f8091';

let db: Db;
beforeEach(() => {
	db = openDb(':memory:');
	vi.mocked(getAlbums).mockResolvedValue([
		{ id: a, albumName: 'Trips', assetCount: 12 },
		{ id: b, albumName: 'Pets', assetCount: 3 }
	] as never);
});

describe('parseHotkeys', () => {
	it('accepts digit to UUID maps, including empty', () => {
		expect(parseHotkeys({ hotkeys: { '1': a, '0': b } })).toEqual({ '1': a, '0': b });
		expect(parseHotkeys({ hotkeys: {} })).toEqual({});
	});

	it.each([
		null,
		{},
		{ hotkeys: [] },
		{ hotkeys: { '10': a } },
		{ hotkeys: { x: a } },
		{ hotkeys: { '1': 'nope' } },
		{ hotkeys: { '1': a, '2': a } }
	])('rejects %j', (body) => {
		expect(typeof parseHotkeys(body)).toBe('string');
	});
});

describe('listAlbums', () => {
	it('returns albums with no hotkeys by default', async () => {
		expect(await listAlbums(db)).toEqual({
			albums: [
				{ id: a, name: 'Trips', assetCount: 12 },
				{ id: b, name: 'Pets', assetCount: 3 }
			],
			hotkeys: {}
		});
	});

	it('returns saved hotkeys and drops albums that no longer exist', async () => {
		const gone = '11111111-1111-4111-8111-111111111111';
		saveHotkeys(db, { '1': a, '2': gone });
		expect((await listAlbums(db)).hotkeys).toEqual({ '1': a });
	});
});
