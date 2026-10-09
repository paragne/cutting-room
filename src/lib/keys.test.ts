import { describe, expect, it } from 'vitest';
import { command } from './keys';

const press = (
	key: string,
	mods: { ctrlKey?: boolean; metaKey?: boolean; altKey?: boolean } = {}
) => command({ key, ctrlKey: false, metaKey: false, altKey: false, ...mods });

describe('command', () => {
	it('keeps on right and trashes on left', () => {
		expect(press('ArrowRight')).toBe('keep');
		expect(press('ArrowLeft')).toBe('trash');
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
