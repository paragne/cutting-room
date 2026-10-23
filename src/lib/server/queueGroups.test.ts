import type { AssetResponseDto } from '@immich/sdk';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { parseCustom } from './custom';
import { openDb, type Db } from './db';
import { searchAssets, searchRandom } from './immich';
import { nextPage } from './queueModes';

vi.mock('./immich', () => ({ searchAssets: vi.fn(), searchRandom: vi.fn() }));

const START = Date.UTC(2020, 0, 1);
let serial = 0;

function asset(second: number, type = 'IMAGE'): AssetResponseDto {
	const at = new Date(START + second * 1000).toISOString();
	return {
		id: `00000000-0000-4000-8000-${(++serial).toString(16).padStart(12, '0')}`,
		type,
		fileCreatedAt: at,
		localDateTime: at,
		isFavorite: false,
		duration: null,
		originalMimeType: 'image/jpeg'
	} as unknown as AssetResponseDto;
}

const shots = (...seconds: number[]) => seconds.map((s) => asset(s));

function mode(query: string) {
	return { kind: 'custom', custom: parseCustom(new URLSearchParams(query))! } as const;
}

const ids = (items: { id: string }[]) => items.map((i) => i.id);

let db: Db;
let library: AssetResponseDto[];

function review(a: AssetResponseDto) {
	db.recordDecision({
		assetId: a.id,
		action: 'keep',
		bytes: null,
		decidedAt: 1,
		day: '2026-10-23',
		favorite: false
	});
}

async function all(query: string) {
	const pages: string[][] = [];
	let cursor: string | null = null;
	do {
		const page = await nextPage(db, mode(query), cursor);
		pages.push(ids(page!.items));
		cursor = page!.cursor;
	} while (cursor !== null);
	return pages;
}

beforeEach(() => {
	db = openDb(':memory:');
	vi.mocked(searchRandom).mockReset();
	vi.mocked(searchAssets).mockReset();
	vi.mocked(searchAssets).mockImplementation(async ({ filter, size }) => {
		const { gte, lt } = filter.takenAt ?? {};
		return library
			.filter((a) => gte === undefined || a.fileCreatedAt >= gte)
			.filter((a) => lt === undefined || a.fileCreatedAt < lt)
			.filter((a) => filter.type === undefined || a.type === filter.type.eq)
			.slice(0, size);
	});
});

describe('custom groups, in order', () => {
	const shootA = shots(0, 30, 90);
	const lone = shots(200);
	const pair = shots(400, 460);
	const shootB = shots(800, 810, 820, 830);

	beforeEach(() => {
		library = [...shootA, ...lone, ...pair, ...shootB];
	});

	it('returns shots outside any photoshoot with group=singles', async () => {
		expect(await all('group=singles')).toEqual([ids([...lone, ...pair])]);
	});

	it('returns one photoshoot per page with group=shoots', async () => {
		expect(await all('group=shoots')).toEqual([ids(shootA), ids(shootB)]);
	});

	it('keeps the flat list with group=both', async () => {
		expect(await all('group=both')).toEqual([ids(library)]);
	});

	it('finds photoshoots among filtered assets only', async () => {
		library = [asset(0), asset(30, 'VIDEO'), asset(60), ...lone];
		expect(await all('type=photo&group=singles')).toEqual([
			ids([library[0]!, library[2]!, ...lone])
		]);
	});

	it('shrinks a photoshoot by its reviewed shots', async () => {
		review(shootA[1]!);
		expect(await all('group=singles')).toEqual([ids([shootA[0]!, shootA[2]!, ...lone, ...pair])]);
	});

	it('splits a photoshoot longer than one screen', async () => {
		library = shots(...Array.from({ length: 20 }, (_, i) => i));
		expect(await all('group=shoots')).toEqual([
			ids(library.slice(0, 16)),
			ids(library.slice(16))
		]);
	});

	it('sees a photoshoot that straddles two search batches', async () => {
		const spaced = shots(...Array.from({ length: 199 }, (_, i) => i * 100));
		const straddle = shots(20_000, 20_010, 20_020);
		library = [...spaced, ...straddle];
		expect((await all('group=singles')).flat()).toEqual(ids(spaced));
		expect(await all('group=shoots')).toEqual([ids(straddle)]);
	});
});

describe('custom groups, shuffled', () => {
	const shootA = shots(0, 30, 90);
	const lone = shots(200);

	beforeEach(() => {
		library = [...shootA, ...lone];
	});

	it('draws only shots outside any photoshoot with group=singles', async () => {
		vi.mocked(searchRandom).mockResolvedValue([shootA[1]!, ...lone]);
		const page = await nextPage(db, mode('shuffle=on&group=singles'), null);
		expect(ids(page!.items)).toEqual(ids(lone));
		expect(await nextPage(db, mode('shuffle=on&group=singles'), page!.cursor)).not.toBeNull();
	});

	it('draws one photoshoot with group=shoots, searched within the Custom filter', async () => {
		vi.mocked(searchRandom).mockResolvedValue([lone[0]!, shootA[0]!]);
		const page = await nextPage(db, mode('shuffle=on&group=shoots&from=2020-01-01'), null);
		expect(ids(page!.items)).toEqual(ids(shootA));
		expect(searchAssets).toHaveBeenLastCalledWith(
			expect.objectContaining({
				filter: { takenAt: { gte: '2020-01-01T00:00:00.000Z', lt: '2020-01-01T00:10:00.001Z' } }
			})
		);
		expect(await nextPage(db, mode('shuffle=on&group=shoots'), page!.cursor)).not.toBeNull();
	});
});
