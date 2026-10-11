# State

## Current task
13b(d). Clock in animation: card slides into a time-clock slot and stamps the time when a
shift starts or a card is decided. Reduced motion: fade. No timer, percent or count shown.

## Tasks (one per session, in order)
14. Compare: Immich duplicate groups side by side, pick keepers, trash rest
    with deleteAssets (never resolveDuplicates).
15. Screenshots mode: heuristic (no camera make, screen-ratio dimensions,
    PNG, filename). Pure function with tests, then wire as a mode.
16. Deploy: multi-stage Dockerfile, base image pinned by digest, non-root,
    read-only rootfs, /data volume, healthcheck, compose example. Dependabot.
17. PWA manifest and icons for home-screen install. No media caching.
18. README (written by me).

## Done

1-9. Scaffold, Immich spike (server v3.2.0, @immich/sdk 3.2.0, docs/IMMICH-API.md), config, Immich client, auth, DB, media proxy, queue and decisions API, design docs, swipe screen.
10, 10b, 10c. Video in card, double-tap and F favorite, GIFs from `original`, share button.
11. Add to album: `albums.ts`, `/api/albums`, `AlbumSheet`, `albumKeys.ts`, digit hotkeys.
12, 12b, 12c. Modes (`modes.ts`, `queueModes.ts`), photoshoot at `/photoshoot`, swipe actions (heart, album, details, share, skip, undo).
13. Home screen at `/`: `stats.ts`, `ModePicker`; swipe moved to `/swipe`.
13b(a). Clock in queue: `clockin.ts` (server), `mode=clockin`.
13b(b). Clock in screen at `/clockin`: `clockin.svelte.ts` (queue, undo, burst settle), `assetTools.svelte.ts`, `CardStage`, `Shoot`, `AssetSheets`; `ShootHeader` takes `title` and `home`. Reviewed in browser.
13b(c). Shifts: `shift.ts` (6 s per photo, `SHIFT_MINUTES` env, default 15), `ShiftSummary`, `/clockin` load, `totals.ts`. Shift ends by estimated work, nothing shown while it runs. 325 tests. Reviewed in browser.
13b(d-pre). Burst viewer: "Keep all", prev/next arrows and swipe, tap outside the photo closes (`ShootViewer`, `viewer.ts`).

## Open decisions

- Clock in costs up to 10 Immich searches per page (one per seed); unmeasured against real Immich.
- Shuffle efficiency once most of the library is reviewed: each call fetches 200 random assets, up to 3 times.
- Compare: whether a duplicate group stays listed in Immich after its extras are trashed via deleteAssets.

## Known issues

- Shift: 6 s per photo is a guess from one session. The last entry of a shift cannot be undone once the summary shows. Header on `/clockin` still shows a running `reviewed` count.
- `/photoshoot` has its own copy of the burst screen logic; it only shares `ShootViewer` and `ShootControls` with `Shoot`.

- Burst undo (photoshoot and clock in) takes back only the last settled burst. Favorites and album changes are immediate in Immich, so undo and unpicking do not revert them.
- Clock in: shots decided before a mid-burst failure cannot be undone.
- Login error text uses `--cut`, breaking the Two Signals rule (red only for trash).
- `.timecode` and `.label` styles are duplicated per component.
- `/swipe` (305 lines) and `/photoshoot` (266) are over the 200 line rule and duplicate album, favorite and share state. Move them onto `AssetTools`, `CardStage` and `Shoot`.
- Preload of the next 3 previews: confirm the browser reuses them (cache headers).
- `npm audit`: 3 low, cookie <0.7.0 (GHSA-pxg6-pf52-xh8x) via Kit 2. Not reachable. Fixed only by Kit 3.
- Spike key (over-privileged, pasted in chat): confirm it is deleted.
- `decide.ts` still accepts `favorite` and `albumId` on a keep, but the UI no longer sends them. Remove once nothing needs them.
- Share holds the whole original in memory; iOS may expire the gesture on long videos.
- Not tested live: startup with server trash disabled.
- Task 16: prod node_modules (better-sqlite3, @node-rs/argon2), `ADDRESS_HEADER`/`XFF_DEPTH`, HSTS, no `Vary: Origin` on media.
- Migrations runner tracks only `user_version`: delete `data/` after editing an uncommitted migration.
- Not tested against real Immich: home page library total (`getTimelineStats`), `albumIds.any` filter, `searchRandom` filter, takenAt range semantics, `getAllAlbums` by `assetId`.
- Photoshoot and clock in try up to 10 random seeds per page, one Immich search each.
- Cursor allows 500 assets per timestamp. No Prettier config; format with tabs, single quotes, width 100, no trailing commas.
