# State

## Current task
13d, the first item below.

## Tasks (one per session, in order)
13d. Shared top bar for every screen: "Cutting Room" text in the middle (placeholder for the
     owner's icon) linking home; no home button, no `reviewed` counter. Photoshoot title is the
     earliest shot's time rounded to the minute ("September 20, 2022 at 3:31 PM"). Undo button
     becomes the MDI undo icon (inline SVG path, no package; check the path renders).
13e. Photoshoot grid rework: tap a photo opens fullscreen (no fullscreen button); hold ~300 ms
     enters select mode (all unchecked; confirming with none ticked trashes the whole photoshoot,
     labelled "Trash N") with a large "KEEP? ( )" checkbox top right of every photo; on hover
     only favorite (bottom right) and album (bottom left) show (hidden on touch); fullscreen keeps the five
     buttons top right and its keep button matches the grid checkbox. Fix: after closing
     fullscreen the five buttons stay on the photo.
13f. Home screen: top bar with a log out icon (MDI) top right; a big "Dailies" card (most of
     the width, tall, subtext says it is the main mode: all unreviewed photos, random, no
     filters); one stats bar with five stats incl. estimated time remaining (6 s per photo);
     "Custom" entry last. Stats: Sorted %, Trashed (count and space), Streak, Photos left, Time
     left (6 s per photo), Keep rate. Keep the old Shuffle
     all, Photoshoot and Album entries until 13h lands Custom; 13h removes them.
13g. Custom mode, server: filter model (`custom.ts`, parsed and validated like `parseMode`):
     file type, camera vs screenshot, years, date range, albums, location, other metadata Immich
     searches; singles / photoshoots / both; reviewed / unreviewed / both; shuffle on or off;
     session length. Pure parsing and queue ordering with tests. Needs a list of which filters
     Immich `searchAssets` supports before building.
13h. Custom mode, screen: the form and the session at `/custom`. Reuse `Shoot`, `CardStage`,
     `AssetTools`. Delete `/swipe` and `/photoshoot` (removes the over-200-line duplicates).
14. Compare: Immich duplicate groups side by side, pick keepers, trash rest
    with deleteAssets (never resolveDuplicates).
15. Screenshots: heuristic (no camera make, screen-ratio dimensions, PNG, filename) as a pure
    function with tests, then offered as a Custom filter, not its own mode.
16. Deploy: multi-stage Dockerfile, base image pinned by digest, non-root,
    read-only rootfs, /data volume, healthcheck, compose example. Dependabot.
17. PWA manifest and icons for home-screen install. No media caching. Owner supplies the logo.
18. README (written by me).

## Done

1-9. Scaffold, Immich spike (server v3.2.0, @immich/sdk 3.2.0, docs/IMMICH-API.md), config, Immich client, auth, DB, media proxy, queue and decisions API, design docs, swipe screen.
10, 10b, 10c. Video in card, double-tap and F favorite, GIFs from `original`, share button.
11. Add to album: `albums.ts`, `/api/albums`, `AlbumSheet`, `albumKeys.ts`, digit hotkeys.
12, 12b, 12c. Modes (`modes.ts`, `queueModes.ts`), photoshoot at `/photoshoot`, swipe actions (heart, album, details, share, skip, undo).
13. Home screen at `/`: `stats.ts`, `ModePicker`; swipe moved to `/swipe`.
13b(a). Dailies queue: `dailies.ts` (server), `mode=dailies`.
13b(b). Dailies screen at `/dailies`: `dailies.svelte.ts` (queue, undo, burst settle), `assetTools.svelte.ts`, `CardStage`, `Shoot`, `AssetSheets`; `ShootHeader` takes `title` and `home`. Reviewed in browser.
13b(c). Shifts: `shift.ts` (6 s per photo, `SHIFT_MINUTES` env, default 15), `ShiftSummary`, `/dailies` load, `totals.ts`. Shift ends by estimated work, nothing shown while it runs. 325 tests. Reviewed in browser.
13b(d-pre). Burst viewer: "Keep all", prev/next arrows and swipe, tap outside the photo closes (`ShootViewer`, `viewer.ts`).
13c. Plain copy, "Dailies" name, `/dailies` route, `mode=dailies`, `dailies*` files and class renamed.
13b(d), 13b(e). Dropped: the clock-in animation was never shipped. All animation removed; On this day removed.

## Open decisions

- Dailies costs up to 10 Immich searches per page (one per seed); unmeasured against real Immich.
- Shuffle efficiency once most of the library is reviewed: each call fetches 200 random assets, up to 3 times.
- Compare: whether a duplicate group stays listed in Immich after its extras are trashed via deleteAssets.

## Known issues

- Shift: 6 s per photo is a guess from one session. The last entry of a shift cannot be undone once the summary shows.
- `/photoshoot` has its own copy of the burst screen logic; it only shares `ShootViewer` and `ShootControls` with `Shoot`.

- Burst undo (photoshoot and Dailies) takes back only the last settled burst. Favorites and album changes are immediate in Immich, so undo and unpicking do not revert them.
- Dailies: shots decided before a mid-burst failure cannot be undone.
- Login error text uses `--cut`, breaking the Two Signals rule (red only for trash).
- Open: whether photoshoot detection (60 s gaps) makes sense on a filtered Custom set.
- `.timecode` and `.label` styles are duplicated per component.
- `/swipe` (305 lines) and `/photoshoot` (266) are over the 200 line rule and duplicate album, favorite and share state. Both are deleted in 13h.
- Preload of the next 3 previews: confirm the browser reuses them (cache headers).
- `npm audit`: 3 low, cookie <0.7.0 (GHSA-pxg6-pf52-xh8x) via Kit 2. Not reachable. Fixed only by Kit 3.
- Spike key (over-privileged, pasted in chat): confirm it is deleted.
- `decide.ts` still accepts `favorite` and `albumId` on a keep, but the UI no longer sends them. Remove once nothing needs them.
- Share holds the whole original in memory; iOS may expire the gesture on long videos.
- Not tested live: startup with server trash disabled.
- Task 16: prod node_modules (better-sqlite3, @node-rs/argon2), `ADDRESS_HEADER`/`XFF_DEPTH`, HSTS, no `Vary: Origin` on media.
- Migrations runner tracks only `user_version`: delete `data/` after editing an uncommitted migration.
- Not tested against real Immich: home page library total (`getTimelineStats`), `albumIds.any` filter, `searchRandom` filter, takenAt range semantics, `getAllAlbums` by `assetId`.
- Photoshoot and Dailies try up to 10 random seeds per page, one Immich search each.
- Cursor allows 500 assets per timestamp. No Prettier config; format with tabs, single quotes, width 100, no trailing commas.
