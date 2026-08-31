import type { Stroke } from './types'

export type RecognitionResult = {
  glyph: string
  confidence: number
  alternatives: string[]
}

const candidates = ['A', 'B', 'D', 'E', 'H', 'K', 'M', 'N', 'O', 'P', 'R', 'S', 'T', 'U']

/**
 * Stable local stub with the same boundary as a future on-device model.
 * It deliberately returns low confidence for some shapes so the picker is testable.
 */
export const recognize = (strokes: Stroke[]): RecognitionResult => {
  const pointCount = strokes.reduce((total, stroke) => total + stroke.length, 0)
  const seed = strokes.reduce(
    (total, stroke) =>
      total +
      stroke.reduce(
        (strokeTotal, point) =>
          strokeTotal + Math.round(point.x) * 3 + Math.round(point.y) * 7,
        0,
      ),
    pointCount * 11,
  )
  const index = Math.abs(seed) % candidates.length
  const alternatives = [0, 1, 2].map(
    (offset) => candidates[(index + offset) % candidates.length],
  )

  return {
    glyph: alternatives[0],
    confidence: pointCount % 3 === 0 ? 0.86 : 0.58,
    alternatives,
  }
}
