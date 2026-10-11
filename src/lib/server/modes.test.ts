import { describe, expect, it } from 'vitest';
import { parseMode } from './modes';

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

	it('reads dailies', () => {
		expect(parse('mode=dailies')).toEqual({ kind: 'dailies' });
	});

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
