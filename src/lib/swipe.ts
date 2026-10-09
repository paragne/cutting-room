import type { Action } from './server/db';

export interface Sample {
	x: number;
	t: number;
}

/** Fraction of the card width a slow drag must cover to decide. */
const DISTANCE = 0.3;
/** Release speed in px/ms that decides from a short drag. */
const FLING = 0.5;
/** Shortest drag a fling counts from, so a tap or jitter never decides. */
const MIN_FLING_DX = 24;
// Only the end of the drag counts, so a pause before release reads as slow.
const WINDOW_MS = 80;

/** Horizontal speed in px/ms over the samples taken just before `now`. */
export function velocity(samples: Sample[], now: number): number {
	const recent = samples.filter((s) => now - s.t <= WINDOW_MS);
	const first = recent[0];
	const last = recent.at(-1);
	if (!first || !last || last.t === first.t) return 0;
	return (last.x - first.x) / (last.t - first.t);
}

/** Right keeps, left trashes. Null snaps the card back. */
export function release(dx: number, dy: number, vx: number, width: number): Action | null {
	if (Math.abs(dy) > Math.abs(dx)) return null;
	const flung = Math.abs(vx) >= FLING;
	if (flung && Math.sign(vx) !== Math.sign(dx)) return null;
	if (Math.abs(dx) < (flung ? MIN_FLING_DX : DISTANCE * width)) return null;
	return dx > 0 ? 'keep' : 'trash';
}
