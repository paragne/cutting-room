import { describe, expect, it } from 'vitest';
import { bind, digitOf } from './albumKeys';

describe('bind', () => {
	it('binds a digit to an album', () => {
		expect(bind({}, 'a', '1')).toEqual({ '1': 'a' });
	});

	it('moves an album to a new digit', () => {
		expect(bind({ '1': 'a' }, 'a', '2')).toEqual({ '2': 'a' });
	});

	it('gives a taken digit to the new album', () => {
		expect(bind({ '1': 'a', '2': 'b' }, 'b', '1')).toEqual({ '1': 'b' });
	});

	it('clears an album with null and leaves others', () => {
		expect(bind({ '1': 'a', '2': 'b' }, 'a', null)).toEqual({ '2': 'b' });
	});

	it('does not mutate its input', () => {
		const before = { '1': 'a' };
		bind(before, 'a', '2');
		expect(before).toEqual({ '1': 'a' });
	});
});

describe('digitOf', () => {
	it('finds the digit or null', () => {
		expect(digitOf({ '3': 'a' }, 'a')).toBe('3');
		expect(digitOf({ '3': 'a' }, 'b')).toBeNull();
	});
});
