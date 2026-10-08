import type { AssetResponseDto } from '@immich/sdk';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { openDb, type Db } from './db';
import { searchAssets } from './immich';
import { decodeCursor, encodeCursor, nextPage, PAGE_SIZE, type Order } from './queue';

vi.mock('./immich', () => ({ searchAssets: vi.fn() }));

// Fake Immich library holding live timeline assets only, searched the way the
// server does: order by fileCreatedAt with id as tie-break, takenAt bounds.
let library: AssetResponseDto[] = [];

vi.mocked(searchAssets).mockImplementation(async ({ filter, orderBy, size }) => {
	const { gt, gte, lt, lte } = filter.takenAt ?? {};
	const sign = orderBy.direction === 'desc' ? -1 : 1;
	return library
		.filter(
			({ fileCreatedAt: t }) =>
				(gt === undefined || t > gt) &&
				(gte === undefined || t >= gte) &&
				(lt === undefined || t < lt) &&
				(lte === undefined || t <= lte)
		)
		.sort(
			(a, b) => sign * (a.fileCreatedAt.localeCompare(b.fileCreatedAt) || a.id.localeCompare(b.id))
		)
		.slice(0, size);
});

function uuid(n: number): string {
	return `00000000-0000-4000-8000-${n.toString(16).padStart(12, '0')}`;
}

// `tie` assets share each timestamp, so groups straddle page and batch edges.
function makeLibrary(count: number, tie = 1): AssetResponseDto[] {
	return Array.from({ length: count }, (_, i) => ({
		id: uuid(i),
		type: 'IMAGE',
		fileCreatedAt: new Date(Date.UTC(2020, 0, 1) + Math.floor(i / tie) * 1000).toISOString(),
		localDateTime: '2020-01-01T00:00:00.000Z',
		isFavorite: false,
		duration: null
	})) as unknown as AssetResponseDto[];
}

async function drain(db: Db, order: Order, onPage?: (ids: string[]) => void): Promise<string[]> {
	const seen: string[] = [];
	let cursor = null;
	do {
		const page = await nextPage(db, order, cursor);
		expect(page.items.length).toBeLessThanOrEqual(PAGE_SIZE);
		seen.push(...page.items.map((i) => i.id));
		onPage?.(page.items.map((i) => i.id));
		cursor = page.cursor;
	} while (cursor !== null);
	return seen;
}

function keep(db: Db, ids: string[]): void {
	for (const assetId of ids) {
		db.recordDecision({
			assetId,
			action: 'keep',
			bytes: null,
			decidedAt: 1,
			day: '2026-10-08'
		});
	}
}

let db: Db;
beforeEach(() => {
	db = openDb(':memory:');
	library = [];
});

describe('nextPage', () => {
	it.each([1, 3, 7, 45])('walks oldest first with ties of %i, no skips or repeats', async (tie) => {
		library = makeLibrary(250, tie);
		expect(await drain(db, 'oldest')).toEqual(library.map((a) => a.id));
	});

	it.each([1, 3, 7, 45])('walks newest first with ties of %i, no skips or repeats', async (tie) => {
		library = makeLibrary(250, tie);
		const seen = await drain(db, 'newest');
		expect(seen).toHaveLength(250);
		expect(new Set(seen).size).toBe(250);
		const times = seen.map((id) => library.find((a) => a.id === id)!.fileCreatedAt);
		expect(times).toEqual([...times].sort().reverse());
	});

	it('skips reviewed assets, refetching past batches that are all reviewed', async () => {
		library = makeLibrary(700, 4);
		keep(
			db,
			library.slice(0, 650).map((a) => a.id)
		);
		const page = await nextPage(db, 'oldest', null);
		expect(page.items.map((i) => i.id)).toEqual(
			library.slice(650, 650 + PAGE_SIZE).map((a) => a.id)
		);
	});

	it('does not skip assets when earlier ones are trashed between pages', async () => {
		library = makeLibrary(120, 3);
		const all = library.map((a) => a.id);
		const seen = await drain(db, 'oldest', (ids) => {
			library = library.filter((a) => !ids.includes(a.id));
		});
		expect(seen).toEqual(all);
	});

	it('ends with a null cursor', async () => {
		expect(await nextPage(db, 'oldest', null)).toEqual({
			items: [],
			cursor: null
		});
		library = makeLibrary(5);
		const page = await nextPage(db, 'newest', null);
		expect(page.items).toHaveLength(5);
		expect(page.cursor).toBeNull();
	});

	it('sends only the chosen fields', async () => {
		library = makeLibrary(1).map((a) => ({
			...a,
			originalPath: '/library/x.jpg',
			ownerId: uuid(9)
		}));
		const [item] = (await nextPage(db, 'oldest', null)).items;
		expect(Object.keys(item!).sort()).toEqual([
			'duration',
			'id',
			'isFavorite',
			'localDateTime',
			'type'
		]);
	});
});

describe('cursor', () => {
	const cursor = { t: '2020-01-01T00:00:01.000Z', ids: [uuid(1), uuid(2)] };

	it('round-trips', () => {
		expect(decodeCursor(encodeCursor(cursor))).toEqual(cursor);
	});

	it.each([
		['not base64 json', '%%%'],
		['a number', Buffer.from('5').toString('base64url')],
		['a bad time', encodeCursor({ ...cursor, t: '2020-13-01T00:00:00.000Z' })],
		['a time without ms', encodeCursor({ ...cursor, t: '2020-01-01T00:00:01Z' })],
		['no ids', encodeCursor({ ...cursor, ids: [] })],
		['a non-uuid id', encodeCursor({ ...cursor, ids: ['../x'] })],
		[
			'too many ids',
			encodeCursor({
				...cursor,
				ids: Array.from({ length: 501 }, (_, i) => uuid(i))
			})
		]
	])('rejects %s', (_, raw) => {
		expect(decodeCursor(raw)).toBeNull();
	});
});
