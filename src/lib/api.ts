import type { Page } from './deck.svelte';
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

export async function undo(id: string): Promise<void> {
	await post('/api/undo', { id });
}

export async function assetInfo(id: string): Promise<AssetInfo> {
	return (await send(`/api/asset/${id}`)).json() as Promise<AssetInfo>;
}
