import { getDb } from '$lib/server/db';
import { libraryTotals } from '$lib/server/totals';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => ({
	...(await libraryTotals()),
	activeDays: getDb()
		.activeDays.all()
		.map((r) => r.day)
});
