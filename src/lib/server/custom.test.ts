import { describe, expect, it } from 'vitest';
import { customFilter, parseCustom, type Custom } from './custom';

const ALBUM = '00000000-0000-4000-8000-000000000001';
const ALBUM2 = '00000000-0000-4000-8000-000000000002';

function parse(query: string) {
	return parseCustom(new URLSearchParams(query));
}

function filterOf(query: string) {
	const c = parse(query);
	if (!c) throw new Error(`rejected: ${query}`);
	return customFilter(c);
}

describe('parseCustom', () => {
	it('defaults to everything unreviewed, in order, without a time limit', () => {
		expect(parse('')).toEqual<Custom>({
			type: null,
			ext: null,
			camera: null,
			from: null,
			to: null,
			albums: [],
			noAlbum: false,
			country: null,
			state: null,
			city: null,
			noLocation: false,
			make: null,
			model: null,
			lens: null,
			favorite: null,
			rating: null,
			group: 'both',
			reviewed: 'no',
			shuffle: false,
			minutes: null
		});
	});

	it('reads every setting', () => {
		expect(
			parse(
				`type=video&ext=mp4&camera=yes&from=2019-03-01&to=2019-03-31&album=${ALBUM}` +
					'&country=Norway&state=Vestland&city=Bergen&make=Apple&model=iPhone%2012&lens=wide' +
					'&favorite=no&rating=3&group=shoots&reviewed=both&shuffle=on&minutes=15'
			)
		).toEqual<Custom>({
			type: 'video',
			ext: 'mp4',
			camera: true,
			from: '2019-03-01',
			to: '2019-03-31',
			albums: [ALBUM],
			noAlbum: false,
			country: 'Norway',
			state: 'Vestland',
			city: 'Bergen',
			noLocation: false,
			make: 'Apple',
			model: 'iPhone 12',
			lens: 'wide',
			favorite: false,
			rating: 3,
			group: 'shoots',
			reviewed: 'both',
			shuffle: true,
			minutes: 15
		});
	});

	it.each<[string, Partial<Custom>]>([
		['from=2019&to=2021', { from: '2019-01-01', to: '2021-12-31' }],
		['from=2020&to=2020', { from: '2020-01-01', to: '2020-12-31' }],
		[`album=${ALBUM}&album=${ALBUM2}&album=${ALBUM}`, { albums: [ALBUM, ALBUM2] }],
		['rating=none&noalbum=yes&nolocation=yes', { rating: 'none', noAlbum: true, noLocation: true }],
		['minutes=1', { minutes: 1 }],
		['minutes=120', { minutes: 120 }]
	])('reads %s', (query, expected) => {
		expect(parse(query)).toMatchObject(expected);
	});

	it.each([
		['unknown key', 'mode=custom'],
		['prototype key', 'constructor=x'],
		['repeated single key', 'type=photo&type=video'],
		['bad type', 'type=audio'],
		['uppercase extension', 'ext=PNG'],
		['extension with a dot', 'ext=.png'],
		['bad album id', 'album=../etc'],
		['impossible day', 'from=2023-02-30'],
		['short year', 'from=219'],
		['datetime', 'from=2019-01-01T00:00:00Z'],
		['reversed range', 'from=2020-01-02&to=2020-01-01'],
		['reversed years', 'from=2021&to=2020'],
		['rating 0', 'rating=0'],
		['rating 6', 'rating=6'],
		['minutes 0', 'minutes=0'],
		['minutes 121', 'minutes=121'],
		['fractional minutes', 'minutes=1.5'],
		['empty text', 'city='],
		['control character', 'city=a%0Ab'],
		['text over 100 chars', `make=${'a'.repeat(101)}`],
		['albums and no album', `album=${ALBUM}&noalbum=yes`],
		['place and no location', 'city=Bergen&nolocation=yes'],
		['no camera and a camera make', 'camera=no&make=Apple'],
		['no camera and a lens', 'camera=no&lens=wide'],
		['noalbum=no', 'noalbum=no'],
		['bad shuffle', 'shuffle=yes']
	])('rejects %s', (_, query) => {
		expect(parse(query)).toBeNull();
	});

	it('caps the number of albums at 50', () => {
		const ids = Array.from({ length: 51 }, (_, i) =>
			`00000000-0000-4000-8000-${String(i).padStart(12, '0')}`
		);
		expect(parse(ids.slice(0, 50).map((id) => `album=${id}`).join('&'))).not.toBeNull();
		expect(parse(ids.map((id) => `album=${id}`).join('&'))).toBeNull();
	});
});

describe('customFilter', () => {
	it('adds nothing when every filter is off', () => {
		expect(filterOf('group=shoots&reviewed=yes&shuffle=on&minutes=10')).toEqual({});
	});

	it('maps file type and extension', () => {
		expect(filterOf('type=photo&ext=png')).toEqual({
			type: { eq: 'IMAGE' },
			originalFileName: { endsWith: '.png' }
		});
		expect(filterOf('type=video')).toEqual({ type: { eq: 'VIDEO' } });
	});

	it('maps camera to a null check on make', () => {
		expect(filterOf('camera=yes')).toEqual({ make: { ne: null } });
		expect(filterOf('camera=no')).toEqual({ make: { eq: null } });
	});

	it('lets a named make replace the camera check', () => {
		expect(filterOf('camera=yes&make=Apple')).toEqual({ make: { eq: 'Apple' } });
	});

	it('maps a day range to a half-open UTC range', () => {
		expect(filterOf('from=2019-03-01&to=2019-03-31')).toEqual({
			takenAt: { gte: '2019-03-01T00:00:00.000Z', lt: '2019-04-01T00:00:00.000Z' }
		});
	});

	it('maps a year span through the new year', () => {
		expect(filterOf('from=2019&to=2020')).toEqual({
			takenAt: { gte: '2019-01-01T00:00:00.000Z', lt: '2021-01-01T00:00:00.000Z' }
		});
	});

	it('maps open-ended ranges', () => {
		expect(filterOf('from=2019')).toEqual({ takenAt: { gte: '2019-01-01T00:00:00.000Z' } });
		expect(filterOf('to=2019-02-28')).toEqual({ takenAt: { lt: '2019-03-01T00:00:00.000Z' } });
	});

	it('maps albums and no album', () => {
		expect(filterOf(`album=${ALBUM}&album=${ALBUM2}`)).toEqual({
			albumIds: { any: [ALBUM, ALBUM2] }
		});
		expect(filterOf('noalbum=yes')).toEqual({ hasAlbums: { eq: false } });
	});

	it('maps location and no location', () => {
		expect(filterOf('country=Norway&state=Vestland&city=Bergen')).toEqual({
			country: { eq: 'Norway' },
			state: { eq: 'Vestland' },
			city: { eq: 'Bergen' }
		});
		expect(filterOf('nolocation=yes')).toEqual({ country: { eq: null } });
	});

	it('maps camera model and lens', () => {
		expect(filterOf('model=X100V&lens=23mm')).toEqual({
			model: { eq: 'X100V' },
			lensModel: { eq: '23mm' }
		});
	});

	it('maps favorite and rating', () => {
		expect(filterOf('favorite=yes&rating=4')).toEqual({
			isFavorite: { eq: true },
			rating: { gte: 4 }
		});
		expect(filterOf('favorite=no&rating=none')).toEqual({
			isFavorite: { eq: false },
			rating: { eq: null }
		});
	});
});
