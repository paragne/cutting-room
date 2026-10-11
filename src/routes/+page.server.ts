import { getDb } from '$lib/server/db';
import { getTimelineStats } from '$lib/server/immich';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const db = getDb();
	const { kept, trashed, bytesTrashed } = db.statTotals.get()!;
	const { total } = await getTimelineStats();
	return {
		reviewed: kept + trashed,
		trashed,
		bytesTrashed,
		libraryNow: total,
		activeDays: db.activeDays.all().map((r) => r.day)
	};
};
