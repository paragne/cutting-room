export interface Point {
	x: number;
	y: number;
	t: number;
}

/** Longest press, in ms, that still counts as a tap. */
const TAP_MS = 250;
/** Furthest a finger may drift, in px, and still be a tap rather than a drag. */
const TAP_SLOP = 10;
/** Longest gap, in ms, between the two taps of a double-tap. */
const DOUBLE_MS = 300;
/** Furthest apart, in px, the two taps of a double-tap may land. */
const DOUBLE_DISTANCE = 30;

export function isTap(down: Point, up: Point): boolean {
	return up.t - down.t <= TAP_MS && Math.hypot(up.x - down.x, up.y - down.y) <= TAP_SLOP;
}

export function isDoubleTap(previous: Point, tap: Point): boolean {
	return (
		tap.t - previous.t <= DOUBLE_MS &&
		Math.hypot(tap.x - previous.x, tap.y - previous.y) <= DOUBLE_DISTANCE
	);
}
