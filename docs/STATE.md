# State

## Current task

3. Config and Immich client

## Tasks (one per session, in order)

3. Config and Immich client: `config.ts` env validation (fail fast),
   `immich.ts` wrapper exposing only the calls from IMMICH-API.md, startup
   check for server version (3.2.0) and trash enabled, trash check before
   every trash call, `log.ts`. Unit tests.
   Remove `passWithNoTests` from vite.config.ts once tests exist.
4. Auth: argon2id password hash from env, login page, sessions in SQLite,
   hooks guard, Origin check on non-GET, security headers and CSP, login
   rate limit. `scripts/hash-password.ts`. Tests.
5. DB: migrations runner, tables for decisions, daily stats, settings.
   `db.ts` with prepared statements only. Tests on an in-memory DB.
6. Media proxy: thumbnail, preview, video routes with UUID validation,
   Range passthrough, header allowlist. Use fetch, not SDK Blob calls; no
   fullsize, no redirect following. Tests with mocked Immich.
7. Queue and decisions API: timeline mode (oldest, newest), excludes
   reviewed ids, keep, trash, undo (restore from trash). Keyset paging on
   takenAt, explicit trashedAt and visibility filters. Tests.
8. Design: run /impeccable init (PRODUCT.md) and write DESIGN.md. No code.
9. Swipe screen: card stack, pointer drag with fling threshold, keep and
   trash buttons, arrow keys, Ctrl+Z, preload next 3. I review it running.
10. Video playback in card, double-tap and F to favorite. I review.
11. Add to album: picker sheet, 0-9 hotkeys stored in settings. I review.
12. Modes: shuffle, on this day (date range per past year), single album.
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

## Open decisions

- Shuffle mode efficiency once most of the library is reviewed.
- Compare: whether a duplicate group stays listed in Immich after its extras are trashed via deleteAssets.

## Known issues

- `npm audit`: 3 low, cookie <0.7.0 (GHSA-pxg6-pf52-xh8x) via Kit 2. Cookie
  name, path and domain come from constants, so not reachable. Fixed only by Kit 3.
- Spike API key was pasted in chat and is over-privileged (library.*,
  asset.download). Replace it with a key holding only the 8 permissions
  listed in IMMICH-API.md before task 3 runs against the server.
- Album and duplicate calls not yet tested live (test key lacked permissions).
