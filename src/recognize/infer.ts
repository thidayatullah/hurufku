import type { Tensor } from '@tensorflow/tfjs-core'
import { tensor4d, tidy } from '@tensorflow/tfjs-core'
import type { Stroke } from '../board/types'
import { CTC_BLANK_INDEX, uppercaseLetterEntries } from './labels'
import { loadLetterModel } from './loadModel'
import {
  MODEL_IMAGE_HEIGHT,
  MODEL_IMAGE_WIDTH,
  rasterizeStrokes,
} from './rasterize'

export type InferenceResult = {
  text: string
  confidence: number
  alternatives: string[]
}

type Beam = {
  blank: number
  nonBlank: number
}

const MAX_TEXT_LENGTH = 12
const BEAM_WIDTH = 12
const NEGATIVE_INFINITY = Number.NEGATIVE_INFINITY

const logSumExp = (...values: number[]): number => {
  const maximum = Math.max(...values)
  if (maximum === NEGATIVE_INFINITY) return maximum
  return maximum + Math.log(
    values.reduce((sum, value) => sum + Math.exp(value - maximum), 0),
  )
}

const addBeam = (
  beams: Map<string, Beam>,
  prefix: string,
  update: Partial<Beam>,
) => {
  const current = beams.get(prefix) ?? {
    blank: NEGATIVE_INFINITY,
    nonBlank: NEGATIVE_INFINITY,
  }
  beams.set(prefix, {
    blank:
      update.blank === undefined
        ? current.blank
        : logSumExp(current.blank, update.blank),
    nonBlank:
      update.nonBlank === undefined
        ? current.nonBlank
        : logSumExp(current.nonBlank, update.nonBlank),
  })
}

export const decodeCtcBeams = (
  probabilities: Float32Array,
  timeSteps: number,
  classCount: number,
): { text: string; score: number }[] => {
  let beams = new Map<string, Beam>([
    ['', { blank: 0, nonBlank: NEGATIVE_INFINITY }],
  ])

  for (let time = 0; time < Math.max(0, timeSteps - 2); time += 1) {
    const next = new Map<string, Beam>()
    beams.forEach((beam, prefix) => {
      const total = logSumExp(beam.blank, beam.nonBlank)
      const blankProbability = Math.max(
        probabilities[time * classCount + CTC_BLANK_INDEX] ?? 0,
        Number.EPSILON,
      )
      addBeam(next, prefix, {
        blank: total + Math.log(blankProbability),
      })

      uppercaseLetterEntries.forEach(({ glyph, index }) => {
        const probability = Math.max(
          probabilities[time * classCount + index] ?? 0,
          Number.EPSILON,
        )
        const logProbability = Math.log(probability)
        if (prefix.endsWith(glyph)) {
          addBeam(next, prefix, {
            nonBlank: beam.nonBlank + logProbability,
          })
          if (prefix.length < MAX_TEXT_LENGTH) {
            addBeam(next, `${prefix}${glyph}`, {
              nonBlank: beam.blank + logProbability,
            })
          }
        } else if (prefix.length < MAX_TEXT_LENGTH) {
          addBeam(next, `${prefix}${glyph}`, {
            nonBlank: total + logProbability,
          })
        }
      })
    })

    beams = new Map(
      [...next.entries()]
        .sort(
          ([, left], [, right]) =>
            logSumExp(right.blank, right.nonBlank) -
            logSumExp(left.blank, left.nonBlank),
        )
        .slice(0, BEAM_WIDTH),
    )
  }

  return [...beams.entries()]
    .filter(([text]) => text.length > 0)
    .map(([text, beam]) => ({
      text,
      score: logSumExp(beam.blank, beam.nonBlank),
    }))
    .sort((left, right) => right.score - left.score)
}

export const inferTextFromStrokes = async (
  strokes: Stroke[],
): Promise<InferenceResult> => {
  const model = await loadLetterModel()
  const input = rasterizeStrokes(strokes)
  const prediction = tidy(() => {
    const image = tensor4d(input, [
      1,
      MODEL_IMAGE_WIDTH,
      MODEL_IMAGE_HEIGHT,
      1,
    ])
    const output = model.predict(image) as Tensor
    return {
      probabilities: Float32Array.from(output.dataSync()),
      shape: [...output.shape],
    }
  })
  const [, timeSteps = 0, classCount = 0] = prediction.shape
  const beams = decodeCtcBeams(
    prediction.probabilities,
    timeSteps,
    classCount,
  )
  if (beams.length === 0) {
    return { text: '', confidence: 0, alternatives: [] }
  }

  const totalScore = logSumExp(...beams.map(({ score }) => score))
  return {
    text: beams[0].text,
    confidence: Math.exp(beams[0].score - totalScore),
    alternatives: beams.slice(0, 3).map(({ text }) => text),
  }
}