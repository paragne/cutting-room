import { AssetTypeEnum } from '@immich/sdk';
import { describe, expect, it, vi } from 'vitest';
import { Unauthorized } from './api';
import { Dailies, type DailiesApi } from './dailies.svelte';
import type { DailiesPage, QueueEntry } from './server/dailies';
import type { QueueItem } from './server/queue';

function item(n: number): QueueItem {
	return {
		id: `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`,
		type: AssetTypeEnum.Image,
		localDateTime: '2020-01-01T00:00:00.000Z',
		isFavorite: false,
		duration: null,
		isGif: false
	};
}

const card = (n: number): QueueEntry => ({ kind: 'card', item: item(n) });
const burst = (...ns: number[]): QueueEntry => ({ kind: 'burst', items: ns.map(item) });

// Serves the given pages in order; the last page's cursor is null.
function fakeApi(pages: QueueEntry[][]) {
	return {
		page: vi.fn(async (cursor: string | null): Promise<DailiesPage> => {
			const i = cursor === null ? 0 : Number(cursor);
			return { entries: pages[i] ?? [], cursor: i + 1 < pages.length ? String(i + 1) : null };
		}),
		decide: vi.fn<DailiesApi['decide']>(async () => {}),
		undo: vi.fn<DailiesApi['undo']>(async () => {})
	} satisfies DailiesApi;
}

async function started(pages: QueueEntry[][], minutes = 15, api = fakeApi(pages)) {
	const shift = new Dailies(api, minutes);
	await shift.refill();
	return { shift, api };
}

describe('Dailies', () => {
	it('shows the first entry and preloads only the cards after it', async () => {
		const { shift } = await started([[card(1), burst(2, 3, 4), card(5), card(6)]]);
		expect(shift.current).toEqual(card(1));
		expect(shift.upcoming.map((i) => i.id)).toEqual([item(5).id, item(6).id]);
	});

	it('decides a card, moves on and counts it', async () => {
		const { shift, api } = await started([[card(1), card(2)]]);
		await shift.decideCard('trash');
		expect(api.decide).toHaveBeenCalledWith(item(1).id, 'trash');
		expect(shift.current).toEqual(card(2));
		expect(shift.reviewed).toBe(1);
	});

	it('keeps the card and shows the error when the decide fails', async () => {
		const { shift, api } = await started([[card(1)]]);
		api.decide.mockRejectedValueOnce(new Error('immich down'));
		await shift.decideCard('keep');
		expect(shift.current).toEqual(card(1));
		expect(shift.error).toBe('immich down');
		expect(shift.reviewed).toBe(0);
	});

	it('does not decide a burst as a card', async () => {
		const { shift, api } = await started([[burst(1, 2, 3)]]);
		await shift.decideCard('keep');
		expect(api.decide).not.toHaveBeenCalled();
	});

	it('keeps the picked shots of a burst and trashes the rest', async () => {
		const { shift, api } = await started([[burst(1, 2, 3), card(4)]]);
		await shift.settle([item(2).id]);
		expect(api.decide.mock.calls).toEqual([
			[item(1).id, 'trash'],
			[item(2).id, 'keep'],
			[item(3).id, 'trash']
		]);
		expect(shift.current).toEqual(card(4));
		expect(shift.reviewed).toBe(3);
	});

	it('leaves only the undecided shots after a partial failure', async () => {
		const { shift, api } = await started([[burst(1, 2, 3)]]);
		api.decide.mockResolvedValueOnce().mockRejectedValueOnce(new Error('boom'));
		await shift.settle([]);
		expect(shift.current).toEqual(burst(2, 3));
		expect(shift.reviewed).toBe(1);
		expect(shift.history).toHaveLength(0);
	});

	it('undoes a card and shows it again', async () => {
		const { shift, api } = await started([[card(1), card(2)]]);
		await shift.decideCard('trash');
		const done = await shift.undo();
		expect(api.undo).toHaveBeenCalledWith(item(1).id);
		expect(done).toMatchObject({ action: 'trash' });
		expect(shift.current).toEqual(card(1));
		expect(shift.reviewed).toBe(0);
	});

	it('undoes a burst newest shot first and returns what was picked', async () => {
		const { shift, api } = await started([[burst(1, 2, 3), card(4)]]);
		await shift.settle([item(1).id]);
		const done = await shift.undo();
		expect(api.undo.mock.calls.map(([id]) => id)).toEqual([item(3).id, item(2).id, item(1).id]);
		expect(done).toMatchObject({ picked: [item(1).id] });
		expect(shift.current).toEqual(burst(1, 2, 3));
		expect(shift.reviewed).toBe(0);
	});

	it('skips an entry without a decision', async () => {
		const { shift, api } = await started([[burst(1, 2, 3), card(4)]]);
		shift.skip();
		expect(shift.current).toEqual(card(4));
		expect(api.decide).not.toHaveBeenCalled();
	});

	it('drops entries that repeat an asset already queued', async () => {
		const { shift } = await started([[card(1), burst(2, 3, 4)], [card(1), burst(4, 5, 6), card(7)]]);
		await shift.refill();
		const all: QueueEntry[] = [];
		while (shift.current) {
			all.push(shift.current);
			shift.skip();
		}
		expect(all).toEqual([card(1), burst(2, 3, 4), card(7)]);
	});

	it('is done once the server is exhausted and every entry is decided', async () => {
		const { shift } = await started([[card(1)]]);
		expect(shift.done).toBe(false);
		await shift.decideCard('keep');
		expect(shift.done).toBe(true);
	});

	it('flags an expired session', async () => {
		const { shift, api } = await started([[card(1)]]);
		api.decide.mockRejectedValueOnce(new Unauthorized());
		await shift.decideCard('keep');
		expect(shift.expired).toBe(true);
	});

	describe('shift', () => {
		// 1 minute is 60 s, so 10 photos at 6 s each.
		const many = (n: number) => Array.from({ length: n }, (_, i) => card(i + 1));

		it('ends once the work adds up to the shift length', async () => {
			const { shift } = await started([many(20)], 1);
			for (let i = 0; i < 9; i++) await shift.decideCard('keep');
			expect(shift.shiftOver).toBe(false);
			await shift.decideCard('keep');
			expect(shift.shiftOver).toBe(true);
		});

		it('counts a burst by its shots', async () => {
			const shots = Array.from({ length: 12 }, (_, i) => i + 1);
			const { shift } = await started([[burst(...shots.slice(0, 9)), burst(10, 11, 12)]], 1);
			await shift.settle([]);
			expect(shift.shiftOver).toBe(false);
			await shift.settle([]);
			expect(shift.shiftOver).toBe(true);
		});

		it('counts a skip, so skipping cannot stall a shift', async () => {
			const { shift } = await started([many(20)], 1);
			for (let i = 0; i < 10; i++) shift.skip();
			expect(shift.shiftOver).toBe(true);
		});

		it('takes an undone entry back off the shift', async () => {
			const { shift } = await started([many(20)], 1);
			for (let i = 0; i < 10; i++) await shift.decideCard('keep');
			await shift.undo();
			expect(shift.shiftOver).toBe(false);
		});

		it('starts the next shift empty and with no history to undo', async () => {
			const { shift } = await started([many(40)], 1);
			for (let i = 0; i < 10; i++) await shift.decideCard('keep');
			shift.nextShift();
			expect(shift.shiftOver).toBe(false);
			expect(await shift.undo()).toBeUndefined();
		});
	});
});
