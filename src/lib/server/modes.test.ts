import { describe, expect, it } from 'vitest';
import { firstPastYear, onThisDayRange, parseMode } from './modes';

const ALBUM = '00000000-0000-4000-8000-000000000001';

function parse(query: string) {
	return parseMode(new URLSearchParams(query));
}

describe('parseMode', () => {
	it('defaults to shuffle', () => {
		expect(parse('')).toEqual({ kind: 'shuffle' });
	});

	it('reads photoshoot', () => {
		expect(parse('mode=photoshoot')).toEqual({ kind: 'photoshoot' });
	});

	it('reads clockin', () => {
		expect(parse('mode=clockin')).toEqual({ kind: 'clockin' });
	});

	it('reads on this day with a valid day', () => {
		expect(parse('mode=onThisDay&day=2026-10-10')).toEqual({
			kind: 'onThisDay',
			day: '2026-10-10'
		});
	});

	it.each(['', 'day=2026-02-30', 'day=10-10-2026', 'day=2026-13-01'])(
		'rejects on this day with %j',
		(extra) => {
			expect(parse(`mode=onThisDay&${extra}`)).toBeNull();
		}
	);

	it('reads an album by uuid', () => {
		expect(parse(`mode=album&album=${ALBUM}`)).toEqual({
			kind: 'album',
			albumId: ALBUM
		});
	});

	it.each(['mode=album', 'mode=album&album=not-a-uuid', 'mode=album&album=../etc'])(
		'rejects %j',
		(query) => {
			expect(parse(query)).toBeNull();
		}
	);

	it('rejects an unknown mode', () => {
		expect(parse('mode=screenshots')).toBeNull();
	});
});

describe('onThisDayRange', () => {
	it('covers the same calendar day of the given year', () => {
		expect(onThisDayRange('2026-10-10', 2019)).toEqual({
			gte: '2019-10-10T00:00:00.000Z',
			lt: '2019-10-11T00:00:00.000Z'
		});
	});

	it('crosses a month and year boundary', () => {
		expect(onThisDayRange('2026-12-31', 2020).lt).toBe('2021-01-01T00:00:00.000Z');
	});

	it('keeps Feb 29 in a leap year and uses Feb 28 otherwise', () => {
		expect(onThisDayRange('2024-02-29', 2020).gte).toBe('2020-02-29T00:00:00.000Z');
		expect(onThisDayRange('2024-02-29', 2023).gte).toBe('2023-02-28T00:00:00.000Z');
	});
});

describe('firstPastYear', () => {
	it('is the year before, never the current one', () => {
		expect(firstPastYear('2026-10-10')).toBe(2025);
	});

	it('is null when no searched year precedes the day', () => {
		expect(firstPastYear('1990-05-01')).toBeNull();
	});
});
