import { describe, expect, it } from 'vitest';
import { isDoubleTap, isTap } from './tap';

const at = (x: number, y: number, t: number) => ({ x, y, t });

describe('isTap', () => {
	it('accepts a short press that barely moved', () => {
		expect(isTap(at(100, 100, 0), at(104, 103, 120))).toBe(true);
	});

	it('rejects a drag', () => {
		expect(isTap(at(100, 100, 0), at(140, 100, 120))).toBe(false);
	});

	it('rejects a long press', () => {
		expect(isTap(at(100, 100, 0), at(100, 100, 600))).toBe(false);
	});
});

describe('isDoubleTap', () => {
	it('accepts two close taps in quick succession', () => {
		expect(isDoubleTap(at(100, 100, 1000), at(110, 105, 1200))).toBe(true);
	});

	it('rejects taps too far apart in time', () => {
		expect(isDoubleTap(at(100, 100, 1000), at(100, 100, 1500))).toBe(false);
	});

	it('rejects taps that land far apart', () => {
		expect(isDoubleTap(at(100, 100, 1000), at(300, 100, 1200))).toBe(false);
	});
});
