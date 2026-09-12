/** Visual tokens shared with canvas / JS. CSS mirrors live in `src/index.css`. */

export const toolbarHeight = 56
export const inkSettleMs = 800
export const minBoardScale = 0.5
export const maxBoardScale = 2.5
export const letterGap = 16
export const lineGap = 24
export const alignmentYTolerance = 12
export const fallbackGlyphWidthRatio = 0.72
export const boardInk = '#2e2b40'
export const boardAccent = '#0055DA'

export const strokeWeights = {
  S: 4,
  M: 8,
  L: 14,
  XL: 22,
} as const

export type StrokeWeight = keyof typeof strokeWeights

export const brushes = {
  pencil: {
    widthScale: 1,
    opacity: 1,
    lineCap: 'round',
    lineJoin: 'round',
    tension: 0.2,
  },
  crayon: {
    widthScale: 1.6,
    opacity: 0.85,
    lineCap: 'round',
    lineJoin: 'round',
    tension: 0.3,
  },
  chalk: {
    widthScale: 1.4,
    opacity: 0.55,
    lineCap: 'butt',
    lineJoin: 'round',
    tension: 0.1,
  },
  marker: {
    widthScale: 2.2,
    opacity: 0.9,
    lineCap: 'square',
    lineJoin: 'miter',
    tension: 0.4,
  },
} as const

export type BrushKind = keyof typeof brushes

export const phoneScale = 0.75

export const letterSizes = {
  S: 56,
  M: 80,
  L: 112,
  XL: 144,
} as const

export type LetterSize = keyof typeof letterSizes

/** Approved letter fills — board objects only. Keep in sync with `docs/DESIGN.md`. */
export const letterFills = [
  '#FF0052', // bubblegum
  '#FFD400', // sunshine
  '#00C68D', // mint
  '#0055DA', // crayon blue
  '#FF7A00', // tangerine
  '#8A2BFF', // grape
  '#00D9FF', // sky pop
  '#FF5CC8', // candy pink
] as const

export type LetterFill = (typeof letterFills)[number]

export const boardFontFamilies = ['Lexend', 'Fredoka', 'Nunito', 'Baloo 2'] as const

export type BoardFontFamily = (typeof boardFontFamilies)[number]

export const defaultLetterFill: LetterFill = letterFills[0]
export const defaultBoardFont: BoardFontFamily = 'Lexend'

export const defaultInkStyle = {
  fill: defaultLetterFill,
  brush: 'pencil',
  weight: 'M',
} satisfies {
  fill: LetterFill
  brush: BrushKind
  weight: StrokeWeight
}
