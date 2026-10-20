import { parseCustom, type Custom } from './custom';
import { isUuid } from './media';

export type Mode =
	| { kind: 'shuffle' }
	| { kind: 'photoshoot' }
	| { kind: 'dailies' }
	| { kind: 'album'; albumId: string }
	| { kind: 'custom'; custom: Custom };

/** Returns null when the query names an unknown mode or lacks a valid argument for it. */
export function parseMode(params: URLSearchParams): Mode | null {
	const kind = params.get('mode') ?? 'shuffle';
	if (kind === 'shuffle' || kind === 'photoshoot' || kind === 'dailies') return { kind };
	if (kind === 'album') {
		const albumId = params.get('album');
		return albumId !== null && isUuid(albumId) ? { kind, albumId } : null;
	}
	if (kind === 'custom') {
		// The cursor is the queue's, so only the remaining keys are settings.
		const settings = new URLSearchParams(params);
		settings.delete('mode');
		settings.delete('cursor');
		const custom = parseCustom(settings);
		return custom && { kind, custom };
	}
	return null;
}
