import { describe, expect, it } from 'vitest';
import { percentSorted, streak } from './stats';

describe('percentSorted', () => {
	it('counts trashed assets in the original library size', () => {
		expect(percentSorted(30, 70, 10)).toBeCloseTo(37.5);
	});
	it('is 0 for an empty library', () => {
		expect(percentSorted(0, 0, 0)).toBe(0);
	});
	it('never passes 100', () => {
		expect(percentSorted(50, 10, 0)).toBe(100);
	});
});

describe('streak', () => {
	it('counts consecutive days including today', () => {
		expect(streak(['2026-10-10', '2026-10-09', '2026-10-08'], '2026-10-10')).toBe(3);
	});
	it('keeps the streak alive when today has no decisions yet', () => {
		expect(streak(['2026-10-09', '2026-10-08'], '2026-10-10')).toBe(2);
	});
	it('stops at a gap', () => {
		expect(streak(['2026-10-10', '2026-10-08'], '2026-10-10')).toBe(1);
	});
	it('is 0 when the last active day is two days back', () => {
		expect(streak(['2026-10-08'], '2026-10-10')).toBe(0);
	});
	it('crosses month and year boundaries', () => {
		expect(streak(['2026-01-01', '2025-12-31', '2025-12-30'], '2026-01-01')).toBe(3);
	});
	it('is 0 with no history', () => {
		expect(streak([], '2026-10-10')).toBe(0);
	});
});
