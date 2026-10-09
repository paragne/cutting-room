# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

People who self-host Immich in a homelab and have a photo library too large to clean up by hand. Each install serves one person and one Immich server. They run cutting-room next to Immich, behind their own reverse proxy.

They use it in two kinds of sessions:

- Short: a few minutes on a phone, for example over lunch. Touch, often one-handed.
- Long: a sit-down session at a desktop with a keyboard.

Use at night, in a dark room, is common.

## Product Purpose

Clean up an Immich library one photo at a time. The app shows a photo, the user swipes right to keep it or left to send it to Immich trash, and the next photo appears. Progress is tracked so a library of tens of thousands of photos visibly shrinks.

The job it replaces: sitting in Immich's grid, judging photos by thumbnail, and multi-selecting the ones to delete. That is slow, inconsistent, and tedious. Success is that the user keeps coming back until the library is sorted, because the task has become easy and fun.

## Positioning

A single-screen, single-decision loop on top of an existing Immich server. It does not store, sync, or host photos. It only reads from Immich and moves assets to Immich trash, which Immich can restore. Every decision can be undone.

## Operating Context

- Self-hosted, open source (AGPL-3.0-only), deployed as a Docker image behind the user's existing reverse proxy.
- Holds one Immich API key server-side. The browser never sees the Immich URL or key, only proxied media.
- One app password per install. No accounts, no multi-user.
- Installable to a phone home screen (PWA, planned).

## Capabilities and Constraints

Built or in progress:

- Decide: keep or trash, one asset at a time. Trash only, never permanent delete. Refuses to run if Immich trash is disabled.
- Undo the last decision.
- Photos and videos (video playback in the card).
- Favorite an asset; add it to an album.
- Keyboard: arrows to decide, Ctrl+Z to undo, F to favorite, 0-9 for album hotkeys.
- Progress: percent of library sorted, space sent to trash, daily streak.

Modes:

- Shuffle all: random assets from the whole library. This is the default.
- Photoshoot shuffle: shows one random photoshoot (a burst of photos taken together) and the user picks the best one or more, trashing the rest.
- On this day, single album, screenshots, and Immich duplicate groups (compare side by side, pick keepers).

Open:

- How a "photoshoot" is detected (time gap, location, or Immich data) is undecided.
- Shuffle efficiency once most of the library is reviewed.

## Brand Commitments

- Name: cutting-room.
- Voice: playful throughout, including empty states, progress, streaks, and errors. Buttons and controls still say exactly what they do ("Keep", "Trash", "Undo"). Copy on trash and undo must never make the outcome unclear.
- No branding, names, illustrations, or copy borrowed from Picnic or any other app.

## Evidence on Hand

None yet. No screenshots, user quotes, or usage numbers exist. Do not invent install counts, testimonials, or library statistics.

## Product Principles

1. One photo, one decision. Never ask the user to judge more than the current card (except in modes built for comparison).
2. Nothing is final. Trash is restorable and undo is always one action away, so deciding fast is safe.
3. Progress must be visible. A long chore stays fun when the user can see it moving.
4. Equal on touch and keyboard. Every action works by swipe or tap and by key.
5. The user's server, the user's data. Nothing leaves their homelab, and nothing about Immich reaches the browser beyond media bytes.

## Accessibility & Inclusion

- Comfortable in the dark: no large bright surfaces around the photo.
- Respect prefers-reduced-motion: swipes and transitions must have a reduced or no-motion version.
- Full keyboard use: every action reachable without a pointer, with visible focus.
- WCAG 2.2 AA as the baseline.
