import { describe, expect, it } from 'vitest';
import { release, velocity } from './swipe';

const W = 400;

describe('release', () => {
	it('snaps back from a short slow drag', () => {
		expect(release(100, 0, 0.1, W)).toBeNull();
		expect(release(-100, 0, -0.1, W)).toBeNull();
	});

	it('decides from a slow drag past the threshold', () => {
		expect(release(130, 10, 0.1, W)).toBe('keep');
		expect(release(-130, 10, -0.1, W)).toBe('trash');
	});

	it('decides from a short fast fling', () => {
		expect(release(40, 0, 0.8, W)).toBe('keep');
		expect(release(-40, 0, -0.8, W)).toBe('trash');
	});

	it('ignores a fling too short to be a swipe', () => {
		expect(release(10, 0, 2, W)).toBeNull();
	});

	it('cancels when flung back against the drag', () => {
		expect(release(200, 0, -0.8, W)).toBeNull();
		expect(release(-200, 0, 0.8, W)).toBeNull();
	});

	it('ignores a mostly vertical drag', () => {
		expect(release(150, 200, 0.8, W)).toBeNull();
	});
});

describe('velocity', () => {
	it('measures speed over the end of the drag', () => {
		const samples = [
			{ x: 0, t: 0 },
			{ x: 0, t: 200 },
			{ x: 40, t: 240 },
			{ x: 80, t: 280 }
		];
		expect(velocity(samples, 280)).toBe(1);
	});

	it('reads a pause before release as zero', () => {
		const samples = [
			{ x: 0, t: 0 },
			{ x: 100, t: 50 }
		];
		expect(velocity(samples, 500)).toBe(0);
	});

	it('is zero without two distinct samples', () => {
		expect(velocity([], 0)).toBe(0);
		expect(velocity([{ x: 5, t: 10 }], 10)).toBe(0);
		expect(
			velocity(
				[
					{ x: 0, t: 10 },
					{ x: 5, t: 10 }
				],
				10
			)
		).toBe(0);
	});
});
