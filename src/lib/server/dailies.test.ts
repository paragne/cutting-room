import type { AssetResponseDto } from '@immich/sdk';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { dailiesPage } from './dailies';
import { openDb, type Db } from './db';
import { searchAssets, searchRandom } from './immich';

vi.mock('./immich', () => ({ searchAssets: vi.fn(), searchRandom: vi.fn() }));

function asset(n: number, s: number): AssetResponseDto {
	const takenAt = new Date(Date.UTC(2024, 5, 1, 12, 0, s)).toISOString();
	return {
		id: `00000000-0000-4000-8000-${n.toString(16).padStart(12, '0')}`,
		type: 'IMAGE',
		fileCreatedAt: takenAt,
		localDateTime: takenAt,
		isFavorite: false,
		duration: null,
		originalMimeType: 'image/jpeg'
	} as unknown as AssetResponseDto;
}

let library: AssetResponseDto[] = [];
let db: Db;

beforeEach(() => {
	db = openDb(':memory:');
	library = [];
	vi.mocked(searchRandom).mockReset();
	vi.mocked(searchAssets).mockImplementation(async ({ filter, size }) => {
		const { gte, lt } = filter.takenAt ?? {};
		return library
			.filter(
				(a) =>
					(gte === undefined || a.fileCreatedAt >= gte) &&
					(lt === undefined || a.fileCreatedAt < lt)
			)
			.sort((a, b) => a.fileCreatedAt.localeCompare(b.fileCreatedAt))
			.slice(0, size);
	});
});

const ids = (items: { id: string }[]) => items.map((i) => i.id);

describe('dailiesPage', () => {
	it('yields a card for a lone photo', async () => {
		const lone = asset(9, 3600);
		library = [lone];
		vi.mocked(searchRandom).mockResolvedValue([lone]);
		const page = await dailiesPage(db, null);
		expect(page!.entries).toEqual([
			expect.objectContaining({
				kind: 'card',
				item: expect.objectContaining({ id: lone.id })
			})
		]);
	});

	it('yields one burst, in time order, for a photo inside a photoshoot', async () => {
		const burst = [asset(1, 0), asset(2, 10), asset(3, 20)];
		library = burst;
		vi.mocked(searchRandom).mockResolvedValue([burst[1]!]);
		const page = await dailiesPage(db, null);
		expect(page!.entries).toHaveLength(1);
		const entry = page!.entries[0];
		expect(entry?.kind).toBe('burst');
		expect(ids(entry?.kind === 'burst' ? entry.items : [])).toEqual(ids(burst));
	});

	it('does not yield a burst member again as a card in the same page', async () => {
		const burst = [asset(1, 0), asset(2, 10), asset(3, 20)];
		const lone = asset(9, 3600);
		library = [...burst, lone];
		vi.mocked(searchRandom).mockResolvedValue([burst[0]!, burst[2]!, lone]);
		const page = await dailiesPage(db, null);
		expect(page!.entries.map((e) => e.kind)).toEqual(['burst', 'card']);
	});

	it('skips reviewed photos', async () => {
		const [done, open] = [asset(8, 3600), asset(9, 7200)];
		library = [done, open];
		db.recordDecision({
			assetId: done.id,
			action: 'keep',
			bytes: null,
			decidedAt: 1,
			day: '2026-10-08',
			favorite: false
		});
		vi.mocked(searchRandom).mockResolvedValue([done, open]);
		const page = await dailiesPage(db, null);
		expect(page!.entries).toHaveLength(1);
		expect(page!.entries[0]).toMatchObject({
			kind: 'card',
			item: { id: open.id }
		});
	});

	it('ends the queue after three all-reviewed batches', async () => {
		const done = asset(8, 3600);
		library = [done];
		db.recordDecision({
			assetId: done.id,
			action: 'keep',
			bytes: null,
			decidedAt: 1,
			day: '2026-10-08',
			favorite: false
		});
		vi.mocked(searchRandom).mockResolvedValue([done]);
		expect(await dailiesPage(db, null)).toEqual({ entries: [], cursor: null });
		expect(searchRandom).toHaveBeenCalledTimes(3);
	});

	it('rejects a cursor it did not produce', async () => {
		expect(await dailiesPage(db, 'x')).toBeNull();
	});
});
