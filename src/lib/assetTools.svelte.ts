import * as api from './api';
import type { Hotkeys } from './albumKeys';
import { shareOrDownload } from './share';
import type { AlbumList } from './server/albums';
import type { QueueItem } from './server/queue';

/** Album, details, favorite and share state for the asset on screen. None of it records a decision. */
export class AssetTools {
	albumList = $state<AlbumList>({ albums: [], hotkeys: {} });
	albumFor = $state<string | null>(null);
	infoFor = $state<string | null>(null);
	// Assets this shift put in an album; Immich is asked only when the sheet opens.
	inAlbum = $state<string[]>([]);
	#onerror: (e: unknown) => void;
	#onalbumed: (id: string) => void;

	constructor(onerror: (e: unknown) => void, onalbumed: (id: string) => void) {
		this.#onerror = onerror;
		this.#onalbumed = onalbumed;
	}

	async load(): Promise<void> {
		try {
			this.albumList = await api.albums();
		} catch (e) {
			this.#onerror(e);
		}
	}

	async saveHotkeys(hotkeys: Hotkeys): Promise<void> {
		try {
			await api.saveHotkeys(hotkeys);
			this.albumList = { ...this.albumList, hotkeys };
		} catch (e) {
			this.#onerror(e);
		}
	}

	/** Called by the album sheet with the albums that now hold the asset. */
	albumed(id: string, albumIds: string[]): void {
		const others = this.inAlbum.filter((i) => i !== id);
		this.inAlbum = albumIds.length > 0 ? [...others, id] : others;
		if (albumIds.length > 0) this.#onalbumed(id);
	}

	async addTo(id: string, albumId: string): Promise<void> {
		try {
			await api.setMember(id, albumId, true);
			this.albumed(id, [albumId]);
		} catch (e) {
			this.#onerror(e);
		}
	}

	async toggleFavorite(item: QueueItem): Promise<void> {
		try {
			await api.setFavorite(item.id, !item.isFavorite);
			item.isFavorite = !item.isFavorite;
		} catch (e) {
			this.#onerror(e);
		}
	}

	async share(id: string): Promise<void> {
		try {
			await shareOrDownload(await api.originalFile(id));
		} catch (e) {
			this.#onerror(e);
		}
	}
}
