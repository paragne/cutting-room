import type { QueueEntry } from './server/clockin';

// Rough seconds a person spends deciding one photo. Unmeasured: tune against real use.
const SECONDS_PER_PHOTO = 4;

/** What an entry adds to the shift. A burst costs per shot, since each is looked at. */
export function entryCost(entry: QueueEntry): number {
	return SECONDS_PER_PHOTO * (entry.kind === 'card' ? 1 : entry.items.length);
}

export function shiftOver(spentSeconds: number, minutes: number): boolean {
	return spentSeconds >= minutes * 60;
}
