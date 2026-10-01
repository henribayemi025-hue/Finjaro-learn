// Voix du navigateur : gratuit, aucune clé. Reconnaissance + synthèse vocales.
/* eslint-disable @typescript-eslint/no-explicit-any */
const SR: any = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition

export const canListen = !!SR
export const canSpeak = 'speechSynthesis' in window

export function listen(lang: string, onText: (t: string) => void, onEnd: () => void) {
  const r = new SR()
  r.lang = lang === 'en' ? 'en-US' : 'fr-FR'
  r.interimResults = false
  r.onresult = (e: any) => onText(e.results[0][0].transcript)
  r.onend = onEnd
  r.onerror = onEnd
  r.start()
  return () => r.stop()
}

export function speak(text: string, lang: string) {
  if (!canSpeak) return
  speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = lang === 'en' ? 'en-US' : 'fr-FR'
  speechSynthesis.speak(u)
}

/** Lit le texte puis appelle onEnd (fin de lecture, erreur ou interruption). */
export function speakThen(text: string, lang: string, onEnd: () => void) {
  if (!canSpeak) { onEnd(); return }
  speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = lang === 'en' ? 'en-US' : 'fr-FR'
  u.onend = onEnd
  u.onerror = onEnd
  speechSynthesis.speak(u)
}

export const stopSpeaking = () => { if (canSpeak) speechSynthesis.cancel() }
