/** Visual tokens shared with canvas / JS. CSS mirrors live in `src/index.css`. */

export const toolbarHeight = 56
export const recognitionPauseMs = 3000
export const recognitionConfidenceThreshold = 0.8
export const minBoardScale = 0.5
export const maxBoardScale = 2.5
export const letterGap = 16
export const lineGap = 24
export const alignmentYTolerance = 12
export const fallbackGlyphWidthRatio = 0.72
export const boardInk = '#2e2b40'
export const boardAccent = '#5f64c0'

export const letterSizes = {
  S: 56,
  M: 80,
  L: 112,
  XL: 144,
} as const

export type LetterSize = keyof typeof letterSizes

/** Approved letter fills — board objects only. Keep in sync with `docs/DESIGN.md`. */
export const letterFills = [
  '#5f64c0', // indigo
  '#c2436a', // raspberry
  '#d9662b', // orange
  '#1c8577', // teal
  '#4a8f2f', // green
  '#8b4fbf', // purple
  '#2f6fb5', // blue
  '#6b4a3a', // cocoa
] as const

export type LetterFill = (typeof letterFills)[number]

export const boardFontFamilies = ['Lexend', 'Fredoka', 'Nunito'] as const

export type BoardFontFamily = (typeof boardFontFamilies)[number]

export const defaultLetterFill: LetterFill = letterFills[0]
export const defaultBoardFont: BoardFontFamily = 'Lexend'
