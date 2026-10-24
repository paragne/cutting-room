const FIELDS = [
	'type',
	'ext',
	'camera',
	'from',
	'to',
	'country',
	'state',
	'city',
	'make',
	'model',
	'lens',
	'favorite',
	'rating',
	'group',
	'reviewed',
	'minutes'
] as const;

type Field = (typeof FIELDS)[number];

/** The Custom form's values. An empty string means the setting is off. */
export type CustomForm = Record<Field, string> & {
	albums: string[];
	noAlbum: boolean;
	noLocation: boolean;
	shuffle: boolean;
};

const DEFAULTS: Partial<Record<Field, string>> = { group: 'both', reviewed: 'no' };

/** Form values from a Custom query, so a session's settings can be edited. */
export function customForm(params: URLSearchParams): CustomForm {
	const fields = Object.fromEntries(
		FIELDS.map((k) => [k, params.get(k) ?? DEFAULTS[k] ?? ''])
	) as Record<Field, string>;
	return {
		...fields,
		albums: params.getAll('album'),
		noAlbum: params.get('noalbum') === 'yes',
		noLocation: params.get('nolocation') === 'yes',
		shuffle: params.get('shuffle') === 'on'
	};
}

/** The query `parseCustom` reads. Blank fields and defaults are left out. */
export function customQuery(form: CustomForm): URLSearchParams {
	const q = new URLSearchParams();
	for (const k of FIELDS) {
		const v = k === 'ext' ? form.ext.trim().replace(/^\./, '').toLowerCase() : form[k].trim();
		if (v && v !== DEFAULTS[k]) q.set(k, v);
	}
	for (const id of form.albums) q.append('album', id);
	if (form.noAlbum) q.set('noalbum', 'yes');
	if (form.noLocation) q.set('nolocation', 'yes');
	if (form.shuffle) q.set('shuffle', 'on');
	return q;
}
