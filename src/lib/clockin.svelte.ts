import { Unauthorized } from './api';
import type { ClockinPage, QueueEntry } from './server/clockin';
import type { Action } from './server/db';
import type { QueueItem } from './server/queue';

export interface ClockinApi {
	page(cursor: string | null): Promise<ClockinPage>;
	decide(id: string, action: Action): Promise<void>;
	undo(id: string): Promise<void>;
}

type Card = Extract<QueueEntry, { kind: 'card' }>;
type Burst = Extract<QueueEntry, { kind: 'burst' }>;

/** What a step took off the queue, so undo can put it back. */
export type Done =
	| { entry: Card; action: Action }
	| { entry: Burst; picked: string[]; decided: string[] };

const PRELOAD = 3;
// Fetch while a few entries remain so the user never waits on Immich mid-swipe.
const LOW_WATER = 3;

/**
 * The entries ahead and the decisions made this shift. A decide or undo moves
 * the queue only after the server confirms, so a failure leaves it unchanged.
 */
export class Clockin {
	history = $state<Done[]>([]);
	reviewed = $state(0);
	busy = $state(false);
	error = $state<string | null>(null);
	/** The session ended; the screen sends the user to /login. */
	expired = $state(false);
	#entries = $state<QueueEntry[]>([]);
	#exhausted = $state(false);
	#cursor: string | null = null;
	#fetching: Promise<void> | null = null;
	#api: ClockinApi;

	constructor(api: ClockinApi) {
		this.#api = api;
	}

	get current(): QueueEntry | undefined {
		return this.#entries[0];
	}

	/** Cards after the current entry, to preload. A burst loads its own thumbnails. */
	get upcoming(): QueueItem[] {
		return this.#entries
			.slice(1, 1 + PRELOAD)
			.flatMap((e) => (e.kind === 'card' ? [e.item] : []));
	}

	get done(): boolean {
		return this.#exhausted && this.#entries.length === 0;
	}

	refill(): Promise<void> {
		this.#fetching ??= this.#guard(async () => {
			while (!this.#exhausted && this.#entries.length <= LOW_WATER) {
				const page = await this.#api.page(this.#cursor);
				// Random pages can repeat an asset already queued.
				const queued = this.#entries.flatMap(ids);
				const fresh = page.entries.filter((e) => !ids(e).some((id) => queued.includes(id)));
				this.#entries.push(...fresh);
				this.#cursor = page.cursor;
				this.#exhausted = page.cursor === null;
				if (fresh.length === 0 && this.#entries.length > 0) break;
			}
		})
			.then(() => undefined)
			.finally(() => (this.#fetching = null));
		return this.#fetching;
	}

	async decideCard(action: Action): Promise<void> {
		const entry = this.current;
		if (entry?.kind !== 'card' || this.busy) return;
		const ok = await this.#step(() => this.#api.decide(entry.item.id, action));
		if (!ok) return;
		this.#entries.shift();
		this.history.push({ entry, action });
		this.reviewed++;
		await this.refill();
	}

	/** Keeps `keepers`, trashes the other shots. A failure leaves the undecided shots in place. */
	async settle(keepers: string[]): Promise<void> {
		const entry = this.current;
		if (entry?.kind !== 'burst' || this.busy) return;
		const decided: string[] = [];
		const ok = await this.#step(async () => {
			for (const shot of entry.items) {
				await this.#api.decide(shot.id, keepers.includes(shot.id) ? 'keep' : 'trash');
				decided.push(shot.id);
			}
		});
		this.reviewed += decided.length;
		if (!ok) {
			entry.items = entry.items.filter((s) => !decided.includes(s.id));
			return;
		}
		this.#entries.shift();
		this.history.push({ entry: { kind: 'burst', items: [...entry.items] }, picked: keepers, decided });
		await this.refill();
	}

	/** Moves past the current entry without deciding it; it may come up again later. */
	skip(): void {
		if (this.busy || !this.current) return;
		this.#entries.shift();
		void this.refill();
	}

	/** Puts back the last entry and returns what was undone. */
	async undo(): Promise<Done | undefined> {
		const done = this.history.at(-1);
		if (!done || this.busy) return undefined;
		const ok = await this.#step(async () => {
			if (!('decided' in done)) {
				await this.#api.undo(done.entry.item.id);
				this.reviewed--;
				return;
			}
			while (done.decided.length > 0) {
				await this.#api.undo(done.decided[done.decided.length - 1]!);
				done.decided.pop();
				this.reviewed--;
			}
		});
		if (!ok) return undefined;
		this.history.pop();
		this.#entries.unshift(done.entry);
		return done;
	}

	/** Shows an error from outside the queue, such as a share or album call. */
	fail(e: unknown): void {
		if (e instanceof Unauthorized) this.expired = true;
		else this.error = e instanceof Error ? e.message : String(e);
	}

	async #step(fn: () => Promise<void>): Promise<boolean> {
		this.busy = true;
		this.error = null;
		const ok = await this.#guard(fn);
		this.busy = false;
		return ok;
	}

	// The screen shows the message; retrying is the user's next action.
	async #guard(fn: () => Promise<void>): Promise<boolean> {
		try {
			await fn();
			return true;
		} catch (e) {
			this.fail(e);
			return false;
		}
	}
}

const ids = (e: QueueEntry): string[] =>
	e.kind === 'card' ? [e.item.id] : e.items.map((i) => i.id);
