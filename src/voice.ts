// Voix : par défaut celle du navigateur (gratuite). Si la « voix IA » est activée ET que le serveur l'autorise (learn-voix),
// on joue la voix Gemini ; au moindre refus ou erreur, on retombe sur la voix du navigateur.
import { supabase } from './supabase'
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

export const stopSpeaking = () => { if (canSpeak) speechSynthesis.cancel(); try { current?.stop() } catch { /* ignoré */ } }

// ───────── Voix IA (optionnelle, désactivée côté serveur tant que Beau n'a pas donné son accord) ─────────
const FLAG = 'learn:voixIA'
export const voixIAActive = () => { try { return localStorage.getItem(FLAG) === '1' } catch { return false } }
export const setVoixIA = (v: boolean) => { try { localStorage.setItem(FLAG, v ? '1' : '0') } catch { /* ignoré */ } }

let aiOff = false              // le serveur a refusé (désactivée, quota, erreur) : on n'insiste pas pendant la session
let ctx: AudioContext | null = null
let current: AudioBufferSourceNode | null = null

async function playAI(text: string, voice: string, onEnd: () => void): Promise<boolean> {
  if (aiOff || !supabase) return false
  const { data, error } = await supabase.functions.invoke('learn-voix', { body: { text, voice } })
  if (error || !data?.audio) { aiOff = true; return false }
  try {
    const bin = atob(data.audio as string)
    const pcm = new Int16Array(bin.length / 2)
    for (let i = 0; i < pcm.length; i++) pcm[i] = (bin.charCodeAt(2 * i) | (bin.charCodeAt(2 * i + 1) << 8)) << 16 >> 16
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    ctx ??= new AC()
    await ctx.resume()
    const buf = ctx.createBuffer(1, pcm.length, (data.rate as number) || 24000)
    const ch = buf.getChannelData(0)
    for (let i = 0; i < pcm.length; i++) ch[i] = pcm[i] / 32768
    const src = ctx.createBufferSource()
    src.buffer = buf; src.connect(ctx.destination); src.onended = onEnd
    current?.stop(); current = src; src.start()
    return true
  } catch { aiOff = true; return false }
}

/** Lit un texte : voix IA si activée et autorisée, sinon voix du navigateur. */
export function speakSmart(text: string, lang: string, onEnd: () => void = () => {}, voice = 'Kore') {
  if (voixIAActive() && !aiOff) {
    void playAI(text, voice, onEnd).then((ok) => { if (!ok) speakThen(text, lang, onEnd) })
    return
  }
  speakThen(text, lang, onEnd)
}
