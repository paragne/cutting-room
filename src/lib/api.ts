import type { Hotkeys } from './albumKeys';
import type { Page } from './deck.svelte';
import type { AlbumList } from './server/albums';
import type { ClockinPage } from './server/clockin';
import type { AssetInfo } from './server/assetInfo';
import type { Action } from './server/db';

export class Unauthorized extends Error {
	constructor() {
		super('session expired');
	}
}

async function send(path: string, init?: RequestInit): Promise<Response> {
	const res = await fetch(path, init);
	if (res.ok) return res;
	if (res.status === 401) throw new Unauthorized();
	const { message } = (await res.json().catch(() => ({}))) as { message?: string };
	throw new Error(message ?? `request failed (${res.status})`);
}

function post(path: string, body: object): Promise<Response> {
	return send(path, {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify(body)
	});
}

/** The local calendar date, which the server counts daily stats by. */
export function localDay(d: Date): string {
	const pad = (n: number) => String(n).padStart(2, '0');
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** `mode` is the `mode` and `album` query of the screen; an on-this-day queue also gets today's date. */
export async function page(cursor: string | null, mode: URLSearchParams): Promise<Page> {
	const query = new URLSearchParams(mode);
	if (query.get('mode') === 'onThisDay') query.set('day', localDay(new Date()));
	if (cursor !== null) query.set('cursor', cursor);
	return (await send(`/api/queue?${query}`)).json() as Promise<Page>;
}

export async function decide(id: string, action: Action): Promise<void> {
	await post('/api/decide', { id, action, day: localDay(new Date()) });
}

function put(path: string, body: object): Promise<Response> {
	return send(path, {
		method: 'PUT',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify(body)
	});
}

/** Sets the Immich favorite flag. It records no decision. */
export async function setFavorite(id: string, favorite: boolean): Promise<void> {
	await put(`/api/asset/${id}/favorite`, { favorite });
}

/** The ids of the albums that hold the asset. */
export async function albumsOf(id: string): Promise<string[]> {
	const { albumIds } = (await (await send(`/api/asset/${id}/albums`)).json()) as {
		albumIds: string[];
	};
	return albumIds;
}

/** Adds the asset to an album or removes it. It records no decision. */
export async function setMember(id: string, albumId: string, member: boolean): Promise<void> {
	await put(`/api/asset/${id}/albums`, { albumId, member });
}

export async function albums(): Promise<AlbumList> {
	return (await send('/api/albums')).json() as Promise<AlbumList>;
}

export async function saveHotkeys(hotkeys: Hotkeys): Promise<void> {
	await put('/api/albums', { hotkeys });
}

export async function undo(id: string): Promise<void> {
	await post('/api/undo', { id });
}

export async function assetInfo(id: string): Promise<AssetInfo> {
	return (await send(`/api/asset/${id}`)).json() as Promise<AssetInfo>;
}

/** The original bytes, named as in Immich, ready to share or download. */
export async function originalFile(id: string): Promise<File> {
	const [info, res] = await Promise.all([assetInfo(id), send(`/media/${id}/original`)]);
	const blob = await res.blob();
	return new File([blob], info.fileName, { type: blob.type });
}

export async function clockinPage(cursor: string | null): Promise<ClockinPage> {
	const query = new URLSearchParams({ mode: 'clockin' });
	if (cursor !== null) query.set('cursor', cursor);
	return (await send(`/api/queue?${query}`)).json() as Promise<ClockinPage>;
}
