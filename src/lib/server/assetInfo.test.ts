import type { AssetResponseDto } from '@immich/sdk';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { loadInfo, toInfo } from './assetInfo';
import { getAsset } from './immich';

vi.mock('./immich', () => ({ getAsset: vi.fn() }));

const ID = '00000000-0000-4000-8000-000000000001';

function asset(over: Partial<AssetResponseDto> = {}): AssetResponseDto {
	return {
		id: ID,
		originalFileName: 'IMG_0001.jpg',
		width: 4000,
		height: 3000,
		...over
	} as AssetResponseDto;
}

describe('toInfo', () => {
	it('joins camera and place parts and prefers exif dimensions', () => {
		const info = toInfo(
			asset({
				exifInfo: {
					make: 'Fuji',
					model: 'X100V',
					lensModel: '23mm',
					city: 'Lyon',
					state: null,
					country: 'France',
					exifImageWidth: 6000,
					exifImageHeight: 4000,
					fileSizeInByte: 1234
				}
			})
		);
		expect(info).toEqual({
			fileName: 'IMG_0001.jpg',
			camera: 'Fuji X100V',
			lens: '23mm',
			width: 6000,
			height: 4000,
			sizeBytes: 1234,
			place: 'Lyon, France'
		});
	});

	it('reports missing exif as nulls and falls back to asset dimensions', () => {
		expect(toInfo(asset())).toEqual({
			fileName: 'IMG_0001.jpg',
			camera: null,
			lens: null,
			width: 4000,
			height: 3000,
			sizeBytes: null,
			place: null
		});
	});
});

describe('loadInfo', () => {
	beforeEach(() => vi.mocked(getAsset).mockReset());

	it('rejects a non-UUID id without calling Immich', async () => {
		expect(await loadInfo('../etc/passwd')).toMatchObject({ status: 400 });
		expect(getAsset).not.toHaveBeenCalled();
	});

	it('answers 404 when Immich does not know the asset', async () => {
		vi.mocked(getAsset).mockResolvedValue(null);
		expect(await loadInfo(ID)).toMatchObject({ status: 404 });
	});

	it('returns the info for a known asset', async () => {
		vi.mocked(getAsset).mockResolvedValue(asset());
		expect(await loadInfo(ID)).toMatchObject({ status: 200, info: { fileName: 'IMG_0001.jpg' } });
	});
});
