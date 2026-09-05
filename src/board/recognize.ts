import type { Stroke } from './types'
import { inferTextFromStrokes } from '../recognize/infer'

export type RecognitionResult = {
  text: string
  confidence: number
  alternatives: string[]
}

const fallbackResult: RecognitionResult = {
  text: '',
  confidence: 0,
  alternatives: [],
}

const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
  const timeout = new Promise<never>((_, reject) => {
    window.setTimeout(() => reject(new Error('recognition-timeout')), timeoutMs)
  })
  return Promise.race([promise, timeout])
}

export const recognize = async (strokes: Stroke[]): Promise<RecognitionResult> => {
  try {
    return await withTimeout(inferTextFromStrokes(strokes), 6000)
  } catch {
    return fallbackResult
  }
}
