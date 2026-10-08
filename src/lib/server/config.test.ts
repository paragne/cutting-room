import { describe, expect, it } from 'vitest';
import { ConfigError, parseConfig } from './config';

const valid = { IMMICH_URL: 'http://immich.test:2283', IMMICH_API_KEY: 'abc123DEF456ghi789' };

describe('parseConfig', () => {
	it('parses valid env and strips a trailing slash', () => {
		expect(parseConfig({ ...valid, IMMICH_URL: 'https://photos.test/' })).toEqual({
			immichUrl: 'https://photos.test',
			immichApiKey: 'abc123DEF456ghi789'
		});
	});

	it('keeps a sub-path for servers behind a path prefix', () => {
		expect(parseConfig({ ...valid, IMMICH_URL: 'https://host.test/immich/' }).immichUrl).toBe(
			'https://host.test/immich'
		);
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
		['placeholder key', { IMMICH_API_KEY: 'replace-with-immich-api-key' }]
	])('rejects %s', (_, override) => {
		expect(() => parseConfig({ ...valid, ...override })).toThrow(ConfigError);
	});

	it('never echoes the value in the error', () => {
		expect(() => parseConfig({ ...valid, IMMICH_URL: 'http://u:hunter2@immich.test' })).toThrow(
			/^IMMICH_URL must not contain credentials, query or fragment$/
		);
	});
});
