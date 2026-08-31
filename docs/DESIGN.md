# HurufPad — design system

Source of truth for visual and interaction style. Product scope stays in `PRODUCT_BRIEF.md`.

## Audience

- **Children ~3–6:** large targets, instant feedback, calm chrome, canvas first.
- **Teachers / caregivers:** readable labels at arm’s length, no mystery-only icons.

Design for the dual audience as one language: kids get the board and fat tools; teachers get language and settings in the same strip, same tokens.

## Direction

**Classroom marker pad** — quiet paper, clear ink, one calm accent. The board is the product; UI chrome stays thin and secondary.

Not a toy store, not a dashboard, not purple-glow “AI kids app.”

## Rules

1. **Canvas first** — board fills most of the viewport; chrome is a slim strip.
2. **Touch-first** — interactive targets ≥ `--tap-min` (48px); prefer 56px on tablet-primary controls.
3. **Clear, not cute** — high contrast, simple shapes, few icons; labels over pictograms when space allows.
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
| `--toolbar` | Header / tool strip surface |
| `--border` | Hairlines and control outlines |
| `--accent` | Active, confirm, speak |
| `--accent-ink` | Text on accent |
| `--danger` | Destructive / clear (rare) |
| `--tap-min` | Minimum hit target |
| `--toolbar-height` | Main chrome height (keep JS in sync) |
| `--radius-sm` / `--radius-control` | Corners (8 / 12) |
| `--font-brand` / `--font-ui` | Fredoka (title) / Lexend (UI) |
| `--space-*` | 4 / 8 / 12 / 16 / 24 |

### Letter fills (board only)

Use only these for letter objects (see `letterFills` in `src/theme/tokens.ts`):

- Teal, amber, blue, rose, green, indigo, coral, slate

Chrome must not rainbow; letters may.

### Board fonts

Default and style picker options: Lexend, Fredoka, Nunito. Prefer high x-height and clear shapes for early readers.

## Components

### Toolbar

- Height: `--toolbar-height`
- Background: `--toolbar`; bottom border `--border`
- Brand title uses `--font-brand`; actions use `--font-ui`
- One row; overflow tools go behind a single overflow control later — do not stack dense icon rows

### Buttons

| Class | Use |
|-------|-----|
| `.btn` | Secondary / default control |
| `.btn[aria-pressed='true']` or `.btn-accent` | Active toggle / primary |
| `.btn-danger` | Destructive (clear board, etc.) |

All buttons: min-height `--tap-min`, padding from space scale, radius `--radius-control`. No pill (`999px`) unless a future control truly needs a chip.

### Language toggle

Two `.btn` siblings in a `role="group"`; pressed state uses accent fill + `--accent-ink`.

### Letter picker (when added)

- Large glyph tiles (≥ 56×56), high contrast on `--paper`
- Short list of candidates only; same button tokens
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
