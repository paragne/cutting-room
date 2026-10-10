import { describe, expect, it } from 'vitest';
import { GAP_MS, MAX_SHOTS, MIN_SHOTS, photoshootAround, type Shot } from './photoshoot';

const shot = (id: string, seconds: number): Shot => ({ id, at: seconds * 1000 });
const ids = (shots: Shot[] | null) => shots?.map((s) => s.id);

describe('photoshootAround', () => {
	it('returns the run around the seed in time order, whatever the input order', () => {
		const shots = [shot('c', 20), shot('a', 0), shot('b', 10), shot('far', 500)];
		expect(ids(photoshootAround(shots, 'b'))).toEqual(['a', 'b', 'c']);
	});

	it('chains shots that are each within the gap of their neighbour', () => {
		const gap = GAP_MS / 1000;
		const shots = [shot('a', 0), shot('b', gap), shot('c', 2 * gap), shot('d', 3 * gap)];
		expect(ids(photoshootAround(shots, 'a'))).toEqual(['a', 'b', 'c', 'd']);
	});

	it('splits at a gap one millisecond over the limit', () => {
		const shots = [
			{ id: 'a', at: 0 },
			{ id: 'b', at: 1000 },
			{ id: 'c', at: 2000 },
			{ id: 'd', at: 2000 + GAP_MS + 1 }
		];
		expect(ids(photoshootAround(shots, 'a'))).toEqual(['a', 'b', 'c']);
		expect(photoshootAround(shots, 'd')).toBeNull();
	});

	it('is null below the minimum size', () => {
		const shots = Array.from({ length: MIN_SHOTS - 1 }, (_, i) => shot(`s${i}`, i));
		expect(photoshootAround(shots, 's0')).toBeNull();
	});

	it('is null when the seed is not among the shots', () => {
		expect(photoshootAround([shot('a', 0), shot('b', 1), shot('c', 2)], 'x')).toBeNull();
	});

	it('keeps the shots nearest the seed when the run is too long', () => {
		const shots = Array.from({ length: 40 }, (_, i) => shot(`s${i}`, i));
		const run = photoshootAround(shots, 's30')!;
		expect(run).toHaveLength(MAX_SHOTS);
		expect(run.map((s) => s.at)).toEqual([...run.map((s) => s.at)].sort((a, b) => a - b));
		expect(ids(run)).toContain('s30');
		expect(ids(run)).not.toContain('s0');
	});
});
