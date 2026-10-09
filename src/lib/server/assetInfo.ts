import type { AssetResponseDto } from '@immich/sdk';
import { getAsset } from './immich';
import { isUuid } from './media';

/** The metadata fields the details panel shows, nothing else from Immich. */
export interface AssetInfo {
	fileName: string;
	camera: string | null;
	lens: string | null;
	width: number | null;
	height: number | null;
	sizeBytes: number | null;
	place: string | null;
}

export type InfoOutcome =
	| { status: 200; info: AssetInfo }
	| { status: 400 | 404; message: string };

function joined(...parts: (string | null | undefined)[]): string | null {
	return parts.filter(Boolean).join(', ') || null;
}

export function toInfo(a: AssetResponseDto): AssetInfo {
	const exif = a.exifInfo;
	const camera = [exif?.make, exif?.model].filter(Boolean).join(' ');
	return {
		fileName: a.originalFileName,
		camera: camera || null,
		lens: exif?.lensModel ?? null,
		width: exif?.exifImageWidth ?? a.width,
		height: exif?.exifImageHeight ?? a.height,
		sizeBytes: exif?.fileSizeInByte ?? null,
		place: joined(exif?.city, exif?.state, exif?.country)
	};
}

export async function loadInfo(id: string): Promise<InfoOutcome> {
	if (!isUuid(id)) return { status: 400, message: 'id must be a UUID' };
	const asset = await getAsset(id);
	if (!asset) return { status: 404, message: 'asset not found' };
	return { status: 200, info: toInfo(asset) };
}
