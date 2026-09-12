# Hurufku — design system

Source of truth for visual and interaction style. Product scope stays in `PRODUCT_BRIEF.md`.

## Audience

- **Children ~3–6:** large targets, instant feedback, calm chrome, canvas first.
- **Teachers / caregivers:** readable labels at arm’s length, no mystery-only icons.

Design for the dual audience as one language: kids get the board and fat tools; teachers get language and settings in the same strip, same tokens.

## Direction

**Classroom marker pad** — quiet paper, clear ink, one calm accent. The board is the product; UI chrome stays thin and secondary.

Palette direction: soft classroom chrome, warm near-white board, and bright rainbow fills for letter and scribble stickers.

Not a toy store, not a dashboard, not purple-glow “AI kids app.”

## Rules

1. **Canvas first** — board fills most of the viewport; chrome is a slim strip.
2. **Touch-first** — interactive targets ≥ `--tap-min` (48px); prefer 56px on tablet-primary controls.
3. **Clear, not cute** — high contrast and simple shapes. Controls kids use directly are glyph icons, since preschoolers cannot read; every icon-only control carries an `aria-label`. No tooltips and no emoji in icons. Teacher-facing controls (language) keep text labels.
4. **One accent job** — accent color means active / confirm / speak, not decoration.
5. **Fixed board palette** — letter and scribble fills come from the approved set only (max 8).
6. **Reuse the kit** — new UI must use an existing component pattern or extend this doc first.
7. **Short motion** — 150–200ms; feedback, not ornament.
8. **No card chrome** — avoid bordered/shadowed cards unless they wrap a necessary interaction (e.g. letter picker).

## Tokens

Implemented in `src/index.css` (`:root`) and `src/theme/tokens.ts` (canvas / JS).

| Token | Role |
|-------|------|
| `--paper` | App and board background |
| `--ink` | Primary text and icons |
| `--muted` | Secondary labels |
| `--toolbar` | Header / tool strip surface (peach) |
| `--panel` | Inspector and letter-grid strips |
| `--control-surface` | Button and picker fill |
| `--border` | Hairlines and control outlines (periwinkle) |
| `--accent` | Active, confirm, speak |
| `--accent-ink` | Text on accent |
| `--accent-soft` | Pink highlight for interaction containers |
| `--danger` | Destructive / clear (rare) |
| `--tap-min` | Minimum hit target |
| `--toolbar-height` | Main chrome height (keep JS in sync) |
| `--accent-tint` | Active / hover fill on icon buttons |
| `--radius-sm` / `--radius-control` / `--radius-island` | Corners (8 / 12 / 16) |
| `--font-brand` / `--font-ui` | Fredoka (title) / Lexend (UI) |
| `--space-*` | 4 / 8 / 12 / 16 / 24 |

### Board fills

Use only these for letter and scribble objects (see `letterFills` in `src/theme/tokens.ts`):

- Bubblegum `#FF0052`
- Sunshine `#FFD400`
- Mint `#00C68D`
- Crayon blue `#0055DA`
- Tangerine `#FF7A00`
- Grape `#8A2BFF`
- Sky pop `#00D9FF`
- Candy pink `#FF5CC8`

The palette is intentionally bright: rainbow, kids, happy. Yellow is used as a playful object fill, not small body text.

Chrome must not rainbow; letters may.

### Board fonts

Default and style picker options: Lexend, Fredoka, Nunito, Baloo. The Baloo button uses the `Baloo 2` font family. Prefer high x-height and clear shapes for early readers.

## Components

### Icons

Kid-facing controls use a glyph icon font, never emoji or bitmaps. SF Symbols is the design reference but cannot be licensed for the web, so we ship the matching **Material Symbols Rounded** ligature, subset to the icons in use:

| Control | SF Symbol (reference) | Material Symbols (shipped) |
|---------|----------------------|-----------------------------|
| Hand | `hand.raised` | `back_hand` |
| Pencil | `pencil.tip` | `stylus` |
| Eraser | `eraser` | `ink_eraser` |
| Lasso | `lasso` | `lasso_select` |
| Add Sticker | `textformat` | `text_fields` |
| Reset zoom | `arrow.up.left.and.down.right.magnifyingglass` | `zoom_out_map` |
| Speak | `person.wave.2` | `record_voice_over` |
| Make sticker | `wand.and.sparkles` | `wand_stars` |
| Color inspector | `paintpalette` / `paintbrush.pointed` | `format_color_fill` |
| Stroke inspector | `slider.horizontal.3` | `tune` |
| Text inspector | `textformat.size` | `format_size` |
| Delete selected | `trash` | `delete` |
| Caps lock on / off | `textformat.size.larger` / `textformat.size.smaller` | `uppercase` / `lowercase` |

Icon buttons are square at `--tap-min`, borderless inside an island, active state = `--accent-tint` fill with `--accent` glyph.

### Tablet/Desktop toolbar and islands

Chrome is split into floating islands over the board, so the canvas stays the product. There is no full-width salmon header on tablet/desktop.

- **Brand island** — top left of the board: compact Hurufku identity mark.
- **Tool island** — top center of the board: Hand, Pencil, Eraser, Lasso, Add Sticker in one group. Pencil is selected by default. Speak joins this group after a vertical divider while something is selected; it is disabled if the selection includes a scribble. Eraser stays selected until another tool is chosen; tapping a selected sticker deletes the selected set, while tapping an unselected sticker deletes only that sticker.
- **Language island** — top right of the board: Indonesian / English selector, using the existing language buttons.
- **Letter island** — bottom center while Add Sticker is active: a keyboard-shaped A–Z keypad with caps lock.
- **Property panel** — left side, below the brand island, in a portrait card style. Pencil shows stroke color, stroke type (pencil, crayon, chalk, marker), and weight. Hand with one selected letter shows size, color, font. Hand with one selected scribble shows color, stroke type, and stroke weight. Scribble edits also become the defaults for the next scribble.
- **Zoom island** — bottom left: current zoom percentage and Reset zoom, which is disabled at 100% with no pan.
- **Action island** — bottom right, contextual: “Make sticker” only while ink waits to become a scribble sticker.
- Islands use `--control-surface`, `--radius-island`, a hairline border, and one soft shadow. This is the one place card chrome is allowed, since islands wrap interaction.

### Phone / compact toolbar and inspectors

Compact mode starts at `max-width: 640px` or `max-height: 500px`.

- **Top controls** — brand is icon-only at top left; zoom sits beside it; language is flag-only at top right.
- **Bottom dock** — main tools move to the bottom. A secondary row sits directly above the main toolbar.
- **Secondary row** — Color, Stroke, Text, Speak, Make sticker, Delete selected. Labels may be hidden in compact mode; icons keep `aria-label` text.
- **Inspector popover** — tapping Color, Stroke, or Text opens a portrait popover above the dock. The paint bucket button opens the color inspector. Popovers close via Escape or tapping outside.
- **Add Sticker grid** — shrinks fluidly into a 10-column layout so all letters and caps lock remain visible without horizontal scrolling.
- **Placement inset** — new stickers account for the bottom dock, so wrapped rows do not land beneath compact chrome.

### Buttons

| Class | Use |
|-------|-----|
| `.btn` | Secondary / default control |
| `.btn[aria-pressed='true']` or `.btn-accent` | Active toggle / primary |
| `.btn-danger` | Destructive (clear board, etc.) |

All buttons: min-height `--tap-min`, padding from space scale, radius `--radius-control`. No pill (`999px`) unless a future control truly needs a chip.

### Language toggle

Two `.btn` siblings in a `role="group"`; pressed state uses accent fill + `--accent-ink`.
Each option includes a flag and a readable label. **🇮🇩 Indonesia** comes first and is selected by default; **🇬🇧 English** is second.

### Add Sticker grid

- Large glyph tiles (≥ 56×56), high contrast on `--paper`
- The Add Sticker panel uses the full A–Z/a–z grid
- Add Sticker starts with Caps lock on (A–Z), matching typical preschool classroom glyphs
- Keys run in reading order, left to right and top to bottom
- Taps continue the current row and wrap to a new line at the edge of the visible board, so letters never land off screen
- Caps lock sits left of the middle row like a real keyboard and shows the case currently in use (`uppercase` / `lowercase`), never an arrow; changing it never changes existing stickers
- The Add Sticker keys sit in a floating island at the bottom of the board, shaped like a keyboard (rows of 10 / 9 / 7) but ordered A–Z, never QWERTY
- The grid uses the same glyph-tile and button tokens
- Optional card surface here is OK (interaction container)

### Board navigation

- Two-finger gestures pan and zoom the board in every tool; a second finger cancels whatever the first one started, so a pinch never leaves a stray scribble.
- One-finger drag on empty board pans in Hand, Eraser, and Add Sticker. Pencil and Lasso keep one-finger drag for drawing and selecting.
- Wheel zooms around the pointer in every tool.

### Selection on canvas

- One selection language everywhere: same handle size, same outline color (`--accent`)
- Lasso multi-selection persists when switching to Hand; dragging any selected object moves the whole selected group.
- Lasso multi-selection persists when switching to Eraser; tapping any selected object deletes the whole selected group.
- Resize/move handles ≥ touch minimum

### Speak / confirm

- Primary action uses accent; never rely on color alone — include a text label

## Motion

- Duration: `--duration` (180ms)
- Easing: `--ease` (standard ease-out)
- Use for pressed/active and picker appear/dismiss only

## Do / don’t

| Do | Don’t |
|----|--------|
| Quiet paper + strong ink | Low-contrast cream-on-cream |
| Fat, labeled controls | Tiny icon-only toolbars |
| One primary action visible | Nested menus and mode sprawl |
| Letter color from the fixed set | Arbitrary free-color chrome |
| Match tokens in every new view | One-off hex values in components |

## Checklist for new UI

- [ ] Uses only CSS / theme tokens (no raw hex except in the token files)
- [ ] Tap target ≥ 48px
- [ ] Works on phone and cheap tablet widths
- [ ] Matches an existing component or this doc was updated
- [ ] Does not steal focus from the board
