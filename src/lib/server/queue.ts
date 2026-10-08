import { AssetOrder, SearchOrderField, type AssetResponseDto, type DateFilter } from '@immich/sdk';
import type { Db } from './db';
import { searchAssets } from './immich';
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
}

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

function toItem(a: AssetResponseDto): QueueItem {
	return {
		id: a.id,
		type: a.type,
		localDateTime: a.localDateTime,
		isFavorite: a.isFavorite,
		duration: a.duration
	};
}

/** Next page of unreviewed timeline assets. A null cursor in the result means the end. */
export async function nextPage(
	db: Db,
	order: Order,
	cursor: Cursor | null
): Promise<{ items: QueueItem[]; cursor: Cursor | null }> {
	const items: QueueItem[] = [];
	let c = cursor;
	while (items.length < PAGE_SIZE) {
		const size = BATCH_SIZE + (c?.ids.length ?? 0);
		const assets = await searchAssets({
			filter: c ? { takenAt: takenAtBound(order, c.t) } : {},
			orderBy: {
				field: SearchOrderField.FileCreatedAt,
				direction: order === 'oldest' ? AssetOrder.Asc : AssetOrder.Desc
			},
			size
		});
		const passed = new Set(c?.ids);
		const fresh = assets.filter((a) => !passed.has(a.id));
		const reviewed = new Set(
			db.reviewedAmong.all(JSON.stringify(fresh.map((a) => a.id))).map((r) => r.assetId)
		);
		for (const a of fresh) {
			if (items.length === PAGE_SIZE) return { items, cursor: c };
			c = pass(c, a);
			if (!reviewed.has(a.id)) items.push(toItem(a));
		}
		if (assets.length < size) return { items, cursor: null };
	}
	return { items, cursor: c };
}
