import type { Action } from './server/db';
import type { QueueItem } from './server/queue';

export interface Page {
	items: QueueItem[];
	cursor: string | null;
}

export interface DeckApi {
	page(cursor: string | null): Promise<Page>;
	decide(id: string, action: Action): Promise<void>;
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
				this.#cards.push(...page.items);
				this.#cursor = page.cursor;
				this.#exhausted = page.cursor === null;
			}
		}).finally(() => (this.#fetching = null));
		return this.#fetching;
	}

	async decide(action: Action): Promise<void> {
		const item = this.current;
		if (!item || this.busy) return;
		await this.#step(async () => {
			await this.#api.decide(item.id, action);
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
			this.error = e instanceof Error ? e.message : String(e);
		}
	}
}
