# State

## Current task

9c. Restyle login to match (see task list).

## Tasks (one per session, in order)

9c. Restyle login to match, then regenerate DESIGN.md from the built screen
    (tokens now live in `src/lib/theme.css`).
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

1-3. Scaffold (SvelteKit 2.70.3, adapter-node 5.5.7), Immich spike (server v3.2.0, @immich/sdk 3.2.0 pinned, docs/IMMICH-API.md), config and Immich client with startup check. Verified live.
4a-4b. Auth: `auth.ts`, `guard.ts` (Origin check, 401 for /api), security headers, kit.csp, login page, /logout. Reviewed in browser.
5. DB: migration 002 (decisions, daily_stats, settings), `recordDecision`/`removeDecision` in `db.ts`.
6. Media proxy: `media.ts`, route `/media/[id]/[kind]` (thumbnail, preview, video). Verified live.
7. Queue and decisions API: `queue.ts` (keyset cursor), `decide.ts`, /api/queue, /api/decide, /api/undo. Verified live.
8. Design: PRODUCT.md, seed DESIGN.md (edit suite at 2am), swipe screen brief in `.impeccable/surfaces/`.
9a. Swipe logic: `swipe.ts` (release rule, velocity), `deck.svelte.ts` (Deck class: current, upcoming 3, refill, undo history), `api.ts` client wrappers, 164 tests. No UI.
9b. Swipe screen UI: `Card` (pointer drag, razor/slide exits, undo re-entry), `Timeline`, `Controls`, `AssetInfo` (date plus Details dropdown, `GET /api/asset/[id]`), `keys.ts`, `theme.css`, 401 redirects to /login, 175 tests. Reviewed in browser.

## Open decisions

- Shuffle mode efficiency once most of the library is reviewed.
- Photoshoot detection: time gap, location, or Immich data.
- Compare: whether a duplicate group stays listed in Immich after its extras are trashed via deleteAssets.

## Known issues

- Mode name in the header is a static title until task 13 adds the mode picker.
- Preload of the next 3 previews: confirm in the Network tab that the media proxy
  sends cache headers so the browser reuses them (not checked).
- `npm audit`: 3 low, cookie <0.7.0 (GHSA-pxg6-pf52-xh8x) via Kit 2. Cookie
  name, path and domain come from constants, so not reachable. Fixed only by Kit 3.
- Spike key (over-privileged, pasted in chat): confirm it is deleted.
- Not tested live: `addAssetsToAlbum`, startup with server trash disabled.
- Task 16: image needs production node_modules (better-sqlite3, @node-rs/argon2),
  `ADDRESS_HEADER`/`XFF_DEPTH` for the real proxy, and a check for HSTS and no
  `Vary: Origin` on media (seen in dev, likely Vite).
- Migrations runner tracks only `user_version`, so a DB built from an edited
  migration keeps the old schema. Delete `data/` after any pre-commit migration edit.
- Queue is date ordered until task 12. A first page after a long reviewed run
  costs one Immich search per 200 reviewed assets. Cursor allows at most 500
  assets sharing one timestamp.

