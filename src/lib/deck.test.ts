import { AssetTypeEnum } from '@immich/sdk';
import { describe, expect, it, vi } from 'vitest';
import { localDay, Unauthorized } from './api';
import { Deck, type DeckApi, type Page } from './deck.svelte';
import type { QueueItem } from './server/queue';

function item(n: number): QueueItem {
	return {
		id: `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`,
		type: AssetTypeEnum.Image,
		localDateTime: '2020-01-01T00:00:00.000Z',
		isFavorite: false,
		duration: null
	};
}

function items(from: number, count: number): QueueItem[] {
	return Array.from({ length: count }, (_, i) => item(from + i));
}

// Serves the given pages in order; the last page's cursor is null.
function fakeApi(pages: QueueItem[][]): {
	[K in keyof DeckApi]: DeckApi[K] & ReturnType<typeof vi.fn>;
} {
	return {
		page: vi.fn(async (cursor: string | null): Promise<Page> => {
			const i = cursor === null ? 0 : Number(cursor);
			return { items: pages[i] ?? [], cursor: i + 1 < pages.length ? String(i + 1) : null };
		}),
		decide: vi.fn(async () => {}),
		undo: vi.fn(async () => {})
	};
}

const ids = (list: QueueItem[] | undefined) => list?.map((i) => i.id);

describe('Deck', () => {
	it('shows the first card and the next three to preload', async () => {
		const deck = new Deck(fakeApi([items(0, 20)]));
		await deck.refill();
		expect(deck.current).toEqual(item(0));
		expect(ids(deck.upcoming)).toEqual(ids(items(1, 3)));
	});

	it('advances on decide and records the cut', async () => {
		const api = fakeApi([items(0, 20)]);
		const deck = new Deck(api);
		await deck.refill();
		await deck.decide('trash');
		expect(api.decide).toHaveBeenCalledWith(item(0).id, 'trash');
		expect(deck.current).toEqual(item(1));
		expect(deck.history).toEqual([{ item: item(0), action: 'trash' }]);
	});

	it('fetches the next page once few cards remain', async () => {
		const api = fakeApi([items(0, 6), items(6, 20)]);
		const deck = new Deck(api);
		await deck.refill();
		expect(api.page).toHaveBeenCalledTimes(1);
		await deck.decide('keep');
		expect(api.page).toHaveBeenLastCalledWith('1');
		expect(ids(deck.upcoming)).toEqual(ids(items(2, 3)));
		for (let i = 0; i < 25; i++) await deck.decide('keep');
		expect(deck.current).toBeUndefined();
	});

	it('shares one fetch between overlapping refills', async () => {
		const api = fakeApi([items(0, 20)]);
		const deck = new Deck(api);
		await Promise.all([deck.refill(), deck.refill()]);
		expect(api.page).toHaveBeenCalledTimes(1);
		expect(deck.current).toEqual(item(0));
	});

	it('keeps fetching past pages that came back empty', async () => {
		const deck = new Deck(fakeApi([[], [], items(0, 10)]));
		await deck.refill();
		expect(deck.current).toEqual(item(0));
	});

	it('is done once the server runs out and every card is decided', async () => {
		const deck = new Deck(fakeApi([items(0, 2)]));
		await deck.refill();
		await deck.decide('keep');
		expect(deck.done).toBe(false);
		await deck.decide('keep');
		expect(deck.done).toBe(true);
	});

	it('undo returns the last card to the top', async () => {
		const api = fakeApi([items(0, 20)]);
		const deck = new Deck(api);
		await deck.refill();
		await deck.decide('keep');
		await deck.decide('trash');
		await deck.undo();
		expect(api.undo).toHaveBeenCalledWith(item(1).id);
		expect(deck.current).toEqual(item(1));
		expect(deck.history).toEqual([{ item: item(0), action: 'keep' }]);
		await deck.undo();
		expect(deck.current).toEqual(item(0));
		await deck.undo();
		expect(api.undo).toHaveBeenCalledTimes(2);
	});

	it('leaves the card in place when decide fails', async () => {
		const api = fakeApi([items(0, 20)]);
		api.decide = vi.fn().mockRejectedValue(new Error('asset not found'));
		const deck = new Deck(api);
		await deck.refill();
		await deck.decide('trash');
		expect(deck.current).toEqual(item(0));
		expect(deck.history).toEqual([]);
		expect(deck.error).toBe('asset not found');
		expect(deck.busy).toBe(false);
	});

	it('keeps the cut when undo fails, and clears the error on the next step', async () => {
		const api = fakeApi([items(0, 20)]);
		api.undo = vi.fn().mockRejectedValueOnce(new Error('nothing restored'));
		const deck = new Deck(api);
		await deck.refill();
		await deck.decide('trash');
		await deck.undo();
		expect(deck.current).toEqual(item(1));
		expect(deck.history).toHaveLength(1);
		expect(deck.error).toBe('nothing restored');
		await deck.undo();
		expect(deck.error).toBeNull();
		expect(deck.current).toEqual(item(0));
	});

	it('reports a failed fetch and retries on the next refill', async () => {
		const api = fakeApi([items(0, 20)]);
		api.page.mockRejectedValueOnce(new Error('offline'));
		const deck = new Deck(api);
		await deck.refill();
		expect(deck.error).toBe('offline');
		expect(deck.current).toBeUndefined();
		await deck.refill();
		expect(deck.current).toEqual(item(0));
	});

	it('ignores a decide while another is in flight', async () => {
		const api = fakeApi([items(0, 20)]);
		const deck = new Deck(api);
		await deck.refill();
		await Promise.all([deck.decide('keep'), deck.decide('keep')]);
		expect(api.decide).toHaveBeenCalledTimes(1);
		expect(deck.current).toEqual(item(1));
	});

	it('flags an expired session without an error message', async () => {
		const api = fakeApi([items(0, 20)]);
		const deck = new Deck(api);
		await deck.refill();
		api.decide.mockRejectedValue(new Unauthorized());
		await deck.decide('keep');
		expect(deck.expired).toBe(true);
		expect(deck.error).toBeNull();
		expect(deck.current).toEqual(item(0));
	});
});

describe('localDay', () => {
	it('formats the local date with zero padding', () => {
		expect(localDay(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
	});
});
