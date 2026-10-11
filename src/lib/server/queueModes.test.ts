import type { AssetResponseDto } from '@immich/sdk';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { openDb, type Db } from './db';
import { searchAssets, searchRandom } from './immich';
import { nextPage } from './queueModes';

vi.mock('./immich', () => ({ searchAssets: vi.fn(), searchRandom: vi.fn() }));

const ALBUM = '00000000-0000-4000-8000-0000000000aa';

function asset(n: number, takenAt: string): AssetResponseDto {
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

// Serves assets whose fileCreatedAt falls in the takenAt range, oldest first.
let library: AssetResponseDto[] = [];

vi.mocked(searchAssets).mockImplementation(async ({ filter, size }) => {
	const { gte, lt } = filter.takenAt ?? {};
	return library
		.filter(
			(a) =>
				(gte === undefined || a.fileCreatedAt >= gte) && (lt === undefined || a.fileCreatedAt < lt)
		)
		.sort((a, b) => a.fileCreatedAt.localeCompare(b.fileCreatedAt) || a.id.localeCompare(b.id))
		.slice(0, size);
});

let db: Db;

function keep(...assets: AssetResponseDto[]): void {
	for (const a of assets) {
		db.recordDecision({
			assetId: a.id,
			action: 'keep',
			bytes: null,
			decidedAt: 1,
			day: '2026-10-08',
			favorite: false
		});
	}
}

beforeEach(() => {
	db = openDb(':memory:');
	library = [];
	vi.mocked(searchRandom).mockReset();
	vi.mocked(searchAssets).mockClear();
});

const ids = (items: { id: string }[]) => items.map((i) => i.id);

describe('shuffle', () => {
	it('returns unreviewed assets from the random batch, at most a page', async () => {
		const batch = Array.from({ length: 50 }, (_, i) => asset(i, '2020-01-01T00:00:00.000Z'));
		keep(batch[0] as AssetResponseDto);
		vi.mocked(searchRandom).mockResolvedValue(batch);
		const page = await nextPage(db, { kind: 'shuffle' }, null);
		expect(ids(page!.items)).toEqual(ids(batch.slice(1, 21)));
		expect(page!.cursor).not.toBeNull();
	});

	it('ends after three batches that are all reviewed', async () => {
		const batch = [asset(1, '2020-01-01T00:00:00.000Z')];
		keep(...batch);
		vi.mocked(searchRandom).mockResolvedValue(batch);
		expect(await nextPage(db, { kind: 'shuffle' }, null)).toEqual({
			items: [],
			cursor: null
		});
		expect(searchRandom).toHaveBeenCalledTimes(3);
	});

	it('keeps looking when only the first batch is all reviewed', async () => {
		const seen = asset(1, '2020-01-01T00:00:00.000Z');
		const fresh = asset(2, '2020-01-01T00:00:00.000Z');
		keep(seen);
		vi.mocked(searchRandom).mockResolvedValueOnce([seen]).mockResolvedValueOnce([fresh]);
		const page = await nextPage(db, { kind: 'shuffle' }, null);
		expect(ids(page!.items)).toEqual([fresh.id]);
	});

	it('rejects a cursor it did not produce', async () => {
		expect(await nextPage(db, { kind: 'shuffle' }, 'x')).toBeNull();
	});
});

describe('photoshoot', () => {
	const mode = { kind: 'photoshoot' } as const;
	const at = (s: number) => new Date(Date.UTC(2024, 5, 1, 12, 0, s)).toISOString();

	it('returns the burst around a random seed in time order', async () => {
		const burst = [asset(3, at(20)), asset(1, at(0)), asset(2, at(10))];
		library = [...burst, asset(9, at(3600))];
		vi.mocked(searchRandom).mockResolvedValue([burst[0] as AssetResponseDto]);
		const page = await nextPage(db, mode, null);
		expect(ids(page!.items)).toEqual([burst[1]!.id, burst[2]!.id, burst[0]!.id]);
		expect(page!.cursor).not.toBeNull();
	});

	it('tries the next seed when one is alone', async () => {
		const lone = asset(9, at(3600));
		const burst = [asset(1, at(0)), asset(2, at(5)), asset(3, at(10))];
		library = [lone, ...burst];
		vi.mocked(searchRandom).mockResolvedValue([lone, burst[1] as AssetResponseDto]);
		const page = await nextPage(db, mode, null);
		expect(ids(page!.items)).toEqual(ids(burst));
	});

	it('leaves out shots that are already reviewed', async () => {
		const burst = [asset(1, at(0)), asset(2, at(5)), asset(3, at(10)), asset(4, at(15))];
		library = burst;
		keep(burst[3] as AssetResponseDto);
		vi.mocked(searchRandom).mockResolvedValue([burst[0] as AssetResponseDto]);
		const page = await nextPage(db, mode, null);
		expect(ids(page!.items)).toEqual(ids(burst.slice(0, 3)));
	});

	it('returns no items, but keeps going, when no seed is in a burst', async () => {
		const lone = asset(9, at(3600));
		library = [lone];
		vi.mocked(searchRandom).mockResolvedValue([lone]);
		const page = await nextPage(db, mode, null);
		expect(page!.items).toEqual([]);
		expect(page!.cursor).not.toBeNull();
	});

	it('rejects a cursor it did not produce', async () => {
		expect(await nextPage(db, mode, 'x')).toBeNull();
	});
});

describe('album', () => {
	const mode = { kind: 'album', albumId: ALBUM } as const;

	it('filters the search by the album', async () => {
		library = [asset(1, '2020-01-01T00:00:00.000Z')];
		await nextPage(db, mode, null);
		expect(searchAssets).toHaveBeenCalledWith(
			expect.objectContaining({ filter: { albumIds: { any: [ALBUM] } } })
		);
	});

	it('pages with the keyset cursor and rejects a bad one', async () => {
		library = Array.from({ length: 30 }, (_, i) =>
			asset(i, new Date(Date.UTC(2020, 0, 1, 0, 0, i)).toISOString())
		);
		const first = await nextPage(db, mode, null);
		expect(first!.items).toHaveLength(20);
		const second = await nextPage(db, mode, first!.cursor);
		expect(ids([...first!.items, ...second!.items])).toEqual(ids(library));
		expect(await nextPage(db, mode, 'garbage')).toBeNull();
	});
});
