import type { Db } from './db';
import { AssetOrder, SearchOrderField, type AssetResponseDto } from '@immich/sdk';
import { customFilter, type Custom } from './custom';
import { searchAssets, searchRandom, type AssetFilter } from './immich';
import type { Mode } from './modes';
import { photoshootAround } from './photoshoot';
import { groupPage } from './queueGroups';
import {
	decodeCursor,
	encodeCursor,
	PAGE_SIZE,
	scanPage,
	toItem,
	wanted,
	type QueueItem,
	type Reviewed
} from './queue';

export interface ModePage {
	items: QueueItem[];
	cursor: string | null;
}

const SHUFFLE_BATCH = 200;
// Random batches that are all reviewed in a row before the library counts as done.
const SHUFFLE_MISSES = 3;
const SHUFFLE_CURSOR = 'shuffle';

// With `singles`, each candidate costs one window search to rule out a photoshoot.
async function shuffle(
	db: Db,
	filter: AssetFilter,
	reviewed: Reviewed,
	singles = false
): Promise<ModePage> {
	for (let miss = 0; miss < SHUFFLE_MISSES; miss++) {
		const assets = await searchRandom({ filter, size: SHUFFLE_BATCH });
		const done = new Set(
			db.reviewedAmong.all(JSON.stringify(assets.map((a) => a.id))).map((r) => r.assetId)
		);
		const picks = assets.filter((a) => wanted(done.has(a.id), reviewed)).slice(0, PAGE_SIZE);
		const items: QueueItem[] = [];
		for (const a of picks) {
			if (!singles || (await shootAround(db, a, filter, reviewed)) === null) items.push(toItem(a));
		}
		if (items.length > 0) return { items, cursor: SHUFFLE_CURSOR };
	}
	return { items: [], cursor: null };
}

const SEED_BATCH = 10;
// Bursts are found by a time window around a random asset; it must exceed the shot gap.
const WINDOW_MS = 10 * 60_000;
const WINDOW_SIZE = 200;
const PHOTOSHOOT_CURSOR = 'photoshoot';

// The shots around a seed that pass `filter` and `reviewed` and form a photoshoot, or
// null if it sits in none. Shots that fail are skipped, so a half-reviewed burst shrinks.
export async function shootAround(
	db: Db,
	seed: AssetResponseDto,
	filter: AssetFilter = {},
	reviewed: Reviewed = 'no'
): Promise<AssetResponseDto[] | null> {
	const t = Date.parse(seed.fileCreatedAt);
	const gte = new Date(t - WINDOW_MS).toISOString();
	const lt = new Date(t + WINDOW_MS + 1).toISOString();
	const scope = filter.takenAt;
	// Same-format ISO strings compare in time order, so the window is clipped to the scope.
	const near = await searchAssets({
		filter: {
			...filter,
			takenAt: {
				gte: scope?.gte !== undefined && scope.gte > gte ? scope.gte : gte,
				lt: scope?.lt !== undefined && scope.lt < lt ? scope.lt : lt
			}
		},
		orderBy: {
			field: SearchOrderField.FileCreatedAt,
			direction: AssetOrder.Asc
		},
		size: WINDOW_SIZE
	});
	const done = new Set(
		db.reviewedAmong.all(JSON.stringify(near.map((a) => a.id))).map((r) => r.assetId)
	);
	const open = near.filter((a) => wanted(done.has(a.id), reviewed));
	const shoot = photoshootAround(
		open.map((a) => ({ id: a.id, at: Date.parse(a.fileCreatedAt) })),
		seed.id
	);
	if (shoot === null) return null;
	const byId = new Map(open.map((a) => [a.id, a]));
	return shoot.map((s) => byId.get(s.id)!);
}

// One photoshoot per page: random assets are tried as seeds until one sits in a shoot.
async function photoshoot(
	db: Db,
	filter: AssetFilter = {},
	reviewed: Reviewed = 'no'
): Promise<ModePage> {
	const seeds = await searchRandom({ filter, size: SEED_BATCH });
	for (const seed of seeds) {
		const shoot = await shootAround(db, seed, filter, reviewed);
		if (shoot !== null) return { items: shoot.map(toItem), cursor: PHOTOSHOOT_CURSOR };
	}
	return { items: [], cursor: PHOTOSHOOT_CURSOR };
}

async function scan(
	db: Db,
	filter: AssetFilter,
	raw: string | null,
	reviewed: Reviewed,
	group: Custom['group'] = 'both'
): Promise<ModePage | null> {
	const cursor = raw === null ? null : decodeCursor(raw);
	if (raw !== null && cursor === null) return null;
	const page =
		group === 'both'
			? await scanPage(db, filter, 'oldest', cursor, reviewed)
			: await groupPage(db, filter, cursor, reviewed, group);
	return {
		items: page.items,
		cursor: page.cursor && encodeCursor(page.cursor)
	};
}

function custom(db: Db, c: Custom, raw: string | null): Promise<ModePage | null> {
	const filter = customFilter(c);
	if (!c.shuffle) return scan(db, filter, raw, c.reviewed, c.group);
	if (c.group === 'shoots') {
		return raw === null || raw === PHOTOSHOOT_CURSOR
			? photoshoot(db, filter, c.reviewed)
			: Promise.resolve(null);
	}
	return raw === null || raw === SHUFFLE_CURSOR
		? shuffle(db, filter, c.reviewed, c.group === 'singles')
		: Promise.resolve(null);
}

/** Next page for a mode. Null means the cursor is not one this mode produced. */
export function nextPage(
	db: Db,
	mode: Exclude<Mode, { kind: 'dailies' }>,
	raw: string | null
): Promise<ModePage | null> {
	switch (mode.kind) {
		case 'shuffle':
			return raw === null || raw === SHUFFLE_CURSOR
				? shuffle(db, {}, 'no')
				: Promise.resolve(null);
		case 'photoshoot':
			return raw === null || raw === PHOTOSHOOT_CURSOR ? photoshoot(db) : Promise.resolve(null);
		case 'album':
			return scan(db, { albumIds: { any: [mode.albumId] } }, raw, 'no');
		case 'custom':
			return custom(db, mode.custom, raw);
	}
}
