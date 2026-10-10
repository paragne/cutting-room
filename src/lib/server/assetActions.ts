import { addToAlbum, getAlbumIdsOf, removeFromAlbum, setFavorite } from './immich';
import { isUuid } from './media';

export type ActionOutcome<T = object> =
	| ({ status: 200 } & T)
	| { status: 400 | 409; message: string };

export function parseFavorite(body: unknown): boolean | string {
	const favorite = (body as Record<string, unknown> | null)?.favorite;
	return typeof favorite === 'boolean' ? favorite : 'favorite must be a boolean';
}

export function parseMembership(body: unknown): { albumId: string; member: boolean } | string {
	const { albumId, member } = (body ?? {}) as Record<string, unknown>;
	if (typeof albumId !== 'string' || !isUuid(albumId)) return 'albumId must be a UUID';
	if (typeof member !== 'boolean') return 'member must be a boolean';
	return { albumId, member };
}

export async function favorite(id: string, value: boolean): Promise<ActionOutcome> {
	if (!isUuid(id)) return { status: 400, message: 'id must be a UUID' };
	await setFavorite(id, value);
	return { status: 200 };
}

export async function albumsOf(id: string): Promise<ActionOutcome<{ albumIds: string[] }>> {
	if (!isUuid(id)) return { status: 400, message: 'id must be a UUID' };
	return { status: 200, albumIds: await getAlbumIdsOf(id) };
}

// Immich reports a refused change per id, not as an HTTP error. Already in (or already
// out of) the album is the state the caller asked for, so it counts as success.
export async function setMembership(
	id: string,
	albumId: string,
	member: boolean
): Promise<ActionOutcome> {
	if (!isUuid(id)) return { status: 400, message: 'id must be a UUID' };
	const [result] = await (member ? addToAlbum : removeFromAlbum)(albumId, [id]);
	if (!result?.success && result?.error !== 'duplicate' && result?.error !== 'not_found') {
		return { status: 409, message: `album refused the change (${result?.error ?? 'no result'})` };
	}
	return { status: 200 };
}
