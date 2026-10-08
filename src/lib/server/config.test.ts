import { describe, expect, it } from 'vitest';
import { ConfigError, parseConfig } from './config';

const phc = '$argon2id$v=19$m=19456,t=2,p=1$c2FsdHNhbHRzYWx0$aGFzaGhhc2hoYXNoaGFzaA';
const b64 = (s: string) => Buffer.from(s).toString('base64');
const valid = {
	IMMICH_URL: 'http://immich.test:2283',
	IMMICH_API_KEY: 'abc123DEF456ghi789',
	APP_PASSWORD_HASH: b64(phc)
};

describe('parseConfig', () => {
	it('parses valid env and strips a trailing slash', () => {
		expect(parseConfig({ ...valid, IMMICH_URL: 'https://photos.test/' })).toEqual({
			immichUrl: 'https://photos.test',
			immichApiKey: 'abc123DEF456ghi789',
			appPasswordHash: phc,
			dataDir: 'data'
		});
	});

	it('keeps a sub-path for servers behind a path prefix', () => {
		expect(parseConfig({ ...valid, IMMICH_URL: 'https://host.test/immich/' }).immichUrl).toBe(
			'https://host.test/immich'
		);
	});

	it('takes DATA_DIR when set', () => {
		expect(parseConfig({ ...valid, DATA_DIR: '/data' }).dataDir).toBe('/data');
	});

	it.each([
		['missing URL', { IMMICH_URL: undefined }],
		['empty URL', { IMMICH_URL: '' }],
		['unparseable URL', { IMMICH_URL: 'not a url' }],
		['non-http URL', { IMMICH_URL: 'file:///etc/passwd' }],
		['URL with credentials', { IMMICH_URL: 'http://u:p@immich.test' }],
		['URL with query', { IMMICH_URL: 'http://immich.test/?x=1' }],
		['URL ending in /api', { IMMICH_URL: 'http://immich.test/api' }],
		['missing key', { IMMICH_API_KEY: undefined }],
		['key with whitespace', { IMMICH_API_KEY: 'abc def' }],
		['placeholder key', { IMMICH_API_KEY: 'replace-with-immich-api-key' }],
		['missing hash', { APP_PASSWORD_HASH: undefined }],
		['placeholder hash', { APP_PASSWORD_HASH: 'replace-with-hash-password-output' }],
		['raw PHC hash, not base64', { APP_PASSWORD_HASH: phc }],
		['argon2i hash', { APP_PASSWORD_HASH: b64(phc.replace('argon2id', 'argon2i')) }],
		['hash mangled by $ expansion', { APP_PASSWORD_HASH: b64('=19=19456,t=2,p=1') }]
	])('rejects %s', (_, override) => {
		expect(() => parseConfig({ ...valid, ...override })).toThrow(ConfigError);
	});

	it('never echoes the value in the error', () => {
		expect(() => parseConfig({ ...valid, IMMICH_URL: 'http://u:hunter2@immich.test' })).toThrow(
			/^IMMICH_URL must not contain credentials, query or fragment$/
		);
	});
});
