# State

## Current task
12b. Photoshoot shuffle: random burst, pick the best, trash the rest.

## Tasks (one per session, in order)

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

1-3. Scaffold (SvelteKit 2.70.3, adapter-node 5.5.7), Immich spike (server v3.2.0, @immich/sdk 3.2.0, docs/IMMICH-API.md), config, Immich client with startup check.
4. Auth (`auth.ts`, `guard.ts`, security headers, login, /logout).
5. DB: migrations 002 (decisions, daily_stats, settings), 003 (favorite).
6. Media proxy `media.ts`, `/media/[id]/[kind]` (thumbnail, preview, video, original).
7. Queue and decisions API: keyset cursor, /api/queue, /api/decide, /api/undo.
8. Design: PRODUCT.md, DESIGN.md, swipe screen brief in `.impeccable/surfaces/`.
9. Swipe logic and screen (Card, Timeline, Controls, AssetInfo, keys), login restyle.
10. Video in card, double-tap and F favorite.
10b. GIFs play from `original` (previews are stills); `QueueItem.isGif`. Key has asset.download. 194 tests. Reviewed in browser.
10c. Share button in the Details row: `share.ts`, `originalFile` in `api.ts`. Shares via navigator.share, else downloads. 197 tests. Desktop and HTTPS phone reviewed.
11. Add to album: `albums.ts`, `/api/albums`, `albumId` on `/api/decide` (a keep), `AlbumSheet`, `albumKeys.ts`, digit hotkeys in settings. 225 tests. Reviewed in browser.
12. Modes: `modes.ts` (parse, on-this-day ranges), `queueModes.ts` (shuffle, on this day, album), `?mode=` and `&album=` on `/` and `/api/queue`. 256 tests. Reviewed in browser.

## Open decisions

- Shuffle efficiency once most of the library is reviewed: each call fetches 200 random assets, up to 3 times.
- Photoshoot detection: time gap, location, or Immich data.
- Compare: whether a duplicate group stays listed in Immich after its extras are trashed via deleteAssets.

## Known issues

- Login error text uses `--cut`, breaking the Two Signals rule (red only for trash).
- `.timecode` and `.label` styles are duplicated per component. Header mode name is static until 13.
- Preload of the next 3 previews: confirm the browser reuses them (cache headers).
- `npm audit`: 3 low, cookie <0.7.0 (GHSA-pxg6-pf52-xh8x) via Kit 2. Not reachable
  (cookie name, path, domain are constants). Fixed only by Kit 3.
- Spike key (over-privileged, pasted in chat): confirm it is deleted.
- Favorite on a keep costs one extra `getAsset`, so undo never unfavorites an existing favorite.
- Share holds the whole original in memory, and a long video download may expire the share
  gesture on iOS. Range streaming is untested on `original`.
- Not tested live: startup with server trash disabled. Album add confirmed only by browser review.
- Undo does not remove an asset from an album (key lacks albumAsset.delete).
- `src/routes/+page.svelte` is 248 lines, over the 200 line rule. Split it (album and hotkey state is a candidate).
- Task 16: needs prod node_modules (better-sqlite3, @node-rs/argon2), `ADDRESS_HEADER`/
  `XFF_DEPTH`, and a check for HSTS and no `Vary: Origin` on media.
- Migrations runner tracks only `user_version`: delete `data/` after editing an uncommitted migration.
- On this day: UTC day bounds (a photo near midnight may land on the neighbouring day), years from 1990 only, one Immich search per empty year. No mode picker until task 13.
- Not tested against real Immich: `albumIds.any` filter, `searchRandom` filter, takenAt range semantics.
- Cursor allows 500 assets per timestamp.
