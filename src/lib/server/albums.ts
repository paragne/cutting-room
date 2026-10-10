import { DIGITS, type Hotkeys } from '../albumKeys';
import type { Db } from './db';
import { getAlbums } from './immich';
import { isUuid } from './media';

const SETTING = 'albumHotkeys';

export interface AlbumInfo {
	id: string;
	name: string;
	assetCount: number;
}

export interface AlbumList {
	albums: AlbumInfo[];
	hotkeys: Hotkeys;
}

/** Validates an untrusted body. Returns the hotkeys or a 400 message. */
export function parseHotkeys(body: unknown): Hotkeys | string {
	if (typeof body !== 'object' || body === null) return 'body must be an object';
	const { hotkeys } = body as Record<string, unknown>;
	if (typeof hotkeys !== 'object' || hotkeys === null || Array.isArray(hotkeys)) {
		return 'hotkeys must be an object';
	}
	const entries = Object.entries(hotkeys);
	for (const [digit, id] of entries) {
		if (!DIGITS.includes(digit)) return 'hotkey keys must be digits 0-9';
		if (typeof id !== 'string' || !isUuid(id)) return 'hotkey values must be UUIDs';
	}
	const ids = entries.map(([, id]) => id);
	if (new Set(ids).size !== ids.length) return 'an album can have only one hotkey';
	return Object.fromEntries(entries) as Hotkeys;
}

export function saveHotkeys(db: Db, hotkeys: Hotkeys): void {
	db.setSetting.run(SETTING, JSON.stringify(hotkeys));
}

// Albums deleted in Immich drop out here, so a stale binding never reaches the picker.
export async function listAlbums(db: Db): Promise<AlbumList> {
	const stored = db.getSetting.get(SETTING);
	const saved = stored ? (JSON.parse(stored.value) as Hotkeys) : {};
	const albums = (await getAlbums()).map((a) => ({
		id: a.id,
		name: a.albumName,
		assetCount: a.assetCount
	}));
	const live = new Set(albums.map((a) => a.id));
	const hotkeys = Object.fromEntries(Object.entries(saved).filter(([, id]) => live.has(id)));
	return { albums, hotkeys };
}
