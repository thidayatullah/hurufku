import type { Language, Letter } from './types'
import { sortLettersLeftToRight } from './board'

const preferredLanguage: Record<Language, string> = {
  id: 'id-ID',
  en: 'en-US',
}

export const speakLetters = (letters: Letter[], language: Language) => {
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
    sortLettersLeftToRight(letters)
      .map(({ glyph }) => glyph)
      .join(''),
  )
  utterance.lang = lang
  utterance.voice = exactVoice ?? familyVoice ?? null
  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(utterance)
}
