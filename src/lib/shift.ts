import type { QueueEntry } from './server/dailies';

// Rough seconds a person spends deciding one photo. About 15 minutes for 155 photos in real use.
export const SECONDS_PER_PHOTO = 6;

/** What an entry adds to the shift. A burst costs per shot, since each is looked at. */
export function entryCost(entry: QueueEntry): number {
	return SECONDS_PER_PHOTO * (entry.kind === 'card' ? 1 : entry.items.length);
}

export function shiftOver(spentSeconds: number, minutes: number): boolean {
	return spentSeconds >= minutes * 60;
}
