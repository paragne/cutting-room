import { SECONDS_PER_PHOTO } from './shift';

/** Share of the library reviewed. Trashed assets leave Immich's count, so add them back. */
export function percentSorted(reviewed: number, libraryNow: number, trashed: number): number {
	const everything = libraryNow + trashed;
	return everything === 0 ? 0 : Math.min(100, (reviewed / everything) * 100);
}

const DAY_MS = 86_400_000;

function previousDay(day: string): string {
	return new Date(Date.parse(`${day}T00:00:00Z`) - DAY_MS).toISOString().slice(0, 10);
}

/**
 * Consecutive active days ending today. Today not being active yet does not break
 * the streak: it still counts until the day is over.
 * `activeDays` is YYYY-MM-DD, newest first.
 */
export function streak(activeDays: string[], today: string): number {
	const days = new Set(activeDays);
	let day = days.has(today) ? today : previousDay(today);
	let count = 0;
	while (days.has(day)) {
		count++;
		day = previousDay(day);
	}
	return count;
}

/** Photos in Immich not yet decided. Trashed ones are already out of `libraryNow`. */
export function photosLeft(libraryNow: number, reviewed: number, trashed: number): number {
	return Math.max(0, libraryNow - (reviewed - trashed));
}

export function secondsLeft(photos: number): number {
	return photos * SECONDS_PER_PHOTO;
}

/** Share of decisions that kept the photo, or null before the first decision. */
export function keepRate(reviewed: number, trashed: number): number | null {
	return reviewed === 0 ? null : ((reviewed - trashed) / reviewed) * 100;
}
