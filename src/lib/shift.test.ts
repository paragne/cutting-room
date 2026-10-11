import { describe, expect, it } from 'vitest';
import type { QueueItem } from './server/queue';
import { entryCost, shiftOver } from './shift';

const photo = (n: number) => ({ id: String(n) }) as QueueItem;

describe('entryCost', () => {
	it('costs a burst per shot', () => {
		const one = entryCost({ kind: 'card', item: photo(1) });
		expect(entryCost({ kind: 'burst', items: [photo(1), photo(2), photo(3)] })).toBe(3 * one);
	});
});

describe('shiftOver', () => {
	it('ends exactly at the shift length', () => {
		expect(shiftOver(899, 15)).toBe(false);
		expect(shiftOver(900, 15)).toBe(true);
	});
});
