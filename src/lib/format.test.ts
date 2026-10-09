import { describe, expect, it } from 'vitest';
import { formatBytes, formatTaken } from './format';

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
