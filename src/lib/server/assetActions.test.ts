import { BulkIdErrorReason } from '@immich/sdk';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { albumsOf, favorite, parseFavorite, parseMembership, setMembership } from './assetActions';
import { addToAlbum, getAlbumIdsOf, removeFromAlbum, setFavorite } from './immich';

vi.mock('./immich', () => ({
	addToAlbum: vi.fn(),
	getAlbumIdsOf: vi.fn(),
	removeFromAlbum: vi.fn(),
	setFavorite: vi.fn()
}));

const asset = '7c9e6679-7425-40de-944b-e07fc1f90ae7';
const album = '0b6f2c1e-8a4d-4f7e-9c3b-2d5a6e7f8091';

beforeEach(() => vi.resetAllMocks());

describe('parsers', () => {
	it('read a boolean favorite', () => {
		expect(parseFavorite({ favorite: false })).toBe(false);
		expect(parseFavorite({ favorite: 'yes' })).toMatch(/boolean/);
		expect(parseFavorite(null)).toMatch(/boolean/);
	});

	it('read an album UUID and a boolean member', () => {
		expect(parseMembership({ albumId: album, member: true })).toEqual({
			albumId: album,
			member: true
		});
		expect(parseMembership({ albumId: '../x', member: true })).toMatch(/UUID/);
		expect(parseMembership({ albumId: album })).toMatch(/boolean/);
		expect(parseMembership(null)).toMatch(/UUID/);
	});
});

describe('favorite', () => {
	it('sets the flag in Immich', async () => {
		expect(await favorite(asset, true)).toEqual({ status: 200 });
		expect(setFavorite).toHaveBeenCalledWith(asset, true);
	});

	it('rejects a non-UUID id without calling Immich', async () => {
		expect((await favorite('x', true)).status).toBe(400);
		expect(setFavorite).not.toHaveBeenCalled();
	});
});

describe('albumsOf', () => {
	it('lists the albums holding the asset', async () => {
		vi.mocked(getAlbumIdsOf).mockResolvedValue([album]);
		expect(await albumsOf(asset)).toEqual({ status: 200, albumIds: [album] });
	});
});

describe('setMembership', () => {
	it('adds when member is true and removes when false', async () => {
		vi.mocked(addToAlbum).mockResolvedValue([{ id: asset, success: true }]);
		vi.mocked(removeFromAlbum).mockResolvedValue([{ id: asset, success: true }]);
		expect((await setMembership(asset, album, true)).status).toBe(200);
		expect(addToAlbum).toHaveBeenCalledWith(album, [asset]);
		expect((await setMembership(asset, album, false)).status).toBe(200);
		expect(removeFromAlbum).toHaveBeenCalledWith(album, [asset]);
	});

	it('treats already added as success', async () => {
		vi.mocked(addToAlbum).mockResolvedValue([{ id: asset, success: false, error: BulkIdErrorReason.Duplicate }]);
		expect((await setMembership(asset, album, true)).status).toBe(200);
	});

	it('reports a refusal', async () => {
		vi.mocked(removeFromAlbum).mockResolvedValue([{ id: asset, success: false, error: BulkIdErrorReason.NoPermission }]);
		expect((await setMembership(asset, album, false)).status).toBe(409);
	});
});
