import type { Tensor } from '@tensorflow/tfjs-core'
import { softmax, tensor4d, tidy } from '@tensorflow/tfjs-core'
import type { Stroke } from '../board/types'
import { isLetterGlyph, labelsForClassCount } from './labels'
import { loadLetterModel } from './loadModel'
import { rasterizeStrokes } from './rasterize'

export type InferenceResult = {
  glyph: string
  confidence: number
  alternatives: string[]
}

type RankedPrediction = {
  glyph: string
  confidence: number
}

const fallbackResult = (): InferenceResult => ({
  glyph: 'A',
  confidence: 0,
  alternatives: ['A', 'B', 'C'],
})

const topLetterPredictions = (
  probabilities: ArrayLike<number>,
  topK: number,
): RankedPrediction[] => {
  const labels = labelsForClassCount(probabilities.length)
  return labels
    .filter((entry) => isLetterGlyph(entry.glyph))
    .map((entry) => ({
      glyph: entry.glyph,
      confidence: probabilities[entry.index] ?? 0,
    }))
    .sort((left, right) => right.confidence - left.confidence)
    .slice(0, topK)
}

const toTensor = (prediction: Tensor | Tensor[]): Tensor =>
  Array.isArray(prediction) ? prediction[0] : prediction

export const inferLetterFromStrokes = async (
  strokes: Stroke[],
): Promise<InferenceResult> => {
  if (strokes.length === 0) return fallbackResult()

  const model = await loadLetterModel()
  const input = rasterizeStrokes(strokes)

  const probabilities = tidy(() => {
    const image = tensor4d(input, [1, 28, 28, 1])
    const prediction = toTensor(model.predict(image) as Tensor | Tensor[])
    return Float32Array.from(softmax(prediction).dataSync())
  })

  const ranked = topLetterPredictions(probabilities, 5)
  if (ranked.length === 0) return fallbackResult()

  return {
    glyph: ranked[0].glyph,
    confidence: ranked[0].confidence,
    alternatives: ranked.slice(0, 3).map((entry) => entry.glyph),
  }
}
