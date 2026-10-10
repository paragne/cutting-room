export interface Shot {
	id: string;
	/** Capture time in epoch milliseconds. */
	at: number;
}

/** Shots further apart than this are different photoshoots. */
export const GAP_MS = 60_000;
export const MIN_SHOTS = 3;
// A burst this large does not fit on one screen; the shots nearest the seed are kept.
export const MAX_SHOTS = 16;

/**
 * The photoshoot containing `seedId`: consecutive shots no further apart than
 * `GAP_MS`. Null if the seed is absent or the run is shorter than `MIN_SHOTS`.
 */
export function photoshootAround(shots: Shot[], seedId: string): Shot[] | null {
	const sorted = [...shots].sort((a, b) => a.at - b.at);
	const seed = sorted.findIndex((s) => s.id === seedId);
	if (seed === -1) return null;
	let from = seed;
	while (from > 0 && sorted[from]!.at - sorted[from - 1]!.at <= GAP_MS) from--;
	let to = seed;
	while (to < sorted.length - 1 && sorted[to + 1]!.at - sorted[to]!.at <= GAP_MS) to++;
	const run = sorted.slice(from, to + 1);
	if (run.length < MIN_SHOTS) return null;
	const at = sorted[seed]!.at;
	return run
		.sort((a, b) => Math.abs(a.at - at) - Math.abs(b.at - at))
		.slice(0, MAX_SHOTS)
		.sort((a, b) => a.at - b.at);
}
