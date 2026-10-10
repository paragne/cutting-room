import type { Action } from './server/db';

export type Command = Action | 'undo' | 'favorite';

interface KeyLike {
	key: string;
	ctrlKey: boolean;
	metaKey: boolean;
	altKey: boolean;
}

/** A bare digit key, for album hotkeys. */
export function digit(e: KeyLike): string | null {
	if (e.altKey || e.ctrlKey || e.metaKey) return null;
	return /^[0-9]$/.test(e.key) ? e.key : null;
}

export function command(e: KeyLike): Command | null {
	if (e.altKey) return null;
	const mod = e.ctrlKey || e.metaKey;
	if (mod) return e.key.toLowerCase() === 'z' ? 'undo' : null;
	if (e.key.toLowerCase() === 'f') return 'favorite';
	if (e.key === 'ArrowRight') return 'keep';
	if (e.key === 'ArrowLeft') return 'trash';
	return null;
}
