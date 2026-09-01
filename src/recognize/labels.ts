const DIGITS = '0123456789'.split('')
const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz'.split('')

const BY_CLASS_LABELS = [...DIGITS, ...UPPERCASE, ...LOWERCASE]

const EMNIST_LETTERS_LABELS = UPPERCASE

type LabelEntry = {
  index: number
  glyph: string
}

export const labelsForClassCount = (classCount: number): LabelEntry[] => {
  if (classCount === BY_CLASS_LABELS.length) {
    return BY_CLASS_LABELS.map((glyph, index) => ({ index, glyph }))
  }

  if (classCount === EMNIST_LETTERS_LABELS.length) {
    return EMNIST_LETTERS_LABELS.map((glyph, index) => ({ index, glyph }))
  }

  return Array.from({ length: classCount }, (_, index) => {
    const glyph = BY_CLASS_LABELS[index] ?? `?${index}`
    return { index, glyph }
  })
}

export const isLetterGlyph = (glyph: string): boolean => /^[A-Za-z]$/.test(glyph)
