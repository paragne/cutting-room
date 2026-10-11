import type { Db } from './db';
import { AssetOrder, SearchOrderField, type AssetResponseDto } from '@immich/sdk';
import { searchAssets, searchRandom } from './immich';
import type { Mode } from './modes';
import { photoshootAround } from './photoshoot';
import {
	decodeCursor,
	encodeCursor,
	PAGE_SIZE,
	scanPage,
	toItem,
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

const SEED_BATCH = 10;
// Bursts are found by a time window around a random asset; it must exceed the shot gap.
const WINDOW_MS = 10 * 60_000;
const WINDOW_SIZE = 200;
const PHOTOSHOOT_CURSOR = 'photoshoot';

// The unreviewed shots around a seed that form a photoshoot, or null if it sits in none.
// Trashed and kept shots are skipped, so a half-reviewed burst shrinks.
export async function shootAround(
	db: Db,
	seed: AssetResponseDto
): Promise<AssetResponseDto[] | null> {
	const t = Date.parse(seed.fileCreatedAt);
	const near = await searchAssets({
		filter: {
			takenAt: {
				gte: new Date(t - WINDOW_MS).toISOString(),
				lt: new Date(t + WINDOW_MS + 1).toISOString()
			}
		},
		orderBy: {
			field: SearchOrderField.FileCreatedAt,
			direction: AssetOrder.Asc
		},
		size: WINDOW_SIZE
	});
	const reviewed = new Set(
		db.reviewedAmong.all(JSON.stringify(near.map((a) => a.id))).map((r) => r.assetId)
	);
	const open = near.filter((a) => !reviewed.has(a.id));
	const shoot = photoshootAround(
		open.map((a) => ({ id: a.id, at: Date.parse(a.fileCreatedAt) })),
		seed.id
	);
	if (shoot === null) return null;
	const byId = new Map(open.map((a) => [a.id, a]));
	return shoot.map((s) => byId.get(s.id)!);
}

// One photoshoot per page: random assets are tried as seeds until one sits in a shoot.
async function photoshoot(db: Db): Promise<ModePage> {
	const seeds = await searchRandom({ filter: {}, size: SEED_BATCH });
	for (const seed of seeds) {
		const shoot = await shootAround(db, seed);
		if (shoot !== null) return { items: shoot.map(toItem), cursor: PHOTOSHOOT_CURSOR };
	}
	return { items: [], cursor: PHOTOSHOOT_CURSOR };
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
export function nextPage(
	db: Db,
	mode: Exclude<Mode, { kind: 'clockin' }>,
	raw: string | null
): Promise<ModePage | null> {
	switch (mode.kind) {
		case 'shuffle':
			return raw === null || raw === SHUFFLE_CURSOR ? shuffle(db) : Promise.resolve(null);
		case 'photoshoot':
			return raw === null || raw === PHOTOSHOOT_CURSOR ? photoshoot(db) : Promise.resolve(null);
		case 'album':
			return album(db, mode.albumId, raw);
	}
}
