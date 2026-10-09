---
version: 1
slug: "src-routes-page-svelte"
primary_target: "src/routes/+page.svelte"
related_targets: []
---

# Swipe screen

Scope: the main decide screen (task 9), reused by every mode. Visitor mode: Operate.

Task: judge one asset, keep or trash, undo freely. Used in short phone sessions and long desktop sessions, often in the dark. Constraints: pointer drag with fling threshold, Trash/Undo/Keep buttons, arrow keys and Ctrl+Z, next 3 preloaded.

## Direction contract

THESIS: The edit suite at 2am. Each photo is a clip under review; the session is a timeline you are cutting. Refuses the category default: rounded card stack with a red X and green check.

OWN-WORLD: Charcoal NLE panels (#1E1E1E ground, #262626 panels, #3A3A3A hairlines), near-black monitor matte around the photo, amber timecode (#E5A93B) as the only accent, muted keep green and cut red, ten clip-label colors for albums. System sans, tabular numerals, 11px uppercase panel labels. Flat, 2-4px radii, no glow or gradients.

STORY: The user sees one photo, decides, and watches the session timeline grow. They trust that every cut is reversible because Undo visibly steps the playhead back.

FIRST VIEWPORT: Header panel: mode name left, timecode counter right (reviewed / total). Monitor: photo fit inside a #0B0B0B matte, filling all remaining height; title-safe corner ticks appear only while dragging. Timeline strip (about 28px): one block per decision this session, green for keep, red cut mark for trash, amber playhead at the end. Action area in the lower third: Trash (left, red), Undo (center, neutral), Keep (right, green), each at least 48px tall; key hints on desktop.

FORM: User-pinned direction (film editor's office, nostalgic NLE, modern finish), replacing the roll. Seed key 6ef07182. Signature interaction: keep slides the photo right and appends a clip block; trash draws a 1px razor line then drops the photo off the bottom of the frame and leaves a cut mark; undo moves the playhead back and returns the photo. Reduced motion: instant swaps.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Open

- Exact drag threshold and fling velocity: tune while building.
- Copy lines for empty queue and end of session: write during task 9, playful.
