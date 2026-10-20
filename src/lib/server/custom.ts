import { AssetTypeEnum, type DateFilter } from '@immich/sdk';
import type { AssetFilter } from './immich';
import { isUuid } from './media';

/** Custom mode settings. null means the filter is off. */
export type Custom = {
	type: 'photo' | 'video' | null;
	ext: string | null;
	camera: boolean | null;
	/** Inclusive calendar days, YYYY-MM-DD. */
	from: string | null;
	to: string | null;
	albums: string[];
	noAlbum: boolean;
	country: string | null;
	state: string | null;
	city: string | null;
	noLocation: boolean;
	make: string | null;
	model: string | null;
	lens: string | null;
	favorite: boolean | null;
	/** Minimum stars, or 'none' for unrated. */
	rating: number | 'none' | null;
	group: 'singles' | 'shoots' | 'both';
	reviewed: 'yes' | 'no' | 'both';
	shuffle: boolean;
	/** null means no time limit. */
	minutes: number | null;
};

const DATE = /^\d{4}(-\d{2}-\d{2})?$/;
const TEXT = /^[^\p{Cc}]{1,100}$/u;
const MAX_ALBUMS = 50;

const RULES: Record<string, (v: string) => boolean> = {
	type: (v) => v === 'photo' || v === 'video',
	ext: (v) => /^[a-z0-9]{1,5}$/.test(v),
	camera: yesNo,
	from: isDate,
	to: isDate,
	album: isUuid,
	noalbum: (v) => v === 'yes',
	country: text,
	state: text,
	city: text,
	nolocation: (v) => v === 'yes',
	make: text,
	model: text,
	lens: text,
	favorite: yesNo,
	rating: (v) => /^[1-5]$/.test(v) || v === 'none',
	group: (v) => v === 'singles' || v === 'shoots' || v === 'both',
	reviewed: (v) => v === 'yes' || v === 'no' || v === 'both',
	shuffle: (v) => v === 'on' || v === 'off',
	minutes: (v) => /^\d{1,3}$/.test(v) && Number(v) >= 1 && Number(v) <= 120
};

function yesNo(v: string): boolean {
	return v === 'yes' || v === 'no';
}

function text(v: string): boolean {
	return TEXT.test(v);
}

// A bare year is accepted; Date.parse also rejects days like 2023-02-30 by round-tripping.
function isDate(v: string): boolean {
	if (!DATE.test(v)) return false;
	if (v.length === 4) return true;
	const t = Date.parse(`${v}T00:00:00Z`);
	return !Number.isNaN(t) && new Date(t).toISOString().startsWith(v);
}

/** Returns null for any unknown key, repeated single key, bad value or contradiction. */
export function parseCustom(params: URLSearchParams): Custom | null {
	for (const key of new Set(params.keys())) {
		// hasOwn, so keys like `constructor` do not resolve to Object.prototype.
		const rule = Object.hasOwn(RULES, key) ? RULES[key] : undefined;
		const values = params.getAll(key);
		if (!rule || !values.every(rule)) return null;
		if (key === 'album' ? values.length > MAX_ALBUMS : values.length > 1) return null;
	}
	const get = (key: string) => params.get(key);
	const flag = (key: string) => (get(key) === null ? null : get(key) === 'yes');
	const rating = get('rating');
	const minutes = get('minutes');
	const c: Custom = {
		type: get('type') as Custom['type'],
		ext: get('ext'),
		camera: flag('camera'),
		from: day(get('from'), '-01-01'),
		to: day(get('to'), '-12-31'),
		albums: [...new Set(params.getAll('album'))],
		noAlbum: get('noalbum') === 'yes',
		country: get('country'),
		state: get('state'),
		city: get('city'),
		noLocation: get('nolocation') === 'yes',
		make: get('make'),
		model: get('model'),
		lens: get('lens'),
		favorite: flag('favorite'),
		rating: rating === null || rating === 'none' ? rating : Number(rating),
		group: (get('group') ?? 'both') as Custom['group'],
		reviewed: (get('reviewed') ?? 'no') as Custom['reviewed'],
		shuffle: get('shuffle') === 'on',
		minutes: minutes === null ? null : Number(minutes)
	};
	return contradicts(c) ? null : c;
}

function day(v: string | null, yearSuffix: string): string | null {
	return v !== null && v.length === 4 ? v + yearSuffix : v;
}

function contradicts(c: Custom): boolean {
	const placed = c.country !== null || c.state !== null || c.city !== null;
	const cameraNamed = c.make !== null || c.model !== null || c.lens !== null;
	return (
		(c.from !== null && c.to !== null && c.from > c.to) ||
		(c.noAlbum && c.albums.length > 0) ||
		(c.noLocation && placed) ||
		(c.camera === false && cameraNamed)
	);
}

const DAY_MS = 86_400_000;

/**
 * The Immich search filter for the settings that Immich can apply. Days are
 * UTC, matching the existing takenAt queries. Grouping, review state, shuffle
 * and length are applied by the queue, not here.
 */
export function customFilter(c: Custom): AssetFilter {
	const f: AssetFilter = {};
	if (c.type) f.type = { eq: c.type === 'photo' ? AssetTypeEnum.Image : AssetTypeEnum.Video };
	if (c.ext) f.originalFileName = { endsWith: `.${c.ext}` };
	if (c.camera !== null) f.make = c.camera ? { ne: null } : { eq: null };
	if (c.from || c.to) {
		const takenAt: DateFilter = {};
		if (c.from) takenAt.gte = `${c.from}T00:00:00.000Z`;
		if (c.to) takenAt.lt = new Date(Date.parse(`${c.to}T00:00:00Z`) + DAY_MS).toISOString();
		f.takenAt = takenAt;
	}
	if (c.albums.length > 0) f.albumIds = { any: c.albums };
	if (c.noAlbum) f.hasAlbums = { eq: false };
	if (c.noLocation) f.country = { eq: null };
	if (c.country) f.country = { eq: c.country };
	if (c.state) f.state = { eq: c.state };
	if (c.city) f.city = { eq: c.city };
	if (c.make) f.make = { eq: c.make };
	if (c.model) f.model = { eq: c.model };
	if (c.lens) f.lensModel = { eq: c.lens };
	if (c.favorite !== null) f.isFavorite = { eq: c.favorite };
	if (c.rating === 'none') f.rating = { eq: null };
	else if (c.rating !== null) f.rating = { gte: c.rating };
	return f;
}
