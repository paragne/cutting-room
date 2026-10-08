# Immich API map

Pinned: Immich server v3.2.0, `@immich/sdk` 3.2.0 (exact). The SDK version must
match the server version. Bump both together.

Verified 2026-10-08 against the live server (v3.2.0, trash enabled, 30 days) and
the server source at tag v3.2.0. "Live" means the call was made against the real
server. "Source" means read from the controller and service code only.

## Setup

```ts
import { init } from '@immich/sdk';
init({ baseUrl: `${IMMICH_URL}/api`, apiKey: IMMICH_API_KEY });
```

The SDK sends the key as the `x-api-key` header.

## Actions

| Action | SDK function | HTTP | Permission | Checked |
| --- | --- | --- | --- | --- |
| Server version | `getServerVersion` | GET /server/version | none (public) | Live |
| Trash enabled | `getServerFeatures` (`.trash`) | GET /server/features | none (public) | Live |
| Trash retention | `getServerConfig` (`.trashDays`) | GET /server/config | none (public) | Live |
| List, timeline order | `searchAssets` | POST /search/metadata | asset.read | Live |
| Date range (on this day) | `searchAssets` with `filter.takenAt` | POST /search/metadata | asset.read | Live |
| Single album | `searchAssets` with `filter.albumIds.any` | POST /search/metadata | asset.read | Source |
| Random (shuffle) | `searchRandom` | POST /search/random | asset.read | Live |
| Asset metadata | `getAssetInfo` | GET /assets/{id} | asset.read | Live |
| Library counts | `getAssetStatistics` | GET /assets/statistics | asset.statistics | Source |
| Trash | `deleteAssets` with `force: false` | DELETE /assets | asset.delete | Live |
| Restore (undo) | `restoreAssets` | POST /trash/restore/assets | asset.delete | Live |
| Favorite | `updateAsset` with `isFavorite` | PUT /assets/{id} | asset.update | Live |
| List albums | `getAllAlbums` | GET /albums | album.read | Source (403 with test key) |
| Add to album | `addAssetsToAlbum` | PUT /albums/{id}/assets | albumAsset.create | Source |
| Duplicate groups | `getAssetDuplicates` | GET /duplicates | duplicate.read | Source (403 with test key) |
| Thumbnail | `viewAsset` with `size: thumbnail` | GET /assets/{id}/thumbnail | asset.view | Live |
| Preview | `viewAsset` with `size: preview` | GET /assets/{id}/thumbnail | asset.view | Live |
| Video playback | `playAssetVideo` | GET /assets/{id}/video/playback | asset.view | Live |

Restore needs `asset.delete`, not `asset.update`.

## API key permissions for the app

`asset.read`, `asset.update`, `asset.delete`, `asset.view`, `asset.statistics`,
`album.read`, `albumAsset.create`, `duplicate.read`. Nothing else.

Do not grant `asset.download`. Do not grant `library.*` or `duplicate.delete`.

## Search (v3.2 structured shape)

v3.2.0 deprecates the flat search fields (`takenAfter`, `isFavorite`,
`albumIds`, `withDeleted` and others). It adds `filter`, `orderBy` and `cursor`.
A request that mixes the two shapes fails validation. Use only the new shape.

- The new shape has no implicit filters. A trashed asset matched a plain
  `filter.id` search in the live test. Every queue query must include
  `trashedAt: { eq: null }` and `visibility: { eq: 'timeline' }`, or archived,
  hidden and trashed assets come back.
- `orderBy.field` is one of `fileCreatedAt`, `localDateTime`, `fileSizeInBytes`,
  `rating`. There is no `takenAt` order field. `filter.takenAt` compares
  `fileCreatedAt`, so order and range use the same column. The server adds `id`
  as a tie-break.
- `cursor` is base64 of `{"offset":N}`, so paging is by offset. Trashing assets
  between pages shifts the offset and skips assets. Keyset paging on
  `takenAt: { gte: <last seen> }`, with already-reviewed ids dropped locally,
  avoids this. Two assets in the test library share one timestamp, so `gt`
  alone would skip assets.
- `assets.total` is the number of items on the page, not the library total.
  Use `getAssetStatistics` for totals.
- `searchRandom` accepts the same `filter`. The same no-implicit-filter rule
  applies when `filter` is present.

Live request that returned the 3 oldest timeline assets:

```json
{ "size": 3,
  "orderBy": { "field": "fileCreatedAt", "direction": "asc" },
  "filter": { "visibility": { "eq": "timeline" }, "trashedAt": { "eq": null } } }
```

## Media

- `size=thumbnail` returned `image/webp`. `size=preview` returned `image/jpeg`.
- `size=fullsize` returned `302` to `original`, which needs `asset.download`.
  Use only `thumbnail` and `preview`. The proxy must not follow redirects.
- Video playback with `Range: bytes=0-1023` returned `206` with
  `Content-Range`, `Accept-Ranges: bytes`, `Content-Type: video/mp4`.
- Immich also sends `Cache-Control: private, max-age=86400, ...`. Our header
  allowlist drops it. The proxy sets its own.
- SDK `viewAsset` and `playAssetVideo` return a `Blob`, which buffers the whole
  file and cannot pass Range through. The media proxy should use `fetch`
  against the same paths with the key header, inside `immich.ts`.

## Delete and trash

`deleteAssets` (server `AssetService.deleteAll`) never checks the trash setting.
It sets `deletedAt` and status:

- `force: false` sets status `trashed`. The asset stays in Immich trash.
- `force: true` sets status `deleted` and queues the empty-trash job at once.
  Permanent. We never send it.

What happens when server trash is disabled (`trash.enabled = false`):

- `deleteAssets` with `force: false` still marks the asset `trashed`, and the
  API returns 204 as usual.
- The nightly `AssetDeleteCheck` job (runs at `nightlyTasks.startTime`,
  default 00:00, when `databaseCleanup` is on) uses a retention of 0 days when
  trash is disabled. Every trashed asset is deleted from disk on the next run.
- `getServerFeatures().trash` is `false` and `getServerConfig().trashDays` is
  still reported.
- `resolveDuplicates` force-deletes immediately when trash is disabled
  (`DuplicateService`, `isForce = !trash.enabled`).

So a non-force delete is only safe while trash is enabled. Trash can be turned
off in the admin UI after our startup check. Check `getServerFeatures().trash`
before every trash call as well as at startup (public endpoint, one small GET).
Do not use `resolveDuplicates`. Compare mode trashes with `deleteAssets`.

Live trash test on one asset: `deleteAssets({ ids, force: false })` returned 204,
`isTrashed` became true. `restoreAssets` returned `{"count":1}`, `isTrashed`
became false. Favorite flag unchanged throughout.

## Errors

Validation errors return 400 with
`{"message":"Validation failed","errors":[{ "path": [...], "message": ... }]}`.
A missing permission returns 403. The SDK throws on non-2xx. Narrow with
`isHttpError(e)`, which exposes `e.status` and `e.data` (`ApiExceptionResponse`).
