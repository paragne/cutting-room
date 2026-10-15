import { describe, expect, it } from 'vitest';
import { settleLabel, toggled } from './select';

describe('toggled', () => {
	it('ticks an unticked shot and unticks a ticked one', () => {
		expect(toggled(['a'], 'b')).toEqual(['a', 'b']);
		expect(toggled(['a', 'b'], 'a')).toEqual(['b']);
	});
});

describe('settleLabel', () => {
	it('trashes the whole shoot when nothing is ticked', () => {
		expect(settleLabel(0, 7)).toBe('Trash 7');
	});

	it('counts both sides when some are ticked', () => {
		expect(settleLabel(2, 7)).toBe('Keep 2, trash 5');
	});

	it('trashes none when every shot is ticked', () => {
		expect(settleLabel(7, 7)).toBe('Keep 7, trash 0');
	});
});
