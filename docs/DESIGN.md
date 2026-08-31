# HurufPad — design system

Source of truth for visual and interaction style. Product scope stays in `PRODUCT_BRIEF.md`.

## Audience

- **Children ~3–6:** large targets, instant feedback, calm chrome, canvas first.
- **Teachers / caregivers:** readable labels at arm’s length, no mystery-only icons.

Design for the dual audience as one language: kids get the board and fat tools; teachers get language and settings in the same strip, same tokens.

## Direction

**Classroom marker pad** — quiet paper, clear ink, one calm accent. The board is the product; UI chrome stays thin and secondary.

Palette source: Color Hunt “kids” palette [`696fc7 a7aae1 f5d3c4 f2aebb`](https://colorhunt.co/palette/696fc7a7aae1f5d3c4f2aebb) — peach chrome, periwinkle accent, warm near-white board.

Not a toy store, not a dashboard, not purple-glow “AI kids app.”

## Rules

1. **Canvas first** — board fills most of the viewport; chrome is a slim strip.
2. **Touch-first** — interactive targets ≥ `--tap-min` (48px); prefer 56px on tablet-primary controls.
3. **Clear, not cute** — high contrast and simple shapes. Controls kids use directly are glyph icons, since preschoolers cannot read; every icon-only control carries an `aria-label`. No tooltips and no emoji in icons. Teacher-facing controls (language) keep text labels.
4. **One accent job** — accent color means active / confirm / speak, not decoration.
5. **Fixed letter palette** — letter fills come from the approved set only (max 8).
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

### Letter fills (board only)

Use only these for letter objects (see `letterFills` in `src/theme/tokens.ts`):

- Indigo, raspberry, orange, teal, green, purple, blue, cocoa

Each fill is dark enough to stay readable on `--paper`; the palette’s pastels stay in chrome.

Chrome must not rainbow; letters may.

### Board fonts

Default and style picker options: Lexend, Fredoka, Nunito. Prefer high x-height and clear shapes for early readers.

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
| I’m done | `wand.and.sparkles` | `wand_stars` |
| Caps lock off / on | `capslock` / `capslock.fill` | `keyboard_capslock` with `FILL` 0 / 1 |

Icon buttons are square at `--tap-min`, borderless inside an island, active state = `--accent-tint` fill with `--accent` glyph.

### Toolbar and islands

Chrome is split between a slim header and floating islands over the board, so the canvas stays the product.

- **Header** (`--toolbar-height`, `--toolbar` surface, bottom border `--border`): wordmark plus the language group only. The wordmark hides below 720px.
- **Tool island** — top center of the board: Hand, Pencil, Eraser, Lasso, Add Sticker in one group. Pencil is selected by default. Speak joins this group after a vertical divider, only while letters are selected. Eraser stays selected until another tool is chosen; tapping a sticker deletes that letter.
- **Zoom island** — bottom left: current zoom percentage and Reset zoom, which is disabled at 100% with no pan.
- **Action island** — bottom right, contextual: “I’m done” only while ink waits to be recognized.
- Islands use `--control-surface`, `--radius-island`, a hairline border, and one soft shadow. This is the one place card chrome is allowed, since islands wrap interaction.

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

### Letter picker and Add Sticker grid

- Large glyph tiles (≥ 56×56), high contrast on `--paper`
- The recognition picker uses a short list of candidates; the Add Sticker panel uses the full A–Z/a–z grid
- Add Sticker starts with Caps lock on (A–Z), matching typical preschool classroom glyphs
- Grid tiles run in reading order, left to right: A–M on the top row, N–Z on the second
- Taps continue the current row and wrap to a new line at the edge of the visible board, so letters never land off screen
- Caps lock is an icon button with `aria-pressed`; the glyph is outlined when off and filled when on, and changing it never changes existing stickers
- The Add Sticker grid sits in a slim, horizontally scrollable board-adjacent panel and does not cover the canvas
- Both interactions share the same glyph-tile and button tokens
- Optional card surface here is OK (interaction container)

### Selection on canvas

- One selection language everywhere: same handle size, same outline color (`--accent`)
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
