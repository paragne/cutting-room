import { AssetVisibility } from '@immich/sdk';
import type { Action, Db } from './db';
import { getAsset, restoreAssets, trashAssets } from './immich';
import { isUuid } from './media';

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 86_400_000;

/**
 * The client's local date. Any real time zone is within one day of UTC, so a
 * date further off is a bad clock or a forged request.
 */
export function isValidDay(day: string, now: number): boolean {
	if (!DAY.test(day)) return false;
	const t = Date.parse(`${day}T00:00:00Z`);
	if (Number.isNaN(t) || new Date(t).toISOString().slice(0, 10) !== day) return false;
	const today = Date.parse(`${new Date(now).toISOString().slice(0, 10)}T00:00:00Z`);
	return Math.abs(t - today) <= DAY_MS;
}

export type Outcome = { status: 200 } | { status: 400 | 404 | 409; message: string };

export interface DecideRequest {
	id: string;
	action: Action;
	day: string;
}

/** Validates an untrusted JSON body. Returns the request or a 400 message. */
export function parseDecide(body: unknown, now: number): DecideRequest | string {
	if (typeof body !== 'object' || body === null) return 'body must be an object';
	const { id, action, day } = body as Record<string, unknown>;
	if (typeof id !== 'string' || !isUuid(id)) return 'id must be a UUID';
	if (action !== 'keep' && action !== 'trash') return 'action must be keep or trash';
	if (typeof day !== 'string' || !isValidDay(day, now)) return 'day must be today, YYYY-MM-DD';
	return { id, action, day };
}

/** Validates an untrusted JSON body for undo. Returns the asset id or a 400 message. */
export function parseUndo(body: unknown): { id: string } | string {
	if (typeof body !== 'object' || body === null) return 'body must be an object';
	const { id } = body as Record<string, unknown>;
	if (typeof id !== 'string' || !isUuid(id)) return 'id must be a UUID';
	return { id };
}

// A decided asset must be undone first: re-deciding a trashed asset as keep
// would leave it in Immich trash.
export async function decide(db: Db, req: DecideRequest, now: number): Promise<Outcome> {
	if (db.findDecision.get(req.id)) return { status: 409, message: 'already decided' };
	let bytes: number | null = null;
	if (req.action === 'trash') {
		const asset = await getAsset(req.id);
		if (!asset) return { status: 404, message: 'asset not found' };
		if (asset.isTrashed || asset.visibility !== AssetVisibility.Timeline) {
			return { status: 409, message: 'asset is not in the timeline' };
		}
		bytes = asset.exifInfo?.fileSizeInByte ?? null;
		await trashAssets([req.id]);
	}
	db.recordDecision({
		assetId: req.id,
		action: req.action,
		bytes,
		decidedAt: now,
		day: req.day
	});
	return { status: 200 };
}

// Restore runs before the row is removed, so a failed restore leaves the decision in place.
export async function undo(db: Db, id: string): Promise<Outcome> {
	const decision = db.findDecision.get(id);
	if (!decision) return { status: 404, message: 'no decision for this asset' };
	if (decision.action === 'trash' && (await restoreAssets([id])) === 0) {
		return { status: 409, message: 'asset is no longer in Immich trash' };
	}
	db.removeDecision(id);
	return { status: 200 };
}
