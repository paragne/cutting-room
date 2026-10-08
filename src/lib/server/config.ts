import { env } from '$env/dynamic/private';

export type Config = {
	immichUrl: string;
	immichApiKey: string;
	appPasswordHash: string;
	dataDir: string;
};

export class ConfigError extends Error {
	name = 'ConfigError';
}

// Messages name the variable but never echo its value.
export function parseConfig(source: Record<string, string | undefined>): Config {
	return {
		immichUrl: parseImmichUrl(source.IMMICH_URL),
		immichApiKey: parseApiKey(source.IMMICH_API_KEY),
		appPasswordHash: parsePasswordHash(source.APP_PASSWORD_HASH),
		dataDir: source.DATA_DIR || 'data'
	};
}

function parseImmichUrl(raw: string | undefined): string {
	if (!raw) throw new ConfigError('IMMICH_URL is not set');
	let url: URL;
	try {
		url = new URL(raw);
	} catch {
		throw new ConfigError('IMMICH_URL is not a valid URL');
	}
	if (url.protocol !== 'http:' && url.protocol !== 'https:') {
		throw new ConfigError('IMMICH_URL must use http or https');
	}
	if (url.username || url.password || url.search || url.hash) {
		throw new ConfigError('IMMICH_URL must not contain credentials, query or fragment');
	}
	if (url.pathname.endsWith('/api') || url.pathname.endsWith('/api/')) {
		throw new ConfigError('IMMICH_URL must be the server root, without /api');
	}
	return url.href.replace(/\/+$/, '');
}

function parseApiKey(raw: string | undefined): string {
	if (!raw) throw new ConfigError('IMMICH_API_KEY is not set');
	if (/\s/.test(raw)) throw new ConfigError('IMMICH_API_KEY contains whitespace');
	if (raw.startsWith('replace-with')) {
		throw new ConfigError('IMMICH_API_KEY is still the .env.example placeholder');
	}
	return raw;
}

const ARGON2ID_PHC = /^\$argon2id\$v=19\$m=\d+,t=\d+,p=\d+\$[A-Za-z0-9+/]+\$[A-Za-z0-9+/]+$/;

// Base64 of the PHC string. A raw hash is full of `$`, which Vite's .env loader
// and Docker Compose both treat as variable references and silently mangle.
function parsePasswordHash(raw: string | undefined): string {
	if (!raw) throw new ConfigError('APP_PASSWORD_HASH is not set');
	if (raw.startsWith('replace-with')) {
		throw new ConfigError('APP_PASSWORD_HASH is still the .env.example placeholder');
	}
	const phc = Buffer.from(raw, 'base64').toString('utf8');
	if (!ARGON2ID_PHC.test(phc)) {
		throw new ConfigError('APP_PASSWORD_HASH is not output of scripts/hash-password.ts');
	}
	return phc;
}

let cached: Config | undefined;

export function getConfig(): Config {
	cached ??= parseConfig(env);
	return cached;
}
