import { describe, expect, it } from 'vitest';
import { insidePhoto, swipeStep } from './viewer';

// A 400x400 box holding a 200x100 photo: the photo fills the width, so it is scaled 2x
// and centered with 100px of matte above and below.
const box = { left: 0, top: 0, width: 400, height: 400 };
const wide = { width: 200, height: 100 };

describe('insidePhoto', () => {
	it('is true on the photo', () => {
		expect(insidePhoto({ x: 200, y: 200 }, box, wide)).toBe(true);
	});

	it('is false on the matte above and below a wide photo', () => {
		expect(insidePhoto({ x: 200, y: 50 }, box, wide)).toBe(false);
		expect(insidePhoto({ x: 200, y: 350 }, box, wide)).toBe(false);
	});

	it('is false on the matte beside a tall photo', () => {
		expect(insidePhoto({ x: 20, y: 200 }, box, { width: 100, height: 200 })).toBe(false);
	});

	it('does not close before the image has loaded', () => {
		expect(insidePhoto({ x: 5, y: 5 }, box, { width: 0, height: 0 })).toBe(true);
	});
});

describe('swipeStep', () => {
	it('goes next on a left swipe and back on a right swipe', () => {
		expect(swipeStep(-80, 5)).toBe(1);
		expect(swipeStep(80, -5)).toBe(-1);
	});

	it('ignores short and mostly vertical drags', () => {
		expect(swipeStep(30, 0)).toBe(0);
		expect(swipeStep(-80, 70)).toBe(0);
	});
});
