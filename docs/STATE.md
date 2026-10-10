# State

## Current task
13. Home screen: mode picker, percent sorted, space trashed, streak. I review.

## Tasks (one per session, in order)

13. Home screen: mode picker, percent sorted, space trashed, streak. I review.
13b. Clock in (also called Start shift): swipe plus photoshoot in ~15 minute shifts.
    Swipe as normal; when the next random photo sits in a burst, show the photoshoot
    view, then return to swipe. Between shifts, show whole-library progress
    (reviewed, trashed, space freed). Starting a shift plays a \"clocking in\" animation
    (card slides into a time-clock slot, stamps the time; reduced motion: fade). Needs 13.
    Split in STATE.md before coding: (a) a queue that yields single cards or bursts,
    (b) the combined screen, (c) shift timer, clock-in animation and summary screen.
14. Compare: Immich duplicate groups side by side, pick keepers, trash rest
    with deleteAssets (never resolveDuplicates).
15. Screenshots mode: heuristic (no camera make, screen-ratio dimensions,
    PNG, filename). Pure function with tests, then wire as a mode.
16. Deploy: multi-stage Dockerfile, base image pinned by digest, non-root,
    read-only rootfs, /data volume, healthcheck, compose example. Dependabot.
17. PWA manifest and icons for home-screen install. No media caching.
18. README (written by me).

## Done

1-9. Scaffold, Immich spike (server v3.2.0, @immich/sdk 3.2.0, docs/IMMICH-API.md), config, Immich client, auth, DB (migrations 002, 003), media proxy, queue and decisions API, design docs, swipe screen.
10. Video in card, double-tap and F favorite.
10b. GIFs play from `original` (previews are stills); `QueueItem.isGif`. Key has asset.download. 194 tests. Reviewed in browser.
10c. Share button in the Details row: `share.ts`, `originalFile` in `api.ts`. Shares via navigator.share, else downloads. 197 tests. Desktop and HTTPS phone reviewed.
11. Add to album: `albums.ts`, `/api/albums`, `albumId` on `/api/decide` (a keep), `AlbumSheet`, `albumKeys.ts`, digit hotkeys in settings. 225 tests. Reviewed in browser.
12. Modes: `modes.ts` (parse, on-this-day ranges), `queueModes.ts` (shuffle, on this day, album), `?mode=` and `&album=` on `/` and `/api/queue`. 256 tests. Reviewed in browser.
12b. Photoshoot at `/photoshoot`: `photoshoot.ts` (60 s gap, 3 to 16 shots), `mode=photoshoot`, pick keepers, Trash all, one-level burst undo, fullscreen. Reviewed in browser.
12c. Swipe actions: heart, album, details, share on the card; skip; undo overlay. Favorite and album are immediate (`assetActions.ts`, `/api/asset/[id]/favorite|albums`). Key gained albumAsset.delete. 279 tests. Reviewed in browser.

## Open decisions

- Clock in: does the shift timer pause on the summary screen, and is 15 minutes a setting?
- Shuffle efficiency once most of the library is reviewed: each call fetches 200 random assets, up to 3 times.
- Compare: whether a duplicate group stays listed in Immich after its extras are trashed via deleteAssets.

## Known issues

- Burst undo takes back only the last settled burst, one level. Favorites and album changes are immediate in Immich, so undo and unpicking do not revert them.
- Login error text uses `--cut`, breaking the Two Signals rule (red only for trash).
- `.timecode` and `.label` styles are duplicated per component. Header mode name is static until 13.
- Preload of the next 3 previews: confirm the browser reuses them (cache headers).
- `npm audit`: 3 low, cookie <0.7.0 (GHSA-pxg6-pf52-xh8x) via Kit 2. Not reachable. Fixed only by Kit 3.
- Spike key (over-privileged, pasted in chat): confirm it is deleted.
- `decide.ts` still accepts `favorite` and `albumId` on a keep, but the UI no longer sends them (favorite and album are now immediate, see DECISIONS). Remove them once nothing needs them.
- Share holds the whole original in memory; iOS may expire the gesture on long videos.
- Not tested live: startup with server trash disabled. Album add confirmed only by browser review.
- `src/routes/+page.svelte` is 301 lines and `src/routes/photoshoot/+page.svelte` 266, over the 200 line rule. Move deck, album and hotkey state into `.svelte.ts` modules.
- Task 16: prod node_modules (better-sqlite3, @node-rs/argon2), `ADDRESS_HEADER`/`XFF_DEPTH`, HSTS, no `Vary: Origin` on media.
- Migrations runner tracks only `user_version`: delete `data/` after editing an uncommitted migration.
- On this day: UTC day bounds (a photo near midnight may land on the neighbouring day), years from 1990 only, one Immich search per empty year. No mode picker until task 13.
- Not tested against real Immich: `albumIds.any` filter, `searchRandom` filter, takenAt range semantics, `getAllAlbums` by `assetId`.
- Photoshoot tries up to 10 random seeds per page, one Immich search each. No link to `/photoshoot` until task 13.
- Cursor allows 500 assets per timestamp.
