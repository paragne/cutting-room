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
    lineHeight: 1.45
    letterSpacing: "0.06em"
  timecode:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
    fontSize: "15px"
    fontWeight: 500
    lineHeight: 1.45
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
components:
  panel-bar:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.text}"
    height: "48px"
    padding: "0 12px"
  button-action:
    backgroundColor: "{colors.panel-raised}"
    textColor: "{colors.text}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    height: "56px"
  button-keep:
    backgroundColor: "{colors.panel-raised}"
    textColor: "{colors.keep-green}"
    rounded: "{rounded.md}"
    height: "56px"
  button-trash:
    backgroundColor: "{colors.panel-raised}"
    textColor: "{colors.cut-red}"
    rounded: "{rounded.md}"
    height: "56px"
  button-submit:
    backgroundColor: "{colors.panel-raised}"
    textColor: "{colors.timecode-amber}"
    rounded: "{rounded.md}"
    height: "48px"
  input-field:
    backgroundColor: "{colors.monitor-matte}"
    textColor: "{colors.text}"
    rounded: "{rounded.md}"
    height: "48px"
    padding: "0 12px"
  tag-overlay:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.text-dim}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "4px 8px"
  clip-keep:
    backgroundColor: "{colors.keep-green}"
    rounded: "{rounded.sm}"
    width: "8px"
  clip-trash:
    backgroundColor: "{colors.cut-red}"
    rounded: "{rounded.sm}"
    width: "8px"
---

# Design System: Cutting Room

## Overview

**Creative North Star: the edit suite at 2am.** A dark editor's office, lit mostly by the monitor. It recalls mid-2010s non-linear editors (charcoal panels, amber timecode, colored clip marks), finished with modern restraint: flat panels, 1px hairlines, a small spacing scale.

The world lends palette, type, density, and one signature move. It never supplies the controls. Buttons, fields, and disclosures are standard web controls. The app must not become a costume of an editing program: no fake menu bars, tool palettes, transport bezels, or waveform decoration.

The photo is the only full-color element on screen. Everything around it is near-neutral charcoal so the monitor reads as the brightest thing in a dark room.

**Signature move: the session timeline.** A strip under the monitor records the session as clips. Keep appends a green clip. Trash appends a red clip. The next photo replaces the current one at once. Undo removes the last clip and brings the photo back at once. The playhead is a 2px amber bar at the right end of the strip.

**Tone: strictly business.** A working tool with film-editing vocabulary and look, and no jokes or decoration. The same applies to the logo and icons: plain marks, no clapperboards or film-strip clip art.

**Motion: none.** The app has no animation or transition anywhere. Every change is an instant swap. The one movement is the photo following the finger while it is dragged, which is input tracking, not animation. This holds for every user, so there are no `prefers-reduced-motion` variants to maintain.

**Key Characteristics:**
- Flat charcoal panels separated by 1px hairlines.
- One accent (amber), two decision signals (green, red).
- Small uppercase labels, tabular numbers, system type.
- Controls sized for thumbs: 48px minimum, 56px for the three actions.

## Colors

Restrained: tinted-neutral charcoal plus one accent, with green and red reserved for the two decisions.

### Primary
- **Timecode Amber** (`colors.timecode-amber`): the reviewed counter, the timeline playhead, the focus ring (2px, 2px offset), and the submit button text on the login screen. The only accent. Never a large fill.

### Secondary
- **Keep Green** (`colors.keep-green`): Keep button text, kept clips, the drag hint when the photo moves right.
- **Cut Red** (`colors.cut-red`): Trash button text, trashed clips, the drag hint when the photo moves left.

### Neutral
- **Suite Ground** (`colors.suite-ground`): page background.
- **Panel** (`colors.panel`): header, details disclosure, timeline, action area, error bar, login form, overlay tags.
- **Panel Raised** (`colors.panel-raised`): buttons at rest.
- **Hairline** (`colors.hairline`): 1px dividers between panels and button and field borders.
- **Monitor Matte** (`colors.monitor-matte`): the area around the photo, and the password field.
- **Text** (`colors.text`) and **Text Dim** (`colors.text-dim`): primary and secondary text, key hints, labels, empty-state messages. No pure white anywhere.

### Named Rules
**The Monitor Rule.** The photo is the brightest and only saturated surface. Over the photo sit only the drag hint, the corner ticks, and the Video tag.

**The Two Signals Rule.** Green means keep and red means trash. Do not use either for anything else, including success or error messages.

## Typography

**Body Font:** system UI stack (`system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif`). Numbers use the same stack with tabular figures.

**Character:** a working tool's type. Small, dense, legible. Personality comes from the copy and the timecode numbers, not from a display face.

### Hierarchy
- **Title** (600, 15px, 1.3): mode name in the header.
- **Body** (400, 15px, 1.45): messages, details values, field text.
- **Timecode** (500, 15px, tabular, amber in the header): the reviewed counter and the photo date.
- **Label** (600, 11px, 0.06em, uppercase): field labels, details names, tags, key hints, the Reviewed caption.

### Named Rules
**The Timecode Rule.** Every number that changes while you work is set in tabular figures.

## Layout

Mobile first, single column, full dynamic viewport height, capped at 960px and centered. From top: header (48px minimum), photo date and Details disclosure, monitor (takes all remaining height), error bar when needed, timeline strip (28px), action area with three equal columns (Trash, Undo, Keep) so actions sit in the lower third. Key hints (`←`, `Ctrl Z`, `→`) show on the buttons only when the device has a fine pointer and hover.

The login screen is one panel, max 24rem wide, bottom-weighted: it sits 25dvh above the bottom edge so it is reachable one-handed.

Spacing steps are in the frontmatter. Padding is mostly 12px; gaps are 8px between buttons and 16px between header items. Panels are separated by 1px hairlines, not gaps.

## Elevation & Depth

Flat. No shadows. Depth comes from tonal steps: matte, ground, panel, panel raised. Overlay tags on the photo are small panel-colored blocks, not shadowed.

## Shapes

Square-ish: 2px on small elements (clips, overlay tags), 4px on buttons, fields, and the login panel. The photo is never rounded and is shown whole (`object-fit: contain`). Corner ticks (16px, 1px dim lines) frame the photo while it is dragged.

## Components

### Buttons
- **Shape:** 4px radius, 1px hairline border, Panel Raised fill.
- **Action buttons** (Trash, Undo, Keep): 56px tall, three equal columns, 600 weight, label over a dim key hint. Trash text is red, Keep text is green, Undo is Text color. Disabled is 0.45 opacity, set with `aria-disabled`.
- **Submit** (login): 48px tall, amber text, 600 weight.
- **Quiet buttons** (Log out, Retry): 48px tall. Log out has no fill or border and uses Text Dim; Retry uses the standard raised fill.
- **Focus:** 2px amber outline, 2px offset, on every interactive element.

### Inputs / Fields
- **Style:** Monitor Matte fill, 1px hairline, 4px radius, 48px tall, 12px side padding. A dim uppercase label sits above it.
- **Error:** a plain message line below the field (see drift note in the report).

### Disclosure (photo details)
A Panel bar with the date as timecode and a dim Details label. It opens to a two-column list: dim uppercase names, Text values. Empty values are omitted.

### Overlay tags
Small Panel blocks (4px 8px, 2px radius, label type) set 12px in from the photo edge: Video at bottom left, the Keep or Trash hint at the top corners. The hint's opacity follows drag distance.

### Timeline (signature)
28px strip on Panel. Clips are 8px wide, 2px radius, 2px apart, right-aligned, green or red. The most recent 120 show. A 2px amber playhead ends the strip.

## Do's and Don'ts

### Do:
- **Do** keep the photo the only full-color element.
- **Do** use amber only for counters, the playhead, focus, and the login submit.
- **Do** label buttons literally: Trash, Undo, Keep, Log in.
- **Do** show the 2px amber focus ring on every interactive element.
- **Do** make every change an instant swap.
- **Do** keep touch targets at 48px or taller.

### Don't:
- **Don't** imitate an editing program's chrome: no menu bars, tool palettes, transport controls, scopes, or waveforms as decoration.
- **Don't** use another product's names, logos, icons, or exact UI.
- **Don't** add any animation, transition, or fade, for any user.
- **Don't** use glow, glass, gradients, or neon.
- **Don't** put cards inside cards or round the photo.
- **Don't** use large bright surfaces; this is used in the dark.
