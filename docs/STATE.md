# State

## Current task

6. Media proxy

## Tasks (one per session, in order)

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
3. Config and Immich client: `config.ts`, `log.ts`, `immich.ts`, startup check in `hooks.server.ts` `init` (version, trash, key), 26 tests. Verified live.
4a. Auth core: `auth.ts` (argon2 check, hashed sessions, per-IP rate limit), `db.ts` with migrations runner and sessions table, base64 `APP_PASSWORD_HASH` and `DATA_DIR` in config, `scripts/hash-password.ts`, 44 tests.
4b. Auth wiring: `guard.ts` (Origin check, 401 for /api, else redirect), security headers, kit.csp, login page, POST /logout, 55 tests. Reviewed in browser.
5. DB tables: migration 002 (decisions, daily_stats, settings), `recordDecision`/`removeDecision` transactions and read statements in `db.ts`, 65 tests.

## Open decisions

- Shuffle mode efficiency once most of the library is reviewed.
- Compare: whether a duplicate group stays listed in Immich after its extras are trashed via deleteAssets.

## Known issues

- `npm audit`: 3 low, cookie <0.7.0 (GHSA-pxg6-pf52-xh8x) via Kit 2. Cookie
  name, path and domain come from constants, so not reachable. Fixed only by Kit 3.
- Spike key (over-privileged, pasted in chat): confirm it is deleted in Immich.
- Not tested live: `addAssetsToAlbum`, and startup with server trash disabled
  (covered by unit tests).
- Task 16: image needs production node_modules (better-sqlite3, @node-rs/argon2
  are external). Set `ADDRESS_HEADER`/`XFF_DEPTH` to match the real proxy.
- Login page is unstyled on purpose; restyle after task 8 (DESIGN.md).
- Task 6 media fetch goes inside `immich.ts` (125 lines; split if it passes 200).
- Task 7: callers of `recordDecision` supply the local `day` (YYYY-MM-DD) and the
  trashed asset's file size (`exifInfo.fileSizeInByte`, may be null).
