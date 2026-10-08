# Decisions

Append only. One line per decision, with the reason.

- 2026-10-07: Standalone web app, not an Immich plugin. Immich plugins are server-side workflow WASM modules with no UI hook.
- 2026-10-07: SvelteKit + adapter-node. Immich's own web client is SvelteKit; boring choice, not a learning entry.
- 2026-10-07: Immich API key held server-side, browser gets a session cookie. Avoids keys in the bundle or localStorage and avoids CORS changes on Immich.
- 2026-10-07: Single user, one API key from env, app password stored as an argon2id hash in env. Anyone who reaches the app can trash the library, so the app gates itself.
- 2026-10-07: Left swipe trashes immediately in Immich, no pending pile. Immich trash is the safety net; undo restores from trash.
- 2026-10-07: Never force-delete, and refuse to run if Immich trash is disabled. Protects against permanent loss.
- 2026-10-07: Review state in local SQLite (better-sqlite3), not tags in Immich. Keeps the library clean and the query local.
- 2026-10-07: License AGPL-3.0-only. @immich/sdk is AGPL-3.0, and this is a network-served app that bundles it.
- 2026-10-07: Swipe gestures hand-written with pointer events. Small code, no dependency.
- 2026-10-07: On this day uses date-range search per past year instead of Immich memories. Works even if memory generation is off.
- 2026-10-07: Project named cutting-room. Film term for where rejected footage goes; "sift" collided with an existing self-hosted app.
- 2026-10-07: Impeccable skill files are gitignored and installed per container. Third-party code, 18 MB binary, not ours to vendor.
