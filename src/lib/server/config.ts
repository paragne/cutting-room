import { env } from '$env/dynamic/private';

export type Config = {
	immichUrl: string;
	immichApiKey: string;
};

export class ConfigError extends Error {
	name = 'ConfigError';
}

// Messages name the variable but never echo its value.
export function parseConfig(source: Record<string, string | undefined>): Config {
	return {
		immichUrl: parseImmichUrl(source.IMMICH_URL),
		immichApiKey: parseApiKey(source.IMMICH_API_KEY)
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

let cached: Config | undefined;

export function getConfig(): Config {
	cached ??= parseConfig(env);
	return cached;
}
