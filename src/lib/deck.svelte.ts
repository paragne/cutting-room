import { Unauthorized } from './api';
import type { Action } from './server/db';
import type { QueueItem } from './server/queue';

export interface Page {
	items: QueueItem[];
	cursor: string | null;
}

export interface DeckApi {
	page(cursor: string | null): Promise<Page>;
	decide(id: string, action: Action): Promise<void>;
	setFavorite(id: string, favorite: boolean): Promise<void>;
	undo(id: string): Promise<void>;
}

export interface Cut {
	item: QueueItem;
	action: Action;
}

const PRELOAD = 3;
// Fetch while a few cards remain so the user never waits on Immich mid-swipe.
const LOW_WATER = 5;

/**
 * The cards ahead and the decisions made this session. A decide or undo moves
 * the deck only after the server confirms, so a failure leaves it unchanged.
 */
export class Deck {
	history = $state<Cut[]>([]);
	busy = $state(false);
	error = $state<string | null>(null);
	/** The session ended; the screen sends the user to /login. */
	expired = $state(false);
	#cards = $state<QueueItem[]>([]);
	#exhausted = $state(false);
	#cursor: string | null = null;
	#fetching: Promise<void> | null = null;
	#api: DeckApi;

	constructor(api: DeckApi) {
		this.#api = api;
	}

	get current(): QueueItem | undefined {
		return this.#cards[0];
	}

	/** The cards after the current one, to preload. */
	get upcoming(): QueueItem[] {
		return this.#cards.slice(1, 1 + PRELOAD);
	}

	/** The server has nothing left and every card is decided. */
	get done(): boolean {
		return this.#exhausted && this.#cards.length === 0;
	}

	/** Loads pages until more than LOW_WATER cards are ready or the server runs out. */
	refill(): Promise<void> {
		this.#fetching ??= this.#report(async () => {
			while (!this.#exhausted && this.#cards.length <= LOW_WATER) {
				const page = await this.#api.page(this.#cursor);
				// Shuffle batches are random, so a page can repeat cards already in the deck.
				const fresh = page.items.filter((i) => !this.#cards.some((c) => c.id === i.id));
				this.#cards.push(...fresh);
				this.#cursor = page.cursor;
				this.#exhausted = page.cursor === null;
				// Nothing new means the queue holds only cards we have; waiting beats polling Immich.
				if (fresh.length === 0 && this.#cards.length > 0) break;
			}
		}).finally(() => (this.#fetching = null));
		return this.#fetching;
	}

	decide(action: Action): Promise<void> {
		return this.#commit(action, (id) => this.#api.decide(id, action));
	}

	/** Sets the Immich favorite flag on the current card, which stays in place. */
	setFavorite(favorite: boolean): Promise<void> {
		const item = this.current;
		if (!item || this.busy) return Promise.resolve();
		return this.#step(async () => {
			await this.#api.setFavorite(item.id, favorite);
			item.isFavorite = favorite;
		});
	}

	/** Moves past the current card without deciding it; it may come up again later. */
	skip(): void {
		if (this.busy || !this.current) return;
		this.#cards.shift();
		void this.refill();
	}

	async #commit(action: Action, send: (id: string) => Promise<void>): Promise<void> {
		const item = this.current;
		if (!item || this.busy) return;
		await this.#step(async () => {
			await send(item.id);
			this.#cards.shift();
			this.history.push({ item, action });
		});
		await this.refill();
	}

	async undo(): Promise<void> {
		const cut = this.history.at(-1);
		if (!cut || this.busy) return;
		await this.#step(async () => {
			await this.#api.undo(cut.item.id);
			this.history.pop();
			this.#cards.unshift(cut.item);
		});
	}

	async #step(fn: () => Promise<void>): Promise<void> {
		this.busy = true;
		this.error = null;
		await this.#report(fn);
		this.busy = false;
	}

	// The screen shows the message; retrying is the user's next swipe or undo.
	async #report(fn: () => Promise<void>): Promise<void> {
		try {
			await fn();
		} catch (e) {
			if (e instanceof Unauthorized) {
				this.expired = true;
				return;
			}
			this.error = e instanceof Error ? e.message : String(e);
		}
	}
}
