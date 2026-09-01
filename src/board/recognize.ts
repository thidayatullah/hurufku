import type { Stroke } from './types'
import { inferLetterFromStrokes } from '../recognize/infer'

export type RecognitionResult = {
  glyph: string
  confidence: number
  alternatives: string[]
}

const fallbackResult: RecognitionResult = {
  glyph: 'A',
  confidence: 0,
  alternatives: ['A', 'B', 'C'],
}

const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
  const timeout = new Promise<never>((_, reject) => {
    window.setTimeout(() => reject(new Error('recognition-timeout')), timeoutMs)
  })
  return Promise.race([promise, timeout])
}

export const recognize = async (strokes: Stroke[]): Promise<RecognitionResult> => {
  try {
    return await withTimeout(inferLetterFromStrokes(strokes), 900)
  } catch {
    return fallbackResult
  }
}
