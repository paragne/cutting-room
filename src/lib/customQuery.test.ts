import { describe, expect, it } from 'vitest';
import { customForm, customQuery, type CustomForm } from './customQuery';
import { parseCustom } from './server/custom';

const ALBUM = '00000000-0000-4000-8000-000000000001';
const ALBUM2 = '00000000-0000-4000-8000-000000000002';

const blank = customForm(new URLSearchParams());

function query(changes: Partial<CustomForm>): string {
	return customQuery({ ...blank, ...changes }).toString();
}

describe('customQuery', () => {
	it('sends nothing for an untouched form', () => {
		expect(query({})).toBe('');
	});

	it('leaves out blank fields and default choices', () => {
		expect(query({ city: '  ', make: '', group: 'both', reviewed: 'no' })).toBe('');
	});

	it('trims text and normalizes the extension', () => {
		expect(query({ ext: ' .JPG ', city: ' Bergen ' })).toBe('ext=jpg&city=Bergen');
	});

	it('produces a query parseCustom accepts, for every setting', () => {
		const form: CustomForm = {
			type: 'video',
			ext: 'mp4',
			camera: 'yes',
			from: '2019-03-01',
			to: '2019-03-31',
			country: 'Norway',
			state: 'Vestland',
			city: 'Bergen',
			make: 'Apple',
			model: 'iPhone 12',
			lens: 'wide',
			favorite: 'no',
			rating: '3',
			group: 'shoots',
			reviewed: 'both',
			minutes: '15',
			albums: [ALBUM, ALBUM2],
			noAlbum: false,
			noLocation: false,
			shuffle: true
		};
		const q = customQuery(form);
		expect(parseCustom(q)).toMatchObject({
			type: 'video',
			from: '2019-03-01',
			to: '2019-03-31',
			albums: [ALBUM, ALBUM2],
			model: 'iPhone 12',
			rating: 3,
			group: 'shoots',
			reviewed: 'both',
			shuffle: true,
			minutes: 15
		});
		expect(customForm(q)).toEqual(form);
	});

	it('sends the no-album and no-location flags', () => {
		const q = customQuery({ ...blank, noAlbum: true, noLocation: true });
		expect(q.toString()).toBe('noalbum=yes&nolocation=yes');
		expect(parseCustom(q)).toMatchObject({ noAlbum: true, noLocation: true });
	});

	it('allows an open-ended date span', () => {
		expect(parseCustom(customQuery({ ...blank, from: '2020-06-01' }))).toMatchObject({
			from: '2020-06-01',
			to: null
		});
		expect(parseCustom(customQuery({ ...blank, to: '2020-06-01' }))).toMatchObject({
			from: null,
			to: '2020-06-01'
		});
	});
});

describe('customForm', () => {
	it('starts with the defaults selected', () => {
		expect(blank).toMatchObject({ group: 'both', reviewed: 'no', shuffle: false, albums: [] });
	});
});
