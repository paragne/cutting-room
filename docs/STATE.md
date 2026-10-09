# State

## Current task

9b. Swipe screen UI (see task list).

## Tasks (one per session, in order)

9b. Swipe screen UI: card stack, pointer drag, Trash/Undo/Keep buttons, arrow
    keys, Ctrl+Z, preload next 3. Follow .impeccable/surfaces/ brief. I review.
9c. Restyle login to match, then regenerate DESIGN.md from the built screen.
10. Video playback in card, double-tap and F to favorite. I review.
11. Add to album: picker sheet, 0-9 hotkeys stored in settings. I review.
12. Modes: shuffle all (the default), on this day (date range per past
    year), single album.
12b. Photoshoot shuffle: random burst, pick the best, trash the rest.
13. Home screen: mode picker, percent sorted, space trashed, streak. I review.
14. Compare: Immich duplicate groups side by side, pick keepers, trash rest
    with deleteAssets (never resolveDuplicates).
15. Screenshots mode: heuristic (no camera make, screen-ratio dimensions,
    PNG, filename). Pure function with tests, then wire as a mode.
16. Deploy: multi-stage Dockerfile, base image pinned by digest, non-root,
    read-only rootfs, /data volume, healthcheck, compose example. Dependabot.
17. PWA manifest and icons for home-screen install. No media caching.
18. README (written by me).

## Done

1. Scaffold: SvelteKit 2.70.3, adapter-node 5.5.7, TS strict, eslint, vitest, `npm run check` passing.
2. Immich API spike: server v3.2.0 and @immich/sdk 3.2.0 pinned, docs/IMMICH-API.md written, trash/restore verified live.
3. Config and Immich client: `config.ts`, `log.ts`, `immich.ts`, startup check in `hooks.server.ts` `init` (version, trash, key), 26 tests. Verified live.
4a. Auth core: `auth.ts` (argon2 check, hashed sessions, per-IP rate limit), `db.ts` with migrations runner and sessions table, base64 `APP_PASSWORD_HASH` and `DATA_DIR` in config, `scripts/hash-password.ts`, 44 tests.
4b. Auth wiring: `guard.ts` (Origin check, 401 for /api, else redirect), security headers, kit.csp, login page, POST /logout, 55 tests. Reviewed in browser.
5. DB tables: migration 002 (decisions, daily_stats, settings), `recordDecision`/`removeDecision` transactions and read statements in `db.ts`, 65 tests.
6. Media proxy: `fetchMedia` in `immich.ts`, `media.ts`, route `/media/[id]/[kind]` (thumbnail, preview, video), 90 tests. Verified live with curl.
7. Queue and decisions API: `queue.ts` (keyset cursor), `decide.ts`, GET /api/queue, POST /api/decide, POST /api/undo, 143 tests. Verified live with curl.
8. Design: PRODUCT.md, seed DESIGN.md (edit suite at 2am), swipe screen brief in `.impeccable/surfaces/`.
9a. Swipe logic: `swipe.ts` (release rule, velocity), `deck.svelte.ts` (Deck class: current, upcoming 3, refill, undo history), `api.ts` client wrappers, 164 tests. No UI.

## Open decisions

- Shuffle mode efficiency once most of the library is reviewed.
- Photoshoot detection: time gap, location, or Immich data.
- Compare: whether a duplicate group stays listed in Immich after its extras are trashed via deleteAssets.

## Known issues

- 9b: Deck shows a 401 (expired session) as an error message; the screen must
  redirect to /login instead. Swipe thresholds in `swipe.ts` are starting values.

- `npm audit`: 3 low, cookie <0.7.0 (GHSA-pxg6-pf52-xh8x) via Kit 2. Cookie
  name, path and domain come from constants, so not reachable. Fixed only by Kit 3.
- Spike key (over-privileged, pasted in chat): confirm it is deleted in Immich.
- Not tested live: `addAssetsToAlbum`, startup with server trash disabled.
- Task 16: image needs production node_modules (better-sqlite3, @node-rs/argon2),
  `ADDRESS_HEADER`/`XFF_DEPTH` for the real proxy, and a check for HSTS and no
  `Vary: Origin` on media (seen in dev, likely Vite).
- Migrations runner tracks only `user_version`, so a DB built from an edited
  migration keeps the old schema. Delete `data/` after any pre-commit migration edit.
- Queue is date ordered until task 12. A first page after a long reviewed run
  costs one Immich search per 200 reviewed assets. Cursor allows at most 500
  assets sharing one timestamp.
