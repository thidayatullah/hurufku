import type {
  BoardFontFamily,
  BrushKind,
  LetterFill,
  LetterSize,
  StrokeWeight,
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

export type LetterItem = {
  kind: 'letter'
  id: string
  glyph: string
  x: number
  y: number
  size: LetterSize
  fill: LetterFill
  fontFamily: BoardFontFamily
}

export type ScribbleItem = {
  kind: 'scribble'
  id: string
  x: number
  y: number
  width: number
  height: number
  strokes: Stroke[]
  fill: LetterFill
  brush: BrushKind
  weight: StrokeWeight
}

export type BoardItem = LetterItem | ScribbleItem

export type Letter = LetterItem

export type Board = {
  items: BoardItem[]
  language: Language
  tool: Tool
  capsLock: boolean
  lastPlacedStickerId: string | null
  selectedIds: string[]
}

export const emptyBoard = (language: Language = 'id'): Board => ({
  items: [],
  language,
  tool: 'pencil',
  capsLock: true,
  lastPlacedStickerId: null,
  selectedIds: [],
})
