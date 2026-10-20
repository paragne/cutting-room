import type { AssetResponseDto } from '@immich/sdk';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { parseCustom } from './custom';
import { openDb, type Db } from './db';
import { searchAssets, searchRandom } from './immich';
import { nextPage } from './queueModes';

vi.mock('./immich', () => ({ searchAssets: vi.fn(), searchRandom: vi.fn() }));

function asset(n: number): AssetResponseDto {
	const at = new Date(Date.UTC(2020, 0, 1, 0, 0, n)).toISOString();
	return {
		id: `00000000-0000-4000-8000-${n.toString(16).padStart(12, '0')}`,
		type: 'IMAGE',
		fileCreatedAt: at,
		localDateTime: at,
		isFavorite: false,
		duration: null,
		originalMimeType: 'image/jpeg'
	} as unknown as AssetResponseDto;
}

function mode(query: string) {
	return { kind: 'custom', custom: parseCustom(new URLSearchParams(query))! } as const;
}

const ids = (items: { id: string }[]) => items.map((i) => i.id);
const library = Array.from({ length: 30 }, (_, i) => asset(i));

let db: Db;
beforeEach(() => {
	db = openDb(':memory:');
	vi.mocked(searchAssets).mockReset();
	vi.mocked(searchRandom).mockReset();
	db.recordDecision({
		assetId: library[0]!.id,
		action: 'keep',
		bytes: null,
		decidedAt: 1,
		day: '2026-10-20',
		favorite: false
	});
});

describe('custom, in order', () => {
	beforeEach(() => {
		vi.mocked(searchAssets).mockImplementation(async ({ filter, size }) => {
			const gte = filter.takenAt?.gte;
			return library.filter((a) => gte === undefined || a.fileCreatedAt >= gte).slice(0, size);
		});
	});

	it('searches with the Custom filter', async () => {
		await nextPage(db, mode('type=video&favorite=yes'), null);
		expect(searchAssets).toHaveBeenCalledWith(
			expect.objectContaining({
				filter: { type: { eq: 'VIDEO' }, isFavorite: { eq: true } }
			})
		);
	});

	it('leaves out reviewed assets by default and pages with the keyset cursor', async () => {
		const first = await nextPage(db, mode(''), null);
		const second = await nextPage(db, mode(''), first!.cursor);
		expect(ids([...first!.items, ...second!.items])).toEqual(ids(library.slice(1)));
		expect(second!.cursor).toBeNull();
	});

	it('returns only reviewed assets with reviewed=yes', async () => {
		const page = await nextPage(db, mode('reviewed=yes'), null);
		expect(ids(page!.items)).toEqual([library[0]!.id]);
	});

	it('rejects the shuffle cursor', async () => {
		expect(await nextPage(db, mode(''), 'shuffle')).toBeNull();
	});
});

describe('custom, shuffled', () => {
	it('draws random assets with the Custom filter and the reviewed setting', async () => {
		vi.mocked(searchRandom).mockResolvedValue(library.slice(0, 3));
		const page = await nextPage(db, mode('shuffle=on&reviewed=both&ext=png'), null);
		expect(searchRandom).toHaveBeenCalledWith(
			expect.objectContaining({ filter: { originalFileName: { endsWith: '.png' } } })
		);
		expect(ids(page!.items)).toEqual(ids(library.slice(0, 3)));
		expect(await nextPage(db, mode('shuffle=on'), page!.cursor)).not.toBeNull();
	});

	it('rejects a cursor it did not produce', async () => {
		expect(await nextPage(db, mode('shuffle=on'), 'eyJ0IjoiMjAyMCJ9')).toBeNull();
	});
});
