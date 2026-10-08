import { verify } from '@node-rs/argon2';
import { createHash, randomBytes } from 'node:crypto';
import { getConfig } from './config';
import type { Db } from './db';

export const SESSION_COOKIE = 'session';
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
export const LOGIN_MAX_FAILURES = 5;
export const LOGIN_WINDOW_MS = 15 * 60 * 1000;

export function checkPassword(password: string): Promise<boolean> {
	return verify(getConfig().appPasswordHash, password);
}

// Only the hash is stored, so a leaked database file holds no usable session.
function hashToken(token: string): string {
	return createHash('sha256').update(token).digest('hex');
}

export function createSession(db: Db, now = Date.now()): { token: string; expiresAt: number } {
	const token = randomBytes(32).toString('base64url');
	const expiresAt = now + SESSION_TTL_MS;
	db.deleteExpiredSessions.run(now);
	db.insertSession.run(hashToken(token), expiresAt);
	return { token, expiresAt };
}

export function isValidSession(db: Db, token: string, now = Date.now()): boolean {
	return db.findSession.get(hashToken(token), now) !== undefined;
}

export function deleteSession(db: Db, token: string): void {
	db.deleteSession.run(hashToken(token));
}

// In memory: a restart resets counts, which costs an attacker nothing they could not
// get by waiting out the window.
const failures = new Map<string, { count: number; resetAt: number }>();

export function isLoginBlocked(ip: string, now = Date.now()): boolean {
	const entry = failures.get(ip);
	return entry !== undefined && entry.resetAt > now && entry.count >= LOGIN_MAX_FAILURES;
}

export function recordLoginFailure(ip: string, now = Date.now()): void {
	if (failures.size > 1000) {
		for (const [key, entry] of failures) if (entry.resetAt <= now) failures.delete(key);
	}
	const entry = failures.get(ip);
	if (entry && entry.resetAt > now) entry.count++;
	else failures.set(ip, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
}

export function clearLoginFailures(ip: string): void {
	failures.delete(ip);
}
