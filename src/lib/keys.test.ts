import { describe, expect, it } from 'vitest';
import { command, digit } from './keys';

const press = (
	key: string,
	mods: { ctrlKey?: boolean; metaKey?: boolean; altKey?: boolean } = {}
) => command({ key, ctrlKey: false, metaKey: false, altKey: false, ...mods });

describe('command', () => {
	it('keeps on right and trashes on left', () => {
		expect(press('ArrowRight')).toBe('keep');
		expect(press('ArrowLeft')).toBe('trash');
	});

	it('skips on down', () => {
		expect(press('ArrowDown')).toBe('skip');
		expect(press('ArrowDown', { ctrlKey: true })).toBeNull();
	});

	it('favorites on F in either case, but not with a modifier', () => {
		expect(press('f')).toBe('favorite');
		expect(press('F')).toBe('favorite');
		expect(press('f', { ctrlKey: true })).toBeNull();
		expect(press('f', { altKey: true })).toBeNull();
	});

	it('undoes on Ctrl+Z or Cmd+Z in either case', () => {
		expect(press('z', { ctrlKey: true })).toBe('undo');
		expect(press('Z', { metaKey: true })).toBe('undo');
	});

	it('ignores bare Z, other keys, and arrows with a modifier', () => {
		expect(press('z')).toBeNull();
		expect(press('a')).toBeNull();
		expect(press('ArrowRight', { ctrlKey: true })).toBeNull();
		expect(press('ArrowLeft', { altKey: true })).toBeNull();
	});
});

describe('digit', () => {
	const key = (k: string, mods: { ctrlKey?: boolean; metaKey?: boolean; altKey?: boolean } = {}) =>
		digit({ key: k, ctrlKey: false, metaKey: false, altKey: false, ...mods });

	it('returns bare digits', () => {
		expect(key('0')).toBe('0');
		expect(key('7')).toBe('7');
	});

	it('ignores letters, multi-character keys and modified digits', () => {
		expect(key('a')).toBeNull();
		expect(key('10')).toBeNull();
		expect(key('ArrowRight')).toBeNull();
		expect(key('1', { ctrlKey: true })).toBeNull();
		expect(key('1', { metaKey: true })).toBeNull();
		expect(key('1', { altKey: true })).toBeNull();
	});
});
