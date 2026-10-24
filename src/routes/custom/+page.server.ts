import { listAlbums } from '$lib/server/albums';
import { getDb } from '$lib/server/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => ({
	albums: (await listAlbums(getDb())).albums
});
