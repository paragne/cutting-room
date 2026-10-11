import { getConfig } from '$lib/server/config';
import { libraryTotals } from '$lib/server/totals';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => ({
	shiftMinutes: getConfig().shiftMinutes,
	totals: await libraryTotals()
});
