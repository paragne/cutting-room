# State

## Current task
13h-a, the first item below.

## Tasks (one per session, in order)
13h-a. Custom mode, form at `/custom`: enable the Custom entry in `ModePicker`, pure `customQuery`
     (form values to URL params, defaults left out) with tests, prefill from the query.
13h-b. Custom mode, session: reuse `Shoot`, `CardStage`, `AssetTools`. `group=shoots` pages hold one
     photoshoot (render with `Shoot`); `singles` and `both` are flat lists. Client-side `minutes` limit.
     Delete `/swipe` (over 200 lines, duplicates album, favorite and share state) and `/photoshoot`.
14. Compare: Immich duplicate groups side by side, pick keepers, trash rest
    with deleteAssets (never resolveDuplicates).
15. Screenshots: heuristic (no camera make, screen-ratio dimensions, PNG, filename) as a pure
    function with tests, then offered as a Custom filter, not its own mode.
16. Deploy: multi-stage Dockerfile, base image pinned by digest, non-root,
    read-only rootfs, /data volume, healthcheck, compose example. Dependabot.
17. PWA manifest and icons for home-screen install. No media caching. Owner supplies the logo.
18. README (written by me).

## Done
1-9. Scaffold, Immich spike, config, Immich client, auth, DB, media proxy, queue and decisions API, design docs, swipe screen.
10-10c. Video in card, double-tap and F favorite, GIFs from `original`, share button.
11. Add to album: `albums.ts`, `/api/albums`, `AlbumSheet`, `albumKeys.ts`, digit hotkeys.
12-12c. Modes, photoshoot at `/photoshoot`, swipe actions.
13. Home screen at `/`: `stats.ts`, `ModePicker`.
13b, 13c. Dailies queue, screen, shifts (6 s per photo, `SHIFT_MINUTES`), burst viewer, plain copy and rename. No animation anywhere.
13d. Shared top bar in `+layout.svelte` (`TopBar`, hidden on `/login`), `shootTitle` in `format.ts`, MDI undo icon in `UndoButton`. Header counters and home links removed.
13e. Photoshoot grid in `Shoot`: tap opens fullscreen, 300 ms hold enters select mode (`select.ts`, `KeepBox`), "Trash N" with nothing ticked, hover shows favorite and album only, stuck-buttons fix.
13f. Home screen: logout icon in `TopBar`, tall Dailies card, `StatsBar` (Sorted, Trashed, Streak, Photos left, Time left, Keep rate), disabled Custom entry.
13e-fix. `/photoshoot` moved onto `Shoot` (hold to select now works there and in Dailies bursts), larger fullscreen keep bar (`KeepBox large`), `ShootControls` deleted. 324 tests.
13g. Custom filter model: `custom.ts` (`parseCustom`, `customFilter`), filter list in IMMICH-API.md. Years are a span via `from`/`to`. 370 tests.
13g-b1. `mode=custom` in `parseMode` and `/api/queue`: filtered scan oldest first or shuffled, reviewed filter via `wanted` in `queue.ts`. 382 tests.
13g-b2. Custom `group`: `queueGroups.ts` (`groupPage`), `timeline()` generator in `queue.ts`, `shootAround` and `photoshoot` take filter and reviewed. 391 tests.

## Open decisions
- Dailies costs up to 10 Immich searches per page (one per seed); unmeasured against real Immich.
- Custom `singles` shuffled costs up to 20 window searches per page; unmeasured. Shuffle efficiency once most of the library is reviewed: each call fetches 200 random assets, up to 3 times.
- Compare: whether a duplicate group stays listed in Immich after its extras are trashed via deleteAssets.
- Custom session length (`minutes`) is enforced by the client in 13h; the server ignores it.

## Known issues
- `/swipe` (about 280 lines) exceeds 200 lines and duplicates album, favorite and share state. Deleted in 13h.
- Hover and focus buttons on photoshoot tiles: Escape-close of fullscreen may still leave them visible (unconfirmed).
- Off the DESIGN.md type ramp: 24px Dailies title, 16px large keep label.
- Shift: 6 s per photo is a guess. The last entry of a shift cannot be undone once the summary shows.
- Burst undo takes back only the last settled burst. Favorites and album changes are immediate in Immich and are not reverted. Dailies: shots decided before a mid-burst failure cannot be undone.
- Custom groups: a singles page can hold 21 or 22 items. A shoot over 16 splits; a leftover of 1 or 2 is then treated as singles. Pages re-fetch the batch read past a run end.
- `npm audit`: 3 low, cookie <0.7.0 (GHSA-pxg6-pf52-xh8x) via Kit 2. Not reachable. Fixed only by Kit 3.
- Minor: login error uses `--cut` (breaks Two Signals); `.timecode` and `.label` styles duplicated; preview preload cache headers unchecked; share holds whole original in memory; startup with trash disabled untested.
- Spike key (over-privileged, pasted in chat): confirm it is deleted.
- Task 16: prod node_modules (better-sqlite3, @node-rs/argon2), `ADDRESS_HEADER`/`XFF_DEPTH`, HSTS, no `Vary: Origin` on media.
- Not tested against real Immich: home library total (`getTimelineStats`), `albumIds.any` filter, `searchRandom` filter, takenAt range semantics, `getAllAlbums` by `assetId`, Custom filters `make: { ne: null }`, `hasAlbums`, `originalFileName.endsWith` case, Custom photoshoot detection on a filtered set.
- Style: tabs, single quotes, width 100, no trailing commas (no Prettier config). Migrations runner tracks only `user_version`: delete `data/` after editing an uncommitted migration. Cursor allows 500 assets per timestamp.
