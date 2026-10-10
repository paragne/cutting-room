import type { DateFilter } from '@immich/sdk';
import { isUuid } from './media';

export type Mode =
	{ kind: 'shuffle' } | { kind: 'onThisDay'; day: string } | { kind: 'album'; albumId: string };

// Years before this are not searched. Each empty year costs one Immich search.
export const MIN_YEAR = 1990;

const DAY = /^(\d{4})-(\d{2})-(\d{2})$/;
const MS_PER_DAY = 86_400_000;

/** The year of a valid YYYY-MM-DD day, or null. */
function yearOf(day: string): number | null {
	const m = DAY.exec(day);
	if (!m) return null;
	const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
	const t = new Date(Date.UTC(y, mo - 1, d));
	return t.getUTCFullYear() === y && t.getUTCMonth() === mo - 1 && t.getUTCDate() === d ? y : null;
}

/** Returns null when the query names an unknown mode or lacks a valid argument for it. */
export function parseMode(params: URLSearchParams): Mode | null {
	const kind = params.get('mode') ?? 'shuffle';
	if (kind === 'shuffle') return { kind };
	if (kind === 'onThisDay') {
		const day = params.get('day');
		return day !== null && yearOf(day) !== null ? { kind, day } : null;
	}
	if (kind === 'album') {
		const albumId = params.get('album');
		return albumId !== null && isUuid(albumId) ? { kind, albumId } : null;
	}
	return null;
}

/** The year before the day's year, where an on-this-day scan starts; null if there is none. */
export function firstPastYear(day: string): number | null {
	const y = yearOf(day);
	return y !== null && y - 1 >= MIN_YEAR ? y - 1 : null;
}

/** The same calendar day in a past year, as a UTC range. Feb 29 becomes Feb 28 in other years. */
export function onThisDayRange(day: string, year: number): DateFilter {
	const [mo, d] = day.slice(5).split('-').map(Number) as [number, number];
	let start = Date.UTC(year, mo - 1, d);
	if (new Date(start).getUTCMonth() !== mo - 1) start = Date.UTC(year, 1, 28);
	return {
		gte: new Date(start).toISOString(),
		lt: new Date(start + MS_PER_DAY).toISOString()
	};
}
