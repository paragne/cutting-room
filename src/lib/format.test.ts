import { describe, expect, it } from 'vitest';
import { formatBytes, formatRange, formatTaken, infoRows, shootTitle } from './format';

describe('formatTaken', () => {
	it('keeps the wall-clock date whatever the viewer time zone', () => {
		const text = formatTaken('2020-01-01T23:30:00.000Z');
		expect(text).toMatch(/\b1\b/);
		expect(text).toMatch(/2020/);
		expect(text).toMatch(/11:30|23:30/);
	});
});

describe('formatBytes', () => {
	it('scales through the units', () => {
		expect(formatBytes(512)).toBe('512 B');
		expect(formatBytes(1536)).toBe('1.5 KB');
		expect(formatBytes(5 * 1024 * 1024)).toBe('5.0 MB');
		expect(formatBytes(3 * 1024 ** 3)).toBe('3.0 GB');
	});
});

describe('formatRange', () => {
	it('shows one date and two times within a day', () => {
		const text = formatRange('2024-06-01T12:00:05.000Z', '2024-06-01T12:04:41.000Z');
		expect(text.match(/2024/g)).toHaveLength(1);
		expect(text).toMatch(/12:00:05|12:00:05/);
		expect(text).toMatch(/12:04:41/);
	});

	it('shows both dates when the shoot crosses midnight', () => {
		const text = formatRange('2024-06-01T23:59:00.000Z', '2024-06-02T00:03:00.000Z');
		expect(text.match(/2024/g)).toHaveLength(2);
	});
});

describe('infoRows', () => {
	it('skips fields that are missing', () => {
		const rows = infoRows({
			fileName: 'a.jpg',
			camera: null,
			lens: null,
			width: 4000,
			height: 3000,
			sizeBytes: 2048,
			place: null
		});
		expect(rows).toEqual([
			['File', 'a.jpg'],
			['Dimensions', '4000 × 3000'],
			['File size', '2.0 KB']
		]);
	});
});

describe('shootTitle', () => {
	it('rounds seconds to the nearest minute', () => {
		expect(shootTitle('2022-09-20T15:31:29.000Z')).toBe(formatTaken('2022-09-20T15:31:00.000Z'));
		expect(shootTitle('2022-09-20T15:31:30.000Z')).toBe(formatTaken('2022-09-20T15:32:00.000Z'));
	});

	it('rolls over the day when rounding up at midnight', () => {
		expect(shootTitle('2022-09-20T23:59:45.000Z')).toBe(formatTaken('2022-09-21T00:00:00.000Z'));
	});

	it('reads September 20, 2022 at 3:31 PM', () => {
		expect(shootTitle('2022-09-20T15:31:10.000Z')).toMatch(/September 20, 2022.*3:31\s?PM/);
	});
});
