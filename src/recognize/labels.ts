export const CTC_BLANK_INDEX = 30

const LABELS = [
  ' ',
  "'",
  '-',
  ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  '`',
]

export const uppercaseLetterEntries = LABELS.map((glyph, index) => ({
  glyph,
  index,
})).filter(({ glyph }) => /^[A-Z]$/.test(glyph))
