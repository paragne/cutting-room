import * as sdk from '@immich/sdk';
import {
	AssetVisibility,
	type AlbumResponseDto,
	type AssetResponseDto,
	type AssetStatsResponseDto,
	type BulkIdResponseDto,
	type DuplicateResponseDto,
	type SearchFilter,
	type SearchOrder
} from '@immich/sdk';
import { getConfig } from './config';
import { log } from './log';

// The SDK must match the server exactly; see docs/IMMICH-API.md.
const EXPECTED_VERSION = '3.2.0';

export class ImmichSafetyError extends Error {
	name = 'ImmichSafetyError';
}

let connected = false;

// Lazy so that importing this module (for example during build analysis) needs no env.
function connect(): void {
	if (connected) return;
	const { immichUrl, immichApiKey } = getConfig();
	sdk.init({ baseUrl: `${immichUrl}/api`, apiKey: immichApiKey });
	connected = true;
}

export async function checkServer(): Promise<void> {
	connect();
	const v = await sdk.getServerVersion();
	const version = `${v.major}.${v.minor}.${v.patch}`;
	if (version !== EXPECTED_VERSION || v.prerelease !== null) {
		throw new ImmichSafetyError(
			`Immich server is ${version}${v.prerelease !== null ? `-${v.prerelease}` : ''}, expected ${EXPECTED_VERSION}`
		);
	}
	await assertTrashEnabled();
	// Version and features are public endpoints; this call proves the key works.
	await getTimelineStats();
	log.info('immich server ready', { version });
}

// With trash disabled, a non-force delete is purged at the next nightly job,
// and trash can be turned off in the admin UI at any time. So check every call.
async function assertTrashEnabled(): Promise<void> {
	const { trash } = await sdk.getServerFeatures();
	if (!trash) throw new ImmichSafetyError('Immich trash is disabled; refusing to trash assets');
}

// The v3.2 filter shape has no implicit filters, so these are always added.
// `or` is excluded because a branch could match outside them.
export type AssetFilter = Omit<SearchFilter, 'trashedAt' | 'visibility' | 'or'>;

function liveTimeline(filter: AssetFilter): SearchFilter {
	return { ...filter, trashedAt: { eq: null }, visibility: { eq: AssetVisibility.Timeline } };
}

export async function searchAssets(query: {
	filter: AssetFilter;
	orderBy: SearchOrder;
	size: number;
}): Promise<AssetResponseDto[]> {
	connect();
	const res = await sdk.searchAssets({
		metadataSearchDto: { filter: liveTimeline(query.filter), orderBy: query.orderBy, size: query.size }
	});
	return res.assets.items;
}

export async function searchRandom(query: {
	filter: AssetFilter;
	size: number;
}): Promise<AssetResponseDto[]> {
	connect();
	return sdk.searchRandom({
		randomSearchDto: { filter: liveTimeline(query.filter), size: query.size }
	});
}

export async function getAsset(id: string): Promise<AssetResponseDto> {
	connect();
	return sdk.getAssetInfo({ id });
}

export async function getTimelineStats(): Promise<AssetStatsResponseDto> {
	connect();
	return sdk.getAssetStatistics({ visibility: AssetVisibility.Timeline, isTrashed: false });
}

export async function trashAssets(ids: string[]): Promise<void> {
	connect();
	await assertTrashEnabled();
	await sdk.deleteAssets({ assetBulkDeleteDto: { ids, force: false } });
}

export async function restoreAssets(ids: string[]): Promise<number> {
	connect();
	const { count } = await sdk.restoreAssets({ bulkIdsDto: { ids } });
	return count;
}

export async function setFavorite(id: string, isFavorite: boolean): Promise<void> {
	connect();
	await sdk.updateAsset({ id, updateAssetDto: { isFavorite } });
}

export async function getAlbums(): Promise<AlbumResponseDto[]> {
	connect();
	return sdk.getAllAlbums({});
}

// Returns per-id results: Immich reports a duplicate or missing id there, not as an HTTP error.
export async function addToAlbum(albumId: string, ids: string[]): Promise<BulkIdResponseDto[]> {
	connect();
	return sdk.addAssetsToAlbum({ id: albumId, bulkIdsDto: { ids } });
}

export async function getDuplicates(): Promise<DuplicateResponseDto[]> {
	connect();
	return sdk.getAssetDuplicates();
}

export type MediaKind = 'thumbnail' | 'preview' | 'video';

// Never `fullsize`: Immich answers it with a redirect to the original, which needs
// asset.download. The SDK's Blob calls buffer whole files, so this uses fetch.
const MEDIA_PATH: Record<MediaKind, string> = {
	thumbnail: 'thumbnail?size=thumbnail',
	preview: 'thumbnail?size=preview',
	video: 'video/playback'
};

export async function fetchMedia(
	id: string,
	kind: MediaKind,
	range: string | null,
	signal: AbortSignal
): Promise<Response> {
	const { immichUrl, immichApiKey } = getConfig();
	const headers: Record<string, string> = {
		'x-api-key': immichApiKey,
		// Fetch would otherwise decompress and leave Content-Length describing the wrong body.
		'accept-encoding': 'identity'
	};
	if (range !== null) headers.range = range;
	return fetch(`${immichUrl}/api/assets/${id}/${MEDIA_PATH[kind]}`, {
		headers,
		redirect: 'error',
		signal
	});
}
