import type { AssetResponseDto } from '@immich/sdk';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { openDb, type Db } from './db';
import { decide, isValidDay, parseDecide, parseUndo, undo } from './decide';
import { getAsset, restoreAssets, trashAssets } from './immich';

vi.mock('./immich', () => ({
	getAsset: vi.fn(),
	trashAssets: vi.fn(),
	restoreAssets: vi.fn()
}));

const id = '0b6f2c1e-8a4d-4f7e-9c3b-2d5a6e7f8091';
const now = Date.parse('2026-10-08T12:00:00Z');
const day = '2026-10-08';

function asset(over: Partial<AssetResponseDto> = {}): AssetResponseDto {
	return {
		id,
		isTrashed: false,
		visibility: 'timeline',
		exifInfo: { fileSizeInByte: 4096 },
		...over
	} as AssetResponseDto;
}

let db: Db;
beforeEach(() => {
	vi.clearAllMocks();
	db = openDb(':memory:');
	vi.mocked(getAsset).mockResolvedValue(asset());
	vi.mocked(trashAssets).mockResolvedValue();
	vi.mocked(restoreAssets).mockResolvedValue(1);
});

describe('isValidDay', () => {
	it.each(['2026-10-07', '2026-10-08', '2026-10-09'])('accepts %s', (d) => {
		expect(isValidDay(d, now)).toBe(true);
	});

	it.each(['2026-10-06', '2026-10-10', '2026-02-30', '2026-10-8', '2026-10-08T00:00:00Z', ''])(
		'rejects %j',
		(d) => {
			expect(isValidDay(d, now)).toBe(false);
		}
	);
});

describe('parseDecide', () => {
	it('accepts a valid body', () => {
		expect(parseDecide({ id, action: 'trash', day }, now)).toEqual({
			id,
			action: 'trash',
			day
		});
	});

	it.each([
		null,
		'x',
		{ id: 'nope', action: 'keep', day },
		{ id, action: 'delete', day },
		{ id, action: 'keep', day: '2020-01-01' },
		{ id, action: 'keep' }
	])('rejects %j', (body) => {
		expect(typeof parseDecide(body, now)).toBe('string');
	});
});

describe('parseUndo', () => {
	it.each([null, {}, { id: 'x' }, { id: `${id}/..` }])('rejects %j', (body) => {
		expect(typeof parseUndo(body)).toBe('string');
	});
});

describe('decide', () => {
	it('keeps without calling Immich', async () => {
		expect(await decide(db, { id, action: 'keep', day }, now)).toEqual({
			status: 200
		});
		expect(getAsset).not.toHaveBeenCalled();
		expect(trashAssets).not.toHaveBeenCalled();
		expect(db.findDecision.get(id)).toMatchObject({
			action: 'keep',
			bytes: null,
			day
		});
	});

	it('trashes in Immich and records the file size', async () => {
		expect(await decide(db, { id, action: 'trash', day }, now)).toEqual({
			status: 200
		});
		expect(trashAssets).toHaveBeenCalledWith([id]);
		expect(db.findDecision.get(id)).toMatchObject({
			action: 'trash',
			bytes: 4096,
			day
		});
		expect(db.statTotals.get()).toEqual({
			kept: 0,
			trashed: 1,
			bytesTrashed: 4096
		});
	});

	it('records no decision when Immich trash fails', async () => {
		vi.mocked(trashAssets).mockRejectedValue(new Error('trash disabled'));
		await expect(decide(db, { id, action: 'trash', day }, now)).rejects.toThrow('trash disabled');
		expect(db.findDecision.get(id)).toBeUndefined();
	});

	it('returns 404 for an asset Immich does not know', async () => {
		vi.mocked(getAsset).mockResolvedValue(null);
		expect(await decide(db, { id, action: 'trash', day }, now)).toMatchObject({
			status: 404
		});
		expect(trashAssets).not.toHaveBeenCalled();
	});

	it.each([{ isTrashed: true }, { visibility: 'archive' }, { visibility: 'locked' }] as const)(
		'refuses to trash an asset outside the timeline: %j',
		async (over) => {
			vi.mocked(getAsset).mockResolvedValue(asset(over as Partial<AssetResponseDto>));
			expect(await decide(db, { id, action: 'trash', day }, now)).toMatchObject({ status: 409 });
			expect(trashAssets).not.toHaveBeenCalled();
		}
	);

	it('refuses to re-decide until undone', async () => {
		await decide(db, { id, action: 'trash', day }, now);
		expect(await decide(db, { id, action: 'keep', day }, now)).toMatchObject({
			status: 409
		});
		expect(db.findDecision.get(id)).toMatchObject({ action: 'trash' });
	});
});

describe('undo', () => {
	it('restores a trashed asset and takes back its stats', async () => {
		await decide(db, { id, action: 'trash', day }, now);
		expect(await undo(db, id)).toEqual({ status: 200 });
		expect(restoreAssets).toHaveBeenCalledWith([id]);
		expect(db.findDecision.get(id)).toBeUndefined();
		expect(db.statTotals.get()).toEqual({
			kept: 0,
			trashed: 0,
			bytesTrashed: 0
		});
	});

	it('undoes a keep without calling Immich', async () => {
		await decide(db, { id, action: 'keep', day }, now);
		expect(await undo(db, id)).toEqual({ status: 200 });
		expect(restoreAssets).not.toHaveBeenCalled();
		expect(db.findDecision.get(id)).toBeUndefined();
	});

	it('returns 404 when there is nothing to undo', async () => {
		expect(await undo(db, id)).toMatchObject({ status: 404 });
	});

	it('keeps the decision when the asset is no longer in trash', async () => {
		await decide(db, { id, action: 'trash', day }, now);
		vi.mocked(restoreAssets).mockResolvedValue(0);
		expect(await undo(db, id)).toMatchObject({ status: 409 });
		expect(db.findDecision.get(id)).toMatchObject({ action: 'trash' });
	});

	it('keeps the decision when restore fails', async () => {
		await decide(db, { id, action: 'trash', day }, now);
		vi.mocked(restoreAssets).mockRejectedValue(new Error('down'));
		await expect(undo(db, id)).rejects.toThrow('down');
		expect(db.findDecision.get(id)).toMatchObject({ action: 'trash' });
	});
});
