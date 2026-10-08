type Level = 'info' | 'warn' | 'error';

// Primitives only, so header bags, request objects and env cannot be passed in whole.
export type Fields = Record<string, string | number | boolean | null>;

const SENSITIVE_KEY = /key|token|secret|password|passwd|auth|cookie|header|session/i;

function write(level: Level, msg: string, fields: Fields = {}): void {
	const safe: Fields = {};
	for (const [k, v] of Object.entries(fields)) {
		safe[k] = SENSITIVE_KEY.test(k) ? '[redacted]' : v;
	}
	const line = JSON.stringify({ ...safe, time: new Date().toISOString(), level, msg });
	if (level === 'info') process.stdout.write(line + '\n');
	else process.stderr.write(line + '\n');
}

export const log = {
	info: (msg: string, fields?: Fields) => write('info', msg, fields),
	warn: (msg: string, fields?: Fields) => write('warn', msg, fields),
	error: (msg: string, fields?: Fields) => write('error', msg, fields)
};
