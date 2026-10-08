import * as sdk from '@immich/sdk';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { type AssetFilter, checkServer, ImmichSafetyError, searchAssets, trashAssets } from './immich';

vi.mock('@immich/sdk', async (importOriginal) => ({
	...(await importOriginal<typeof import('@immich/sdk')>()),
	init: vi.fn(),
	getServerVersion: vi.fn(),
	getServerFeatures: vi.fn(),
	searchAssets: vi.fn(),
	deleteAssets: vi.fn(),
	getAssetStatistics: vi.fn()
}));
vi.mock('./config', () => ({
	getConfig: () => ({ immichUrl: 'http://immich.test', immichApiKey: 'test-key' })
}));
vi.mock('./log', () => ({ log: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));

const m = vi.mocked(sdk);

function server(version: Partial<sdk.ServerVersionResponseDto>, trash: boolean): void {
	m.getServerVersion.mockResolvedValue({ major: 3, minor: 2, patch: 0, prerelease: null, ...version });
	m.getServerFeatures.mockResolvedValue({ trash } as sdk.ServerFeaturesDto);
	m.getAssetStatistics.mockResolvedValue({ images: 0, videos: 0, total: 0 });
}

beforeEach(() => vi.clearAllMocks());

describe('checkServer', () => {
	it('passes on 3.2.0 with trash enabled', async () => {
		server({}, true);
		await expect(checkServer()).resolves.toBeUndefined();
		expect(m.init).toHaveBeenCalledWith({ baseUrl: 'http://immich.test/api', apiKey: 'test-key' });
	});

	it.each([
		['newer patch', { patch: 1 }],
		['older minor', { minor: 1 }],
		['prerelease', { prerelease: 1 }]
	])('rejects %s', async (_, version) => {
		server(version, true);
		await expect(checkServer()).rejects.toThrow(ImmichSafetyError);
	});

	it('rejects when trash is disabled', async () => {
		server({}, false);
		await expect(checkServer()).rejects.toThrow(/trash is disabled/);
	});

	it('rejects when the API key is not accepted', async () => {
		server({}, true);
		m.getAssetStatistics.mockRejectedValue(new Error('401'));
		await expect(checkServer()).rejects.toThrow('401');
	});
});

describe('trashAssets', () => {
	it('refuses and sends nothing when trash is disabled', async () => {
		server({}, false);
		await expect(trashAssets(['a'])).rejects.toThrow(ImmichSafetyError);
		expect(m.deleteAssets).not.toHaveBeenCalled();
	});

	it('trashes without force when trash is enabled', async () => {
		server({}, true);
		await trashAssets(['a', 'b']);
		expect(m.deleteAssets).toHaveBeenCalledWith({
			assetBulkDeleteDto: { ids: ['a', 'b'], force: false }
		});
	});

	it('checks trash on every call, not once', async () => {
		server({}, true);
		await trashAssets(['a']);
		server({}, false);
		await expect(trashAssets(['b'])).rejects.toThrow(ImmichSafetyError);
		expect(m.deleteAssets).toHaveBeenCalledTimes(1);
	});
});

describe('searchAssets', () => {
	const orderBy = { field: sdk.SearchOrderField.FileCreatedAt, direction: sdk.AssetOrder.Asc };

	it('always restricts to untrashed timeline assets', async () => {
		m.searchAssets.mockResolvedValue({ assets: { items: [] } } as unknown as sdk.SearchResponseDto);
		const smuggled = {
			takenAt: { gte: '2020-01-01T00:00:00.000Z' },
			trashedAt: { ne: null },
			visibility: { eq: sdk.AssetVisibility.Archive }
		} as AssetFilter;
		await searchAssets({ filter: smuggled, orderBy, size: 10 });
		expect(m.searchAssets.mock.calls[0]?.[0].metadataSearchDto.filter).toEqual({
			takenAt: { gte: '2020-01-01T00:00:00.000Z' },
			trashedAt: { eq: null },
			visibility: { eq: sdk.AssetVisibility.Timeline }
		});
	});
});
