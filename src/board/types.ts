import type {
  BoardFontFamily,
  LetterFill,
  LetterSize,
} from '../theme/tokens'

export type Language = 'id' | 'en'
export type Tool = 'hand' | 'pencil' | 'eraser' | 'lasso' | 'addSticker'
export type { LetterSize }

export type BoardPoint = {
  x: number
  y: number
}

export type Stroke = BoardPoint[]

/** Board-space edges of what is currently on screen. */
export type BoardRect = {
  left: number
  top: number
  right: number
  bottom: number
}

export type InkBounds = {
  x: number
  y: number
  width: number
  height: number
}

export type Letter = {
  id: string
  glyph: string
  x: number
  y: number
  size: LetterSize
  fill: LetterFill
  fontFamily: BoardFontFamily
}

export type Board = {
  letters: Letter[]
  language: Language
  tool: Tool
  capsLock: boolean
  lastPlacedStickerId: string | null
  selectedIds: string[]
}

export const emptyBoard = (language: Language = 'id'): Board => ({
  letters: [],
  language,
  tool: 'pencil',
  capsLock: true,
  lastPlacedStickerId: null,
  selectedIds: [],
})
