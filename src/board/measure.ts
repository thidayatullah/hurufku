import { fallbackGlyphWidthRatio } from '../theme/tokens'
import type { BoardFontFamily } from '../theme/tokens'

/**
 * Glyph advance widths, measured with the same font string Konva uses so board
 * layout matches what the canvas actually paints.
 */
const widthCache = new Map<string, number>()

let measuringContext: CanvasRenderingContext2D | null | undefined

const getMeasuringContext = () => {
  if (measuringContext === undefined) {
    measuringContext =
      typeof document === 'undefined'
        ? null
        : document.createElement('canvas').getContext('2d')
  }
  return measuringContext
}

export const measureGlyphWidth = (
  glyph: string,
  fontFamily: BoardFontFamily,
  fontSize: number,
) => {
  const key = `${fontFamily}|${fontSize}|${glyph}`
  const cached = widthCache.get(key)
  if (cached !== undefined) return cached

  const context = getMeasuringContext()
  const fallback = fontSize * fallbackGlyphWidthRatio
  if (!context) return fallback

  context.font = `normal normal ${fontSize}px "${fontFamily}"`
  const width = context.measureText(glyph).width || fallback
  widthCache.set(key, width)
  return width
}

/** Widths measured before webfonts load are wrong; drop them once fonts settle. */
export const clearGlyphWidthCache = () => {
  widthCache.clear()
}
