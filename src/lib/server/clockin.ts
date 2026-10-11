import type { Db } from './db';
import { searchRandom } from './immich';
import { shootAround } from './queueModes';
import { toItem, type QueueItem } from './queue';

export type QueueEntry = { kind: 'card'; item: QueueItem } | { kind: 'burst'; items: QueueItem[] };

export interface ClockinPage {
	entries: QueueEntry[];
	cursor: string | null;
}

const CURSOR = 'clockin';
const SEED_BATCH = 200;
// Each seed costs one Immich search to look for a burst, so a page stays small.
const PAGE_ENTRIES = 10;
// Random batches that are all reviewed in a row before the library counts as done.
const MISSES = 3;

/** Next page for clock in: random unreviewed photos, each a card or the burst it sits in. */
export async function clockinPage(db: Db, raw: string | null): Promise<ClockinPage | null> {
	if (raw !== null && raw !== CURSOR) return null;
	for (let miss = 0; miss < MISSES; miss++) {
		const assets = await searchRandom({ filter: {}, size: SEED_BATCH });
		const reviewed = new Set(
			db.reviewedAmong.all(JSON.stringify(assets.map((a) => a.id))).map((r) => r.assetId)
		);
		const taken = new Set<string>();
		const entries: QueueEntry[] = [];
		for (const seed of assets) {
			if (entries.length >= PAGE_ENTRIES) break;
			if (reviewed.has(seed.id) || taken.has(seed.id)) continue;
			const shoot = await shootAround(db, seed);
			const members = shoot ?? [seed];
			for (const m of members) taken.add(m.id);
			entries.push(
				shoot === null
					? { kind: 'card', item: toItem(seed) }
					: { kind: 'burst', items: shoot.map(toItem) }
			);
		}
		if (entries.length > 0) return { entries, cursor: CURSOR };
	}
	return { entries: [], cursor: null };
}
