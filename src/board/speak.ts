import type { Language, LetterItem } from './types'
import { sortItemsLeftToRight } from './board'

const preferredLanguage: Record<Language, string> = {
  id: 'id-ID',
  en: 'en-US',
}

export const speakLetters = (letters: LetterItem[], language: Language) => {
  if (!('speechSynthesis' in window) || letters.length === 0) return

  const lang = preferredLanguage[language]
  const family = `${language.toLowerCase()}-`
  const voices = window.speechSynthesis.getVoices()
  const exactVoice = voices.find(
    (voice) => voice.lang.toLowerCase() === lang.toLowerCase(),
  )
  const familyVoice = voices.find((voice) => {
    const voiceLanguage = voice.lang.toLowerCase()
    return voiceLanguage === language || voiceLanguage.startsWith(family)
  })
  const utterance = new SpeechSynthesisUtterance(
    // Lowercased so voices read a syllable ("ba") instead of spelling out an all-caps acronym ("B, A").
    sortItemsLeftToRight(letters)
      .map(({ glyph }) => glyph.toLowerCase())
      .join(''),
  )
  utterance.lang = lang
  utterance.voice = exactVoice ?? familyVoice ?? null
  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(utterance)
}
