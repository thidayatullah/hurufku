import { describe, expect, it } from 'vitest'
import { decodeCtcBeams } from './infer'
import { CTC_BLANK_INDEX } from './labels'

const CLASS_COUNT = 31
const LETTER_OFFSET = 3

const probabilitiesFor = (sequence: string[]): Float32Array => {
  const timeSteps = sequence.length + 2
  const probabilities = new Float32Array(timeSteps * CLASS_COUNT)

  sequence.forEach((glyph, time) => {
    const rowOffset = time * CLASS_COUNT
    probabilities.fill(0.0001, rowOffset, rowOffset + CLASS_COUNT)
    const index = glyph === ''
      ? CTC_BLANK_INDEX
      : LETTER_OFFSET + glyph.charCodeAt(0) - 'A'.charCodeAt(0)
    probabilities[rowOffset + index] = 0.997
  })

  return probabilities
}

describe('decodeCtcBeams', () => {
  it('preserves arbitrary uppercase sequences without a dictionary', () => {
    const sequence = ['Q', 'Z', 'X']
    const beams = decodeCtcBeams(
      probabilitiesFor(sequence),
      sequence.length + 2,
      CLASS_COUNT,
    )

    expect(beams[0].text).toBe('QZX')
  })

  it('keeps repeated letters when a CTC blank separates them', () => {
    const sequence = ['A', '', 'A']
    const beams = decodeCtcBeams(
      probabilitiesFor(sequence),
      sequence.length + 2,
      CLASS_COUNT,
    )

    expect(beams[0].text).toBe('AA')
  })

  it('collapses adjacent repeated labels', () => {
    const sequence = ['A', 'A']
    const beams = decodeCtcBeams(
      probabilitiesFor(sequence),
      sequence.length + 2,
      CLASS_COUNT,
    )

    expect(beams[0].text).toBe('A')
  })
})
