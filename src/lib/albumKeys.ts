/** Digit keys '0'-'9' mapped to album ids. */
export type Hotkeys = Record<string, string>;

export const DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

/** Binds a digit to an album, or clears the album's key when digit is null. One key per album, one album per key. */
export function bind(hotkeys: Hotkeys, albumId: string, digit: string | null): Hotkeys {
	const next = Object.fromEntries(Object.entries(hotkeys).filter(([, id]) => id !== albumId));
	if (digit !== null) next[digit] = albumId;
	return next;
}

export function digitOf(hotkeys: Hotkeys, albumId: string): string | null {
	return Object.keys(hotkeys).find((d) => hotkeys[d] === albumId) ?? null;
}
