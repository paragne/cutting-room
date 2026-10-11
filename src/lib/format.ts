import type { AssetInfo } from './server/assetInfo';

/** `localDateTime` is wall-clock time stored as UTC, so format it as UTC to avoid shifting it. */
export function formatTaken(localDateTime: string): string {
	return new Date(localDateTime).toLocaleString(undefined, {
		timeZone: 'UTC',
		dateStyle: 'long',
		timeStyle: 'short'
	});
}

/** The title of a photoshoot: its earliest shot, rounded to the nearest minute. */
export function shootTitle(localDateTime: string): string {
	const minute = 60_000;
	const rounded = Math.round(new Date(localDateTime).getTime() / minute) * minute;
	return formatTaken(new Date(rounded).toISOString());
}

export function formatBytes(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	const units = ['KB', 'MB', 'GB'];
	let value = bytes / 1024;
	let i = 0;
	while (value >= 1024 && i < units.length - 1) {
		value /= 1024;
		i++;
	}
	return `${value.toFixed(1)} ${units[i]}`;
}

const TIME = { timeZone: 'UTC', timeStyle: 'medium' } as const;

/** The span of a photoshoot: one date and two times when it stays within a day. */
export function formatRange(first: string, last: string): string {
	const sameDay = first.slice(0, 10) === last.slice(0, 10);
	const at = (iso: string, opts: Intl.DateTimeFormatOptions) =>
		new Date(iso).toLocaleString(undefined, opts);
	if (!sameDay) {
		const both = { timeZone: 'UTC', dateStyle: 'medium', timeStyle: 'short' } as const;
		return `${at(first, both)} to ${at(last, both)}`;
	}
	const date = at(first, { timeZone: 'UTC', dateStyle: 'long' });
	return `${date}, ${at(first, TIME)} to ${at(last, TIME)}`;
}

/** The labelled rows of the details panel; fields Immich lacks are left out. */
export function infoRows(info: AssetInfo): [string, string][] {
	const rows: [string, string | null][] = [
		['File', info.fileName],
		['Camera', info.camera],
		['Lens', info.lens],
		['Dimensions', info.width && info.height ? `${info.width} × ${info.height}` : null],
		['File size', info.sizeBytes === null ? null : formatBytes(info.sizeBytes)],
		['Place', info.place]
	];
	return rows.filter((r): r is [string, string] => Boolean(r[1]));
}
