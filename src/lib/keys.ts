import type { Action } from './server/db';

export type Command = Action | 'undo';

interface KeyLike {
	key: string;
	ctrlKey: boolean;
	metaKey: boolean;
	altKey: boolean;
}

export function command(e: KeyLike): Command | null {
	if (e.altKey) return null;
	const mod = e.ctrlKey || e.metaKey;
	if (mod) return e.key.toLowerCase() === 'z' ? 'undo' : null;
	if (e.key === 'ArrowRight') return 'keep';
	if (e.key === 'ArrowLeft') return 'trash';
	return null;
}
