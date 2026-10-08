// Prints APP_PASSWORD_HASH for .env. Reads the password from stdin so it never
// lands in shell history or the process list:
//   read -rs P && printf %s "$P" | node scripts/hash-password.ts; unset P
import { hash } from '@node-rs/argon2';
import { text } from 'node:stream/consumers';

const MIN_LENGTH = 12;

const password = (await text(process.stdin)).replace(/\r?\n$/, '');
if (password.length < MIN_LENGTH) {
	process.stderr.write(`Password must be at least ${MIN_LENGTH} characters.\n`);
	process.exit(1);
}
// Library defaults: argon2id, m=19456 KiB, t=2, p=1 (OWASP minimum).
const phc = await hash(password);
process.stdout.write(Buffer.from(phc).toString('base64') + '\n');
