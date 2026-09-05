import {
  alignmentYTolerance,
  boardFontFamilies,
  brushes,
  defaultBoardFont,
  defaultInkStyle,
  defaultLetterFill,
  letterFills,
  letterGap,
  letterSizes,
  lineGap,
  strokeWeights,
  type BoardFontFamily,
  type BrushKind,
  type LetterFill,
  type LetterSize,
  type StrokeWeight,
} from '../theme/tokens'
import { measureGlyphWidth } from './measure'
import type {
  Board,
  BoardItem,
  BoardPoint,
  BoardRect,
  InkBounds,
  Language,
  LetterItem,
  ScribbleItem,
  Stroke,
  Tool,
} from './types'

export type StickerStyle = {
  size: LetterSize
  fill: LetterFill
  fontFamily: BoardFontFamily
}

export type InkStyle = {
  fill: LetterFill
  brush: BrushKind
  weight: StrokeWeight
}

export const defaultStickerStyle: StickerStyle = {
  size: 'M',
  fill: defaultLetterFill,
  fontFamily: defaultBoardFont,
}

export const defaultScribbleStyle: InkStyle = defaultInkStyle

export const getLetterDimensions = (
  letter: Pick<LetterItem, 'glyph' | 'size' | 'fontFamily'>,
) => {
  const height = letterSizes[letter.size]
  return {
    width: measureGlyphWidth(letter.glyph, letter.fontFamily, height),
    height,
  }
}

export const getItemDimensions = (item: BoardItem) => {
  if (item.kind === 'letter') return getLetterDimensions(item)
  return {
    width: item.width,
    height: item.height,
  }
}

export const createSticker = (
  id: string,
  glyph: string,
  point: BoardPoint,
  style: StickerStyle,
): LetterItem => ({
  kind: 'letter',
  id,
  glyph,
  x: point.x,
  y: point.y,
  ...style,
})

export const createScribble = (
  id: string,
  strokes: Stroke[],
  bounds: InkBounds,
  style: InkStyle,
): ScribbleItem => ({
  kind: 'scribble',
  id,
  x: bounds.x,
  y: bounds.y,
  width: bounds.width,
  height: bounds.height,
  strokes: strokes.map((stroke) =>
    stroke.map((point) => ({
      x: point.x - bounds.x,
      y: point.y - bounds.y,
    })),
  ),
  ...style,
})

export const addItem = (board: Board, item: BoardItem): Board => ({
  ...board,
  items: [...board.items, item],
  selectedIds: [item.id],
})

export const addSticker = (board: Board, letter: LetterItem): Board =>
  addItem(board, letter)

export const moveItem = (
  board: Board,
  id: string,
  point: BoardPoint,
): Board => ({
  ...board,
  items: board.items.map((item) =>
    item.id === id ? { ...item, ...point } : item,
  ),
})

export const moveItems = (
  board: Board,
  positions: Map<string, BoardPoint>,
): Board => ({
  ...board,
  items: board.items.map((item) => ({
    ...item,
    ...positions.get(item.id),
  })),
})

export const moveSticker = moveItem

export const removeItem = (board: Board, id: string): Board => ({
  ...board,
  items: board.items.filter((item) => item.id !== id),
  selectedIds: board.selectedIds.filter((selectedId) => selectedId !== id),
  lastPlacedStickerId:
    board.lastPlacedStickerId === id ? null : board.lastPlacedStickerId,
})

export const removeItems = (board: Board, ids: string[]): Board => {
  const removable = new Set(ids)
  return {
    ...board,
    items: board.items.filter((item) => !removable.has(item.id)),
    selectedIds: board.selectedIds.filter((id) => !removable.has(id)),
    lastPlacedStickerId:
      board.lastPlacedStickerId && removable.has(board.lastPlacedStickerId)
        ? null
        : board.lastPlacedStickerId,
  }
}

export const removeSticker = removeItem

/** Start of the row the anchor belongs to, one line lower and still on screen. */
const nextRowPoint = (
  board: Board,
  anchor: LetterItem,
  height: number,
  visible: BoardRect,
): BoardPoint => {
  const row = board.items.filter(
    (item) => Math.abs(item.y - anchor.y) <= alignmentYTolerance,
  )
  const rowBottom = Math.max(
    ...row.map((item) => item.y + getItemDimensions(item).height),
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
  const anchor = board.items.find(
    (item): item is LetterItem =>
      item.kind === 'letter' && item.id === board.lastPlacedStickerId,
  )
  const { width, height } = getLetterDimensions({ glyph, ...style })
  const nextPoint = (): BoardPoint => {
    if (!anchor) {
      const visibleWidth = visible.right - visible.left
      const visibleHeight = visible.bottom - visible.top
      return {
        x: Math.min(
          Math.max(visible.left + visibleWidth * 0.5 - width / 2, visible.left + letterGap),
          visible.right - letterGap - width,
        ),
        y: Math.min(
          Math.max(visible.top + visibleHeight * 0.35 - height / 2, visible.top + letterGap),
          visible.bottom - letterGap - height,
        ),
      }
    }
    const x = anchor.x + getLetterDimensions(anchor).width + letterGap
    return x + width <= visible.right - letterGap
      ? { x, y: anchor.y }
      : nextRowPoint(board, anchor, height, visible)
  }
  const letter = createSticker(id, glyph, nextPoint(), style)

  return {
    ...board,
    items: [...board.items, letter],
    lastPlacedStickerId: id,
    selectedIds: [id],
  }
}

export const setTool = (board: Board, tool: Tool): Board => ({
  ...board,
  tool,
  selectedIds: tool === 'pencil' ? [] : board.selectedIds,
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
  items: board.items.map((item) =>
    item.kind === 'letter' && board.selectedIds.includes(item.id)
      ? { ...item, size }
      : item,
  ),
})

export const setSelectedFill = (board: Board, fill: LetterFill): Board => ({
  ...board,
  items: board.items.map((item) =>
    board.selectedIds.includes(item.id) ? { ...item, fill } : item,
  ),
})

export const setSelectedFont = (
  board: Board,
  fontFamily: BoardFontFamily,
): Board => ({
  ...board,
  items: board.items.map((item) =>
    item.kind === 'letter' && board.selectedIds.includes(item.id)
      ? { ...item, fontFamily }
      : item,
  ),
})

export const setSelectedBrush = (
  board: Board,
  brush: BrushKind,
): Board => ({
  ...board,
  items: board.items.map((item) =>
    item.kind === 'scribble' && board.selectedIds.includes(item.id)
      ? { ...item, brush }
      : item,
  ),
})

export const setSelectedWeight = (
  board: Board,
  weight: StrokeWeight,
): Board => ({
  ...board,
  items: board.items.map((item) =>
    item.kind === 'scribble' && board.selectedIds.includes(item.id)
      ? { ...item, weight }
      : item,
  ),
})

export const sortItemsLeftToRight = <Item extends BoardItem>(items: Item[]) =>
  [...items].sort((a, b) => a.x - b.x || a.y - b.y)

export const sortLettersLeftToRight = (letters: LetterItem[]) =>
  sortItemsLeftToRight(letters)

export const selectionIsAligned = (items: BoardItem[]) => {
  if (items.length < 2) return true
  const ordered = sortItemsLeftToRight(items)
  const yValues = ordered.map(({ y }) => y)
  if (Math.max(...yValues) - Math.min(...yValues) > alignmentYTolerance) {
    return false
  }

  const gaps = ordered.slice(1).map((item, index) => {
    const previous = ordered[index]
    return item.x - previous.x - getItemDimensions(previous).width
  })
  return gaps.every(
    (gap) => Math.abs(gap - letterGap) <= alignmentYTolerance,
  )
}

export const alignSelectedStickers = (board: Board): Board => {
  const selected = sortItemsLeftToRight(
    board.items.filter((item) => board.selectedIds.includes(item.id)),
  )
  if (selected.length < 2 || selectionIsAligned(selected)) return board

  const ys = selected.map(({ y }) => y).sort((a, b) => a - b)
  const sharedY = ys[Math.floor(ys.length / 2)]
  let nextX = Math.min(...selected.map(({ x }) => x))
  const positions = new Map<string, BoardPoint>()

  selected.forEach((item) => {
    positions.set(item.id, { x: nextX, y: sharedY })
    nextX += getItemDimensions(item).width + letterGap
  })

  return {
    ...board,
    items: board.items.map((item) => ({
      ...item,
      ...positions.get(item.id),
    })),
  }
}

export const selectableBrushes = Object.keys(brushes) as BrushKind[]
export const selectableStrokeWeights = Object.keys(strokeWeights) as StrokeWeight[]

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
