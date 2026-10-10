import type { Db } from './db';
import { searchRandom } from './immich';
import { firstPastYear, MIN_YEAR, onThisDayRange, type Mode } from './modes';
import {
	decodeCursor,
	encodeCursor,
	PAGE_SIZE,
	scanPage,
	toItem,
	type Cursor,
	type QueueItem
} from './queue';

export interface ModePage {
	items: QueueItem[];
	cursor: string | null;
}

const SHUFFLE_BATCH = 200;
// Random batches that are all reviewed in a row before the library counts as done.
const SHUFFLE_MISSES = 3;
const SHUFFLE_CURSOR = 'shuffle';

async function shuffle(db: Db): Promise<ModePage> {
	for (let miss = 0; miss < SHUFFLE_MISSES; miss++) {
		const assets = await searchRandom({ filter: {}, size: SHUFFLE_BATCH });
		const reviewed = new Set(
			db.reviewedAmong.all(JSON.stringify(assets.map((a) => a.id))).map((r) => r.assetId)
		);
		const items = assets
			.filter((a) => !reviewed.has(a.id))
			.slice(0, PAGE_SIZE)
			.map(toItem);
		if (items.length > 0) return { items, cursor: SHUFFLE_CURSOR };
	}
	return { items: [], cursor: null };
}

// On this day: past years newest first, oldest first within a year. The cursor
// is the year being scanned, a dot, and that year's keyset cursor (empty at the start).
function decodeYearCursor(raw: string, day: string): { year: number; c: Cursor | null } | null {
	const [y, inner, ...rest] = raw.split('.');
	const year = Number(y);
	const first = firstPastYear(day);
	if (rest.length > 0 || inner === undefined || first === null) return null;
	if (!Number.isInteger(year) || year < MIN_YEAR || year > first) return null;
	if (inner === '') return { year, c: null };
	const c = decodeCursor(inner);
	return c && { year, c };
}

async function onThisDay(db: Db, day: string, raw: string | null): Promise<ModePage | null> {
	const first = firstPastYear(day);
	if (first === null) return { items: [], cursor: null };
	const start = raw === null ? { year: first, c: null } : decodeYearCursor(raw, day);
	if (start === null) return null;
	let c = start.c;
	for (let year = start.year; year >= MIN_YEAR; year--) {
		const page = await scanPage(db, { takenAt: onThisDayRange(day, year) }, 'oldest', c);
		c = null;
		if (page.cursor) {
			return {
				items: page.items,
				cursor: `${year}.${encodeCursor(page.cursor)}`
			};
		}
		if (page.items.length > 0) {
			return {
				items: page.items,
				cursor: year > MIN_YEAR ? `${year - 1}.` : null
			};
		}
	}
	return { items: [], cursor: null };
}

async function album(db: Db, albumId: string, raw: string | null): Promise<ModePage | null> {
	const cursor = raw === null ? null : decodeCursor(raw);
	if (raw !== null && cursor === null) return null;
	const page = await scanPage(db, { albumIds: { any: [albumId] } }, 'oldest', cursor);
	return {
		items: page.items,
		cursor: page.cursor && encodeCursor(page.cursor)
	};
}

/** Next page for a mode. Null means the cursor is not one this mode produced. */
export function nextPage(db: Db, mode: Mode, raw: string | null): Promise<ModePage | null> {
	switch (mode.kind) {
		case 'shuffle':
			return raw === null || raw === SHUFFLE_CURSOR ? shuffle(db) : Promise.resolve(null);
		case 'onThisDay':
			return onThisDay(db, mode.day, raw);
		case 'album':
			return album(db, mode.albumId, raw);
	}
}
