import {
  alignmentYTolerance,
  boardFontFamilies,
  defaultBoardFont,
  defaultLetterFill,
  letterFills,
  letterGap,
  letterSizes,
  lineGap,
  type BoardFontFamily,
  type LetterFill,
  type LetterSize,
} from '../theme/tokens'
import { measureGlyphWidth } from './measure'
import type {
  Board,
  BoardPoint,
  BoardRect,
  InkBounds,
  Language,
  Letter,
  Tool,
} from './types'

export type StickerStyle = {
  size: LetterSize
  fill: LetterFill
  fontFamily: BoardFontFamily
}

export const defaultStickerStyle: StickerStyle = {
  size: 'M',
  fill: defaultLetterFill,
  fontFamily: defaultBoardFont,
}

export const getLetterDimensions = (
  letter: Pick<Letter, 'glyph' | 'size' | 'fontFamily'>,
) => {
  const height = letterSizes[letter.size]
  return {
    width: measureGlyphWidth(letter.glyph, letter.fontFamily, height),
    height,
  }
}

export const createSticker = (
  id: string,
  glyph: string,
  point: BoardPoint,
  style: StickerStyle,
): Letter => ({
  id,
  glyph,
  x: point.x,
  y: point.y,
  ...style,
})

export const addSticker = (board: Board, letter: Letter): Board => ({
  ...board,
  letters: [...board.letters, letter],
  selectedIds: [letter.id],
})

export const moveSticker = (
  board: Board,
  id: string,
  point: BoardPoint,
): Board => ({
  ...board,
  letters: board.letters.map((letter) =>
    letter.id === id ? { ...letter, ...point } : letter,
  ),
})

export const removeSticker = (board: Board, id: string): Board => ({
  ...board,
  letters: board.letters.filter((letter) => letter.id !== id),
  selectedIds: board.selectedIds.filter((selectedId) => selectedId !== id),
  lastPlacedStickerId:
    board.lastPlacedStickerId === id ? null : board.lastPlacedStickerId,
})

/** Start of the row the anchor belongs to, one line lower and still on screen. */
const nextRowPoint = (
  board: Board,
  anchor: Letter,
  height: number,
  visible: BoardRect,
): BoardPoint => {
  const row = board.letters.filter(
    (letter) => Math.abs(letter.y - anchor.y) <= alignmentYTolerance,
  )
  const rowBottom = Math.max(
    ...row.map((letter) => letter.y + getLetterDimensions(letter).height),
  )

  return {
    x: Math.max(Math.min(...row.map(({ x }) => x)), visible.left + letterGap),
    y: Math.min(
      rowBottom + lineGap,
      Math.max(visible.top + letterGap, visible.bottom - letterGap - height),
    ),
  }
}

export const placeStickerFromGrid = (
  board: Board,
  id: string,
  glyph: string,
  visible: BoardRect,
  style: StickerStyle,
): Board => {
  const anchor = board.letters.find(
    (letter) => letter.id === board.lastPlacedStickerId,
  )
  const { width, height } = getLetterDimensions({ glyph, ...style })
  const nextPoint = (): BoardPoint => {
    if (!anchor) {
      return { x: visible.left + letterGap, y: visible.top + letterGap }
    }
    const x = anchor.x + getLetterDimensions(anchor).width + letterGap
    return x + width <= visible.right - letterGap
      ? { x, y: anchor.y }
      : nextRowPoint(board, anchor, height, visible)
  }
  const letter = createSticker(id, glyph, nextPoint(), style)

  return {
    ...board,
    letters: [...board.letters, letter],
    lastPlacedStickerId: id,
    selectedIds: [id],
  }
}

export const replacePendingInkWithSticker = (
  board: Board,
  id: string,
  glyph: string,
  bounds: InkBounds,
  style: StickerStyle,
): Board =>
  addSticker(
    board,
    createSticker(id, glyph, { x: bounds.x, y: bounds.y }, style),
  )

export const replacePendingInkWithStickerRow = (
  board: Board,
  ids: string[],
  text: string,
  bounds: InkBounds,
  style: StickerStyle,
): Board => {
  let nextX = bounds.x
  const letters = text.split('').map((glyph, index) => {
    const letter = createSticker(
      ids[index],
      glyph,
      { x: nextX, y: bounds.y },
      style,
    )
    nextX += getLetterDimensions(letter).width + letterGap
    return letter
  })

  return {
    ...board,
    letters: [...board.letters, ...letters],
    lastPlacedStickerId: letters.at(-1)?.id ?? board.lastPlacedStickerId,
    selectedIds: letters.map(({ id }) => id),
  }
}

export const setTool = (board: Board, tool: Tool): Board => ({
  ...board,
  tool,
  selectedIds: tool === 'pencil' || tool === 'eraser' ? [] : board.selectedIds,
})

export const setLanguage = (board: Board, language: Language): Board => ({
  ...board,
  language,
})

export const setCapsLock = (board: Board, capsLock: boolean): Board => ({
  ...board,
  capsLock,
})

export const setSelection = (board: Board, selectedIds: string[]): Board => ({
  ...board,
  selectedIds,
})

export const setSelectedSize = (board: Board, size: LetterSize): Board => ({
  ...board,
  letters: board.letters.map((letter) =>
    board.selectedIds.includes(letter.id) ? { ...letter, size } : letter,
  ),
})

export const setSelectedFill = (board: Board, fill: LetterFill): Board => ({
  ...board,
  letters: board.letters.map((letter) =>
    board.selectedIds.includes(letter.id) ? { ...letter, fill } : letter,
  ),
})

export const setSelectedFont = (
  board: Board,
  fontFamily: BoardFontFamily,
): Board => ({
  ...board,
  letters: board.letters.map((letter) =>
    board.selectedIds.includes(letter.id)
      ? { ...letter, fontFamily }
      : letter,
  ),
})

export const sortLettersLeftToRight = (letters: Letter[]) =>
  [...letters].sort((a, b) => a.x - b.x || a.y - b.y)

export const selectionIsAligned = (letters: Letter[]) => {
  if (letters.length < 2) return true
  const ordered = sortLettersLeftToRight(letters)
  const yValues = ordered.map(({ y }) => y)
  if (Math.max(...yValues) - Math.min(...yValues) > alignmentYTolerance) {
    return false
  }

  const gaps = ordered.slice(1).map((letter, index) => {
    const previous = ordered[index]
    return letter.x - previous.x - getLetterDimensions(previous).width
  })
  return gaps.every(
    (gap) => Math.abs(gap - letterGap) <= alignmentYTolerance,
  )
}

export const alignSelectedStickers = (board: Board): Board => {
  const selected = sortLettersLeftToRight(
    board.letters.filter((letter) => board.selectedIds.includes(letter.id)),
  )
  if (selected.length < 2 || selectionIsAligned(selected)) return board

  const ys = selected.map(({ y }) => y).sort((a, b) => a - b)
  const sharedY = ys[Math.floor(ys.length / 2)]
  let nextX = Math.min(...selected.map(({ x }) => x))
  const positions = new Map<string, BoardPoint>()

  selected.forEach((letter) => {
    positions.set(letter.id, { x: nextX, y: sharedY })
    nextX += getLetterDimensions(letter).width + letterGap
  })

  return {
    ...board,
    letters: board.letters.map((letter) => ({
      ...letter,
      ...positions.get(letter.id),
    })),
  }
}

export const pointInPolygon = (point: BoardPoint, polygon: BoardPoint[]) => {
  let inside = false
  for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index++) {
    const a = polygon[index]
    const b = polygon[previous]
    const crosses =
      a.y > point.y !== b.y > point.y &&
      point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x
    if (crosses) inside = !inside
  }
  return inside
}

export const selectableLetterFills = letterFills
export const selectableBoardFonts = boardFontFamilies
