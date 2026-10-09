---
name: Cutting Room
description: Swipe through an Immich library in a late-night edit suite.
colors:
  suite-ground: "#1E1E1E"
  panel: "#262626"
  panel-raised: "#2E2E2E"
  hairline: "#3A3A3A"
  monitor-matte: "#0B0B0B"
  text: "#D6D6D6"
  text-dim: "#8C8C8C"
  timecode-amber: "#E5A93B"
  keep-green: "#6FAF7A"
  cut-red: "#D35A45"
  label-violet: "#8F6FD1"
  label-iris: "#6E83D8"
  label-cerulean: "#3E9BD6"
  label-caribbean: "#2FB5A0"
  label-moss: "#8A9A3E"
  label-mango: "#E28A3B"
  label-rose: "#D9668E"
  label-lavender: "#B48FD9"
  label-straw: "#D6C24A"
  label-tan: "#B08A64"
typography:
  title:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
    fontSize: "15px"
    fontWeight: 600
    lineHeight: 1.3
  body:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.45
  label:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
    fontSize: "11px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.06em"
  timecode:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
    fontSize: "15px"
    fontWeight: 500
    lineHeight: 1.2
    fontFeature: "'tnum' 1"
rounded:
  sm: "2px"
  md: "4px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  xxl: "32px"
---

<!-- SEED: established with the user before implementation; re-run /impeccable document once there's code to capture the actual tokens and components. -->

# Design System: Cutting Room

## Overview

**Creative North Star: the edit suite at 2am.** A dark editor's office, lit mostly by the monitor. It recalls mid-2010s non-linear editors (charcoal panels, amber timecode, colored clip labels), finished with modern restraint: flat panels, 1px hairlines, a real spacing scale.

The world lends four things: palette, type, density, and one signature move. It never supplies the controls. Buttons, sheets, and lists are standard web controls. The app must never become a costume of an editing program: no fake menu bars, tool palettes, transport bezels, or waveform decoration.

The photo is the only full-color element on screen. Everything around it is near-neutral charcoal so the monitor reads as the brightest thing in a dark room.

**Signature move: the session timeline.** A strip under the monitor records the session as clips. Keep appends a green clip. Trash is a razor cut: the photo drops off the bottom of the frame, onto the cutting room floor, and leaves a red cut mark. Undo steps the playhead back one clip. Full spec in the swipe screen's surface brief.

**Motion grammar:** short, directional, no bounce. Things slide and drop; nothing springs, glows, or scales up for attention. Under `prefers-reduced-motion: reduce`, every transition is an instant swap and the timeline block simply appears.

## Colors

Restrained strategy: tinted-neutral charcoal plus one accent (amber), with green and red reserved for the two decisions and ten label colors reserved for albums.

### Primary
- **Timecode Amber** (#E5A93B): counters, the playhead, focus rings, the active mode. The only accent. Never a large fill.

### Secondary
- **Keep Green** (#6FAF7A): Keep button text and icon, kept clips on the timeline, the drag hint when the photo moves right.
- **Cut Red** (#D35A45): Trash button text and icon, cut marks on the timeline, the drag hint when the photo moves left.

### Tertiary
- **Clip labels**: violet #8F6FD1, iris #6E83D8, cerulean #3E9BD6, caribbean #2FB5A0, moss #8A9A3E, mango #E28A3B, rose #D9668E, lavender #B48FD9, straw #D6C24A, tan #B08A64. One per album hotkey 0-9, in that order. Used as a small swatch or a left edge bar, never as a fill behind text.

### Neutral
- **Suite Ground** (#1E1E1E): page background.
- **Panel** (#262626): header, timeline, action area, sheets.
- **Panel Raised** (#2E2E2E): buttons at rest, hovered rows.
- **Hairline** (#3A3A3A): 1px dividers between panels.
- **Monitor Matte** (#0B0B0B): the area around the photo, so letterboxing reads as a monitor and not as empty UI.
- **Text** (#D6D6D6) and **Text Dim** (#8C8C8C): primary and secondary text. No pure white anywhere.

### Named Rules
**The Monitor Rule.** The photo is the brightest and only saturated surface. No UI color may sit over the photo except the drag hint and the cut animation.

**The Two Signals Rule.** Green means keep and red means trash, everywhere. Neither color is used for anything else, including success or error messages.

## Typography

**Body Font:** system UI stack. **Numbers:** the same stack with tabular figures, so counters do not jitter.

**Character:** a working tool's type. Small, dense, legible. Personality comes from copy and timecode-style numbers, not from a display face.

### Hierarchy
- **Title** (600, 15px, 1.3): mode name in the header, sheet titles.
- **Body** (400, 15px, 1.45): messages, empty states, settings.
- **Timecode** (500, 15px, tabular): counters such as `14,203 / 41,880`, space trashed, streak.
- **Label** (600, 11px, 0.06em, uppercase): panel headers and key hints (`←`, `→`, `F`).

### Named Rules
**The Timecode Rule.** Every number that changes while you work is set in tabular figures.

## Layout

Mobile first, single column, from top: header panel, monitor (takes all remaining height), timeline strip, action area. Actions live in the lower third so they are reachable one-handed. On desktop the column stays centered, the monitor grows, and key hints appear on the buttons. Spacing follows the 4px scale in the frontmatter. Panels are separated by 1px hairlines, not gaps.

## Elevation & Depth

Flat. No shadows. Depth comes from tonal steps: matte, ground, panel, panel raised. Sheets (album picker) are panels that slide up over a 60% black scrim.

## Shapes

Square-ish: 2px on small elements (clip blocks, swatches), 4px on buttons and sheets. The photo itself is never rounded. Touch targets are at least 48px tall.

## Do's and Don'ts

### Do:
- **Do** keep the photo the only full-color element.
- **Do** use amber only for counters, the playhead, focus, and the active mode.
- **Do** label buttons literally: Trash, Undo, Keep.
- **Do** show a visible amber focus ring (2px) on every interactive element.
- **Do** provide an instant, motion-free version of every transition.

### Don't:
- **Don't** imitate an editing program's chrome: no menu bars, tool palettes, transport controls, scopes, or waveforms as decoration.
- **Don't** use Adobe, Premiere, Avid, or any other product's names, logos, icons, or exact UI.
- **Don't** use glow, glass, gradients, neon, or bounce easing.
- **Don't** put cards inside cards or round the photo.
- **Don't** use large bright surfaces; this is used in the dark.
