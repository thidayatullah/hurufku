/** Visual tokens shared with canvas / JS. CSS mirrors live in `src/index.css`. */

export const toolbarHeight = 56

/** Approved letter fills — board objects only. Keep in sync with `docs/DESIGN.md`. */
export const letterFills = [
  '#0f766e', // teal
  '#b45309', // amber
  '#1d4ed8', // blue
  '#be123c', // rose
  '#15803d', // green
  '#4338ca', // indigo
  '#ea580c', // coral
  '#334155', // slate
] as const

export type LetterFill = (typeof letterFills)[number]

export const boardFontFamilies = ['Lexend', 'Fredoka', 'Nunito'] as const

export type BoardFontFamily = (typeof boardFontFamilies)[number]

export const defaultLetterFill: LetterFill = letterFills[0]
export const defaultBoardFont: BoardFontFamily = 'Lexend'
