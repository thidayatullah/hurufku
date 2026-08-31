export type Language = 'en' | 'id'

export type Letter = {
  id: string
  glyph: string
  x: number
  y: number
  width: number
  height: number
  fill: string
  fontFamily: string
}

export type Board = {
  letters: Letter[]
  language: Language
}

export const emptyBoard = (language: Language = 'en'): Board => ({
  letters: [],
  language,
})
