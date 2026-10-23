import type { Custom } from './custom';
import type { Db } from './db';
import type { AssetFilter } from './immich';
import { GAP_MS, MAX_SHOTS, MIN_SHOTS } from './photoshoot';
import {
	PAGE_SIZE,
	timeline,
	toItem,
	wanted,
	type Cursor,
	type Passed,
	type QueueItem,
	type Reviewed
} from './queue';

/**
 * Next page of a filtered scan, oldest first, split by photoshoot. `singles` returns shots
 * outside any run of `MIN_SHOTS`, `shoots` one run per page. Runs are found among the
 * assets that pass `reviewed`, so reviewed shots shrink a run as in photoshoot mode.
 *
 * A page ends only where a run is known to be over, so the next page starts with no run
 * open. Learning that can read into the next batch, which the next page fetches again.
 */
export async function groupPage(
	db: Db,
	scope: AssetFilter,
	cursor: Cursor | null,
	reviewed: Reviewed,
	group: Exclude<Custom['group'], 'both'>
): Promise<{ items: QueueItem[]; cursor: Cursor | null }> {
	const items: QueueItem[] = [];
	let run: Passed[] = [];
	const close = (): Cursor => {
		if ((run.length >= MIN_SHOTS) === (group === 'shoots')) {
			items.push(...run.map((p) => toItem(p.asset)));
		}
		const end = run.at(-1)!.cursor;
		run = [];
		return end;
	};
	const at = (p: Passed) => Date.parse(p.asset.fileCreatedAt);
	for await (const p of timeline(db, scope, 'oldest', cursor)) {
		if (!wanted(p.isReviewed, reviewed)) continue;
		const last = run.at(-1);
		if (last && at(p) - at(last) > GAP_MS) {
			const end = close();
			// Singles land a run at a time, so a page can hold one or two more than PAGE_SIZE.
			if (group === 'shoots' ? items.length > 0 : items.length >= PAGE_SIZE) {
				return { items, cursor: end };
			}
		}
		run.push(p);
		// The rest of a longer run starts the next page as a run of its own.
		if (group === 'shoots' && run.length === MAX_SHOTS) return { items, cursor: close() };
	}
	if (run.length > 0) close();
	return { items, cursor: null };
}
