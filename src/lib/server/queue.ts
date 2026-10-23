import { AssetOrder, SearchOrderField, type AssetResponseDto, type DateFilter } from '@immich/sdk';
import type { Custom } from './custom';
import type { Db } from './db';
import { searchAssets, type AssetFilter } from './immich';
import { isUuid } from './media';

export type Order = 'oldest' | 'newest';

/**
 * Keyset position: the takenAt of the last asset passed, plus every id passed at
 * exactly that time. Offset paging would skip assets once earlier ones are trashed,
 * and takenAt alone would skip or repeat assets that share a timestamp.
 */
export interface Cursor {
	t: string;
	ids: string[];
}

export interface QueueItem {
	id: string;
	type: AssetResponseDto['type'];
	/** Wall-clock time where the photo was taken, for display. */
	localDateTime: string;
	isFavorite: boolean;
	/** Milliseconds, null for images. */
	duration: number | null;
	/** GIFs play from the original file, since previews are stills. */
	isGif: boolean;
}

export type Reviewed = Custom['reviewed'];

export const PAGE_SIZE = 20;
// Reviewed assets are dropped after fetching, so fetch more than a page at a time.
const BATCH_SIZE = 200;

const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
// Immich rejects a search size over 1000; batch plus tied ids must stay under it.
const MAX_TIED_IDS = 500;

export function encodeCursor(c: Cursor): string {
	return Buffer.from(JSON.stringify(c)).toString('base64url');
}

/** Returns null for anything that is not a cursor this module produced. */
export function decodeCursor(raw: string): Cursor | null {
	let value: unknown;
	try {
		value = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8'));
	} catch {
		return null;
	}
	if (typeof value !== 'object' || value === null) return null;
	const { t, ids } = value as Record<string, unknown>;
	if (typeof t !== 'string' || !ISO.test(t) || Number.isNaN(Date.parse(t))) return null;
	if (!Array.isArray(ids) || ids.length === 0 || ids.length > MAX_TIED_IDS) return null;
	if (!ids.every((id) => typeof id === 'string' && isUuid(id))) return null;
	return { t, ids };
}

// The API serializes takenAt to milliseconds; the database may hold more digits.
// gte on a truncated time still includes the asset, lte would not, so newest-first
// bounds with lt one millisecond later.
function takenAtBound(order: Order, t: string): DateFilter {
	if (order === 'oldest') return { gte: t };
	return { lt: new Date(Date.parse(t) + 1).toISOString() };
}

function pass(c: Cursor | null, a: AssetResponseDto): Cursor {
	if (c && c.t === a.fileCreatedAt) return { t: c.t, ids: [...c.ids, a.id] };
	return { t: a.fileCreatedAt, ids: [a.id] };
}

/** Whether an asset with this review state passes the reviewed filter. */
export function wanted(isReviewed: boolean, reviewed: Reviewed): boolean {
	return reviewed === 'both' || isReviewed === (reviewed === 'yes');
}

export function toItem(a: AssetResponseDto): QueueItem {
	return {
		id: a.id,
		type: a.type,
		localDateTime: a.localDateTime,
		isFavorite: a.isFavorite,
		duration: a.duration,
		isGif: a.originalMimeType === 'image/gif'
	};
}

export interface Passed {
	asset: AssetResponseDto;
	isReviewed: boolean;
	/** Position just past this asset. */
	cursor: Cursor;
}

/**
 * Timeline assets matching `scope` after `cursor`, fetched in batches as the caller
 * reads. `scope.takenAt` bounds the scan; the cursor tightens it.
 */
export async function* timeline(
	db: Db,
	scope: AssetFilter,
	order: Order,
	cursor: Cursor | null
): AsyncGenerator<Passed> {
	let c = cursor;
	for (;;) {
		const size = BATCH_SIZE + (c?.ids.length ?? 0);
		const assets = await searchAssets({
			filter: c ? { ...scope, takenAt: { ...scope.takenAt, ...takenAtBound(order, c.t) } } : scope,
			orderBy: {
				field: SearchOrderField.FileCreatedAt,
				direction: order === 'oldest' ? AssetOrder.Asc : AssetOrder.Desc
			},
			size
		});
		const passed = new Set(c?.ids);
		const fresh = assets.filter((a) => !passed.has(a.id));
		const done = new Set(
			db.reviewedAmong.all(JSON.stringify(fresh.map((a) => a.id))).map((r) => r.assetId)
		);
		for (const a of fresh) {
			c = pass(c, a);
			yield { asset: a, isReviewed: done.has(a.id), cursor: c };
		}
		if (assets.length < size) return;
	}
}

/** Next page of timeline assets matching `scope` and `reviewed`. A null cursor means the end. */
export async function scanPage(
	db: Db,
	scope: AssetFilter,
	order: Order,
	cursor: Cursor | null,
	reviewed: Reviewed = 'no'
): Promise<{ items: QueueItem[]; cursor: Cursor | null }> {
	const items: QueueItem[] = [];
	let c = cursor;
	for await (const p of timeline(db, scope, order, cursor)) {
		if (items.length === PAGE_SIZE) return { items, cursor: c };
		c = p.cursor;
		if (wanted(p.isReviewed, reviewed)) items.push(toItem(p.asset));
	}
	return { items, cursor: null };
}
