import type { Hotkeys } from './albumKeys';
import type { Page } from './deck.svelte';
import type { AlbumList } from './server/albums';
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

export async function page(cursor: string | null): Promise<Page> {
	const query = cursor === null ? '' : `?${new URLSearchParams({ cursor })}`;
	return (await send(`/api/queue${query}`)).json() as Promise<Page>;
}

export async function decide(id: string, action: Action): Promise<void> {
	await post('/api/decide', { id, action, day: localDay(new Date()) });
}

/** Keeps the asset and sets its Immich favorite flag. */
export async function favorite(id: string): Promise<void> {
	await post('/api/decide', { id, action: 'keep', favorite: true, day: localDay(new Date()) });
}

/** Keeps the asset and adds it to an Immich album. */
export async function addToAlbum(id: string, albumId: string): Promise<void> {
	await post('/api/decide', { id, action: 'keep', albumId, day: localDay(new Date()) });
}

export async function albums(): Promise<AlbumList> {
	return (await send('/api/albums')).json() as Promise<AlbumList>;
}

export async function saveHotkeys(hotkeys: Hotkeys): Promise<void> {
	await send('/api/albums', {
		method: 'PUT',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({ hotkeys })
	});
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
