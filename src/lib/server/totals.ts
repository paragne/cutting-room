import { getDb } from './db';
import { getTimelineStats } from './immich';

export async function libraryTotals() {
	const { kept, trashed, bytesTrashed } = getDb().statTotals.get()!;
	const { total } = await getTimelineStats();
	return { reviewed: kept + trashed, trashed, bytesTrashed, libraryNow: total };
}
