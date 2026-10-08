# State

## Current task

1. Scaffold

## Tasks (one per session, in order)

1. Scaffold: SvelteKit 2 + Svelte 5 + adapter-node, TS strict, ESLint,
   svelte-check, Vitest, `npm run check`. `.npmrc` with save-exact, `.nvmrc`
   (24), `.gitignore` (.env, data/, build/), `.env.example`, AGPL-3.0 LICENSE.
2. Immich API spike: pin Immich server and @immich/sdk versions. Write
   docs/IMMICH-API.md mapping every action (list, random, metadata search,
   date range, trash, restore, favorite, albums, duplicates, thumbnail,
   playback) to the exact SDK function and API key permission. Confirm what
   delete does when server trash is disabled. Docs only, no app code.
3. Config and Immich client: `config.ts` env validation (fail fast),
   `immich.ts` wrapper exposing only the calls from IMMICH-API.md, startup
   check for server version and trash enabled, `log.ts`. Unit tests.
4. Auth: argon2id password hash from env, login page, sessions in SQLite,
   hooks guard, Origin check on non-GET, security headers and CSP, login
   rate limit. `scripts/hash-password.ts`. Tests.
5. DB: migrations runner, tables for decisions, daily stats, settings.
   `db.ts` with prepared statements only. Tests on an in-memory DB.
6. Media proxy: thumbnail, preview, video routes with UUID validation,
   Range passthrough, header allowlist. Tests with mocked Immich.
7. Queue and decisions API: timeline mode (oldest, newest), excludes
   reviewed ids, keep, trash, undo (restore from trash). Tests.
8. Design: run /impeccable init (PRODUCT.md) and write DESIGN.md. No code.
9. Swipe screen: card stack, pointer drag with fling threshold, keep and
   trash buttons, arrow keys, Ctrl+Z, preload next 3. I review it running.
10. Video playback in card, double-tap and F to favorite. I review.
11. Add to album: picker sheet, 0-9 hotkeys stored in settings. I review.
12. Modes: shuffle, on this day (date range per past year), single album.
13. Home screen: mode picker, percent sorted, space trashed, streak. I review.
14. Compare: Immich duplicate groups side by side, pick keepers, trash rest.
15. Screenshots mode: heuristic (no camera make, screen-ratio dimensions,
    PNG, filename). Pure function with tests, then wire as a mode.
16. Deploy: multi-stage Dockerfile, base image pinned by digest, non-root,
    read-only rootfs, /data volume, healthcheck, compose example. Dependabot.
17. PWA manifest and icons for home-screen install. No media caching.
18. README (written by me).

## Done

Nothing yet.

## Open decisions

- Shuffle mode efficiency once most of the library is reviewed.

## Known issues

None yet.
