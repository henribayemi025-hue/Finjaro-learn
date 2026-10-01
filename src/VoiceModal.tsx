import { useCallback, useEffect, useRef, useState } from 'react'
import AgentFace from './AgentFace'
import { askTutor } from './tutor'
import { canListen, listen, speakThen, stopSpeaking } from './voice'
import { acu } from './academy-i18n'
import { ui, type Lang } from './i18n'

export interface CallAgent { key: string; name: string; face?: string; initial: string; custom?: { name: string; personality: string } }
type State = 'idle' | 'listening' | 'thinking' | 'speaking'

/** Appel vocal : micro du navigateur → learn-tutor → réponse lue à voix haute, en boucle jusqu'à « Raccrocher ». */
export default function VoiceModal({ lang, agent, lesson, code, onClose }: {
  lang: Lang; agent: CallAgent; lesson: string; code: string; onClose: () => void
}) {
  const t = acu(lang), u = ui[lang]
  const [state, setState] = useState<State>('idle')
  const [you, setYou] = useState('')
  const [reply, setReply] = useState('')
  const [err, setErr] = useState('')
  const stopRef = useRef<(() => void) | null>(null)
  const alive = useRef(true)

  const turn = useCallback(() => {
    if (!alive.current || !canListen) return
    setState('listening'); setErr('')
    let heard = ''
    stopRef.current = listen(lang, (txt) => { heard = txt }, async () => {
      if (!alive.current) return
      if (!heard.trim()) { setState('idle'); return }
      setYou(heard); setState('thinking')
      const r = await askTutor({ question: heard, code, lesson, output: '', lang, agentId: agent.key, custom: agent.custom })
      if (!alive.current) return
      if (!r.answer) { setErr(r.error === 'quota' ? u.quota : u.aiError); setState('idle'); return }
      setReply(r.answer); setState('speaking')
      speakThen(r.answer, lang, () => { if (alive.current) turn() })
    })
  }, [lang, agent, lesson, code, u.quota, u.aiError])

  useEffect(() => () => { alive.current = false; stopRef.current?.(); stopSpeaking() }, [])
  const hang = () => { alive.current = false; stopRef.current?.(); stopSpeaking(); onClose() }
  const status = state === 'listening' ? t.listening : state === 'thinking' ? t.thinking : state === 'speaking' ? t.speaking : t.idle

  return (
    <div className="fixed inset-0 z-50 bg-ink/70 p-3 flex items-center justify-center" role="dialog" aria-modal="true" aria-label={`${t.callTitle} ${agent.name}`}>
      <div className="bg-paper rounded-2xl border-2 border-brass w-full max-w-md p-5 text-center space-y-3">
        <p className="text-xs text-ink/60">{t.callTitle}</p>
        <h3 className="font-serif font-bold text-xl">{agent.name}</h3>
        <div className="py-2"><AgentFace src={agent.face} initial={agent.initial} size="xl" speaking={state === 'speaking'} listening={state === 'listening'} thinking={state === 'thinking'} /></div>
        <p className="text-sm" aria-live="polite">{status}</p>
        {!canListen && <p className="text-sm text-terracotta-dark">{t.noSpeech}</p>}
        {you && <p className="text-xs text-ink/70 text-left"><strong>{t.you} :</strong> {you}</p>}
        {reply && <p className="text-sm text-left max-h-32 overflow-y-auto whitespace-pre-wrap"><strong>{agent.name} :</strong> {reply}</p>}
        {err && <p className="text-sm text-terracotta-dark" role="status">{err}</p>}
        <div className="flex gap-2 justify-center">
          {canListen && (
            <button onClick={() => (state === 'listening' ? stopRef.current?.() : state === 'idle' ? turn() : undefined)}
              disabled={state === 'thinking' || state === 'speaking'}
              className="rounded-full bg-terracotta text-white px-5 py-2 text-sm disabled:opacity-40">
              🎤 {state === 'listening' ? t.micOff : t.micOn}
            </button>
          )}
          <button onClick={hang} className="rounded-full border border-ink/30 px-5 py-2 text-sm">{t.hangUp}</button>
        </div>
      </div>
    </div>
  )
}
