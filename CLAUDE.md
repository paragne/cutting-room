# cutting-room

Self-hosted web app for cleaning up an Immich library by swiping: right keeps,
left sends to Immich trash. Single user, one Immich API key held server-side.

@docs/STATE.md

## Stack

- Node 24 LTS, TypeScript strict, SvelteKit 2 with Svelte 5 and adapter-node
- @immich/sdk, pinned to the exact version matching the target Immich server
- SQLite via better-sqlite3, raw prepared statements, no ORM
- Argon2id via @node-rs/argon2 for the app password
- Vitest for unit tests, ESLint, svelte-check
- Docker image behind the existing reverse proxy. License AGPL-3.0-only (SDK is AGPL).

## Commands

- `npm run dev` : dev server on the devbox (I run it, not you)
- `npm run check` : svelte-check, eslint, vitest. Must pass before every commit.
- `npm run build` : production build
- `npm test` : vitest only

## Layout

- `src/lib/server/immich.ts` : the only module that talks to Immich
- `src/lib/server/db.ts` : the only module that touches SQLite; migrations in `src/lib/server/migrations/`
- `src/lib/server/auth.ts` : password check, sessions
- `src/lib/server/config.ts` : env parsing and validation, fails fast at startup
- `src/hooks.server.ts` : session guard, Origin check, security headers
- `src/routes/api/` : JSON endpoints (queue, decide, undo, albums, stats)
- `src/routes/media/[id]/` : thumbnail, preview and video proxy
- `src/lib/components/` : UI components
- `docs/` : STATE.md, DECISIONS.md, IMMICH-API.md

## Security rules (non-negotiable)

- The Immich URL and API key live in `$env/dynamic/private` and are only read
  in `src/lib/server/`. Nothing Immich-related reaches the browser except
  proxied media bytes and DTO fields we choose to send.
- Never call any Immich delete with force=true. Trash only.
- Refuse to trash anything if the server reports trash disabled. Check at startup.
- Every asset or album id from the client is validated as a UUID before use.
  The client never supplies a URL, path, or hostname.
- Every route except `/login` requires a valid session. Mutating requests
  (non-GET) must carry an Origin header matching the app ORIGIN.
- Session cookie: httpOnly, SameSite=Strict, Secure outside dev.
- Login is rate limited. Password compared with argon2 verify, never plaintext.
- Media proxy forwards only the Range header to Immich and only
  Content-Type, Content-Length, Content-Range, Accept-Ranges back.
- No secrets in code, tests, fixtures, logs, or commit messages. `.env` is
  gitignored; `.env.example` holds placeholders only.
- Dependencies pinned to exact versions (`save-exact=true` in .npmrc).
  Ask before adding any dependency and say why it is needed.

## Code rules

- Files under 200 lines. Split by responsibility, not by layer count.
- No `any`. No `console.log` left in committed code; use the logger in
  `src/lib/server/log.ts`, which never logs headers or env values.
- Pure logic (queue ordering, streak math, screenshot heuristic) lives in
  plain TS modules with unit tests. Components stay thin.
- Mock Immich in tests at the `immich.ts` boundary. Tests never hit a real server.
- If a test fails, diagnose first. Say whether the code or the test is wrong
  and wait for my decision before changing a test.

## UI rules

- Read PRODUCT.md and DESIGN.md before any UI work.
- Mobile first, single column, actions in the lower third.
- No branding, names, illustrations, or copy from Picnic or any other app.
- UI work is not done until I have seen it running. Stop and tell me what to check.

## Session rules

- One task per session, from docs/STATE.md.
- Small commits to main, conventional commit messages, no Co-Authored-By trailer.
- Append architecture decisions to docs/DECISIONS.md, one line each with the reason.
- End every session with /handoff.
