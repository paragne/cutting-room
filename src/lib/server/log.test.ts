import { afterEach, describe, expect, it, vi } from 'vitest';
import { log } from './log';

function capture(stream: NodeJS.WriteStream): () => string {
	const spy = vi.spyOn(stream, 'write').mockReturnValue(true);
	return () => spy.mock.calls.map((c) => String(c[0])).join('');
}

afterEach(() => vi.restoreAllMocks());

describe('log', () => {
	it('writes one JSON line with level and message', () => {
		const out = capture(process.stdout);
		log.info('started', { count: 3 });
		expect(JSON.parse(out())).toMatchObject({ level: 'info', msg: 'started', count: 3 });
	});

	it('redacts fields with sensitive names', () => {
		const err = capture(process.stderr);
		log.error('failed', { apiKey: 's3cret-a', 'x-api-key': 's3cret-b', Authorization: 's3cret-c' });
		expect(err()).not.toContain('s3cret');
	});

	it('does not let fields overwrite level or message', () => {
		const out = capture(process.stdout);
		log.info('real', { msg: 'fake', level: 'error' });
		expect(JSON.parse(out())).toMatchObject({ level: 'info', msg: 'real' });
	});
});
