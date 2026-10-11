import { isUuid } from './media';

export type Mode =
	| { kind: 'shuffle' }
	| { kind: 'photoshoot' }
	| { kind: 'dailies' }
	| { kind: 'album'; albumId: string };

/** Returns null when the query names an unknown mode or lacks a valid argument for it. */
export function parseMode(params: URLSearchParams): Mode | null {
	const kind = params.get('mode') ?? 'shuffle';
	if (kind === 'shuffle' || kind === 'photoshoot' || kind === 'dailies') return { kind };
	if (kind === 'album') {
		const albumId = params.get('album');
		return albumId !== null && isUuid(albumId) ? { kind, albumId } : null;
	}
	return null;
}
