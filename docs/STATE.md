# State

## Current task
13e, the first item below. 13d is committed but not yet seen in the browser (see Known issues).

## Tasks (one per session, in order)
13e. Photoshoot grid rework: tap a photo opens fullscreen (no fullscreen button); hold ~300 ms
     enters select mode (all unchecked; confirming with none ticked trashes the whole photoshoot,
     labelled "Trash N") with a large "KEEP? ( )" checkbox top right of every photo; on hover
     only favorite (bottom right) and album (bottom left) show (hidden on touch); fullscreen keeps the five
     buttons top right and its keep button matches the grid checkbox. Fix: after closing
     fullscreen the five buttons stay on the photo.
13f. Home screen: log out icon (MDI) top right of the top bar; a big "Dailies" card (most of
     the width, tall, subtext says it is the main mode: all unreviewed photos, random, no
     filters); one stats bar with five stats incl. estimated time remaining (6 s per photo);
     "Custom" entry last. Stats: Sorted %, Trashed (count and space), Streak, Photos left, Time
     left (6 s per photo), Keep rate. Keep the old Shuffle all, Photoshoot and Album entries
     until 13h lands Custom; 13h removes them.
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
1-9. Scaffold, Immich spike, config, Immich client, auth, DB, media proxy, queue and decisions API, design docs, swipe screen.
10-10c. Video in card, double-tap and F favorite, GIFs from `original`, share button.
11. Add to album: `albums.ts`, `/api/albums`, `AlbumSheet`, `albumKeys.ts`, digit hotkeys.
12-12c. Modes, photoshoot at `/photoshoot`, swipe actions.
13. Home screen at `/`: `stats.ts`, `ModePicker`.
13b, 13c. Dailies queue, screen, shifts (6 s per photo, `SHIFT_MINUTES`), burst viewer, plain copy and rename. No animation anywhere.
13d. Shared top bar in `+layout.svelte` (`TopBar`, hidden on `/login`), `shootTitle` in `format.ts`, MDI undo icon in `UndoButton`. Header counters and home links removed. 310 tests.

## Open decisions
- Dailies costs up to 10 Immich searches per page (one per seed); unmeasured against real Immich.
- Shuffle efficiency once most of the library is reviewed: each call fetches 200 random assets, up to 3 times.
- Compare: whether a duplicate group stays listed in Immich after its extras are trashed via deleteAssets.
- Whether photoshoot detection (60 s gaps) makes sense on a filtered Custom set.
- Dailies bursts keep the title "Dailies" with a range; photoshoot uses the time title. Confirm.

## Known issues
- 13d not yet viewed in the browser: check `/`, `/dailies`, `/photoshoot`, `/swipe` for clipping under the new 48px bar, and the undo icon.
- Home has a "Log out" text button until 13f.
- Shift: 6 s per photo is a guess. The last entry of a shift cannot be undone once the summary shows.
- Burst undo takes back only the last settled burst. Favorites and album changes are immediate in Immich and are not reverted. Dailies: shots decided before a mid-burst failure cannot be undone.
- `/swipe` (about 280 lines) and `/photoshoot` (about 260) exceed 200 lines and duplicate album, favorite and share state. Both are deleted in 13h.
- Login error text uses `--cut`, breaking the Two Signals rule (red only for trash).
- `.timecode` and `.label` styles are duplicated per component.
- `decide.ts` still accepts `favorite` and `albumId` on a keep; the UI no longer sends them.
- Preload of the next 3 previews: confirm the browser reuses them (cache headers).
- `npm audit`: 3 low, cookie <0.7.0 (GHSA-pxg6-pf52-xh8x) via Kit 2. Not reachable. Fixed only by Kit 3.
- Spike key (over-privileged, pasted in chat): confirm it is deleted.
- Share holds the whole original in memory; iOS may expire the gesture on long videos.
- Not tested live: startup with server trash disabled.
- Task 16: prod node_modules (better-sqlite3, @node-rs/argon2), `ADDRESS_HEADER`/`XFF_DEPTH`, HSTS, no `Vary: Origin` on media.
- Migrations runner tracks only `user_version`: delete `data/` after editing an uncommitted migration.
- Not tested against real Immich: home library total (`getTimelineStats`), `albumIds.any` filter, `searchRandom` filter, takenAt range semantics, `getAllAlbums` by `assetId`.
- Cursor allows 500 assets per timestamp. No Prettier config; format with tabs, single quotes, width 100, no trailing commas.
