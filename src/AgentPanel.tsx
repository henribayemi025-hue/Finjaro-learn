import { useRef, useState } from 'react'
import { agents } from './agents'
import { ui, type Lang } from './i18n'
import { canListen, canSpeak, listen, speak } from './voice'
import { askTutor } from './tutor'
import { leoAvatar, listEntreprises, listLeoAgents, type LeoAgent, type LeoEntreprise } from './leo'

export interface LessonCtx { title: string; code: string; output: string }

export default function AgentPanel({ lang, signedIn, ctx }: { lang: Lang; signedIn: boolean; ctx: LessonCtx }) {
  const t = ui[lang]
  const [agentId, setAgentId] = useState('js')
  const [question, setQuestion] = useState('')
  const [listening, setListening] = useState(false)
  const stop = useRef<(() => void) | null>(null)
  const [answer, setAnswer] = useState('')
  const [busy, setBusy] = useState(false)
  const [voiceOn, setVoiceOn] = useState(false)
  const [entreprises, setEntreprises] = useState<LeoEntreprise[] | null>(null)
  const [leoAgents, setLeoAgents] = useState<LeoAgent[]>([])
  const [leoNote, setLeoNote] = useState('')
  const connectLeo = async () => {
    const e = await listEntreprises()
    setEntreprises(e)
    setLeoNote(e.length ? '' : t.leoNone)
  }
  const pickEntreprise = async (id: string) => {
    const a = await listLeoAgents(id)
    setLeoAgents(a)
    if (a[0]) setAgentId('leo:' + a[0].id)
  }
  const cards = [
    ...agents.map((a) => ({
      key: a.id, name: a.name, role: a.role[lang] + (a.ready ? '' : ` · ${t.soon}`), personality: a.personality[lang],
      face: a.face, initial: a.name[0], ready: a.ready, custom: undefined as undefined | { name: string; personality: string },
    })),
    ...leoAgents.map((a) => ({
      key: 'leo:' + a.id, name: a.nom, role: a.poste ?? 'Léo', personality: a.personnalite ?? '',
      face: leoAvatar(a.avatar_url), initial: a.emoji || a.nom[0], ready: true,
      custom: { name: a.nom, personality: a.personnalite ?? '' },
    })),
  ]
  const agent = cards.find((a) => a.key === agentId) ?? cards[0]

  const toggleMic = () => {
    if (listening) { stop.current?.(); return }
    setListening(true)
    stop.current = listen(lang, (txt) => { setQuestion(txt); setVoiceOn(true); send(txt) }, () => setListening(false))
  }

  const send = async (q = question) => {
    if (!q.trim() || busy) return
    setBusy(true); setAnswer('')
    const r = await askTutor({ question: q, code: ctx.code, lesson: ctx.title, output: ctx.output, lang, agentId, custom: agent.custom })
    const text = r.answer ?? (r.error === 'quota' ? t.quota : t.aiError)
    setAnswer(text); setBusy(false)
    if (r.answer && voiceOn) speak(r.answer, lang)
  }

  return (
    <section className="rounded-xl border-2 border-brass bg-paper p-3 space-y-3" aria-label={t.agents}>
      <h3 className="font-serif font-bold text-lg">{t.agents}</h3>
      <ul className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {cards.map((a) => (
          <li key={a.key}>
            <button
              disabled={!a.ready}
              onClick={() => setAgentId(a.key)}
              aria-pressed={a.key === agent.key}
              className={`w-full h-full text-left rounded-lg border p-2 flex gap-2 items-center ${
                a.key === agent.key ? 'border-terracotta bg-terracotta/10' : 'border-brass/50'
              } ${a.ready ? '' : 'opacity-50'}`}
            >
              {a.face ? (
                <img src={a.face} alt="" className="size-10 rounded-full object-cover shrink-0" />
              ) : (
                <span className="size-10 rounded-full bg-terracotta text-white grid place-items-center font-serif font-bold shrink-0">
                  {a.initial}
                </span>
              )}
              <span className="min-w-0">
                <span className="block font-semibold text-sm">{a.name}</span>
                <span className="block text-xs text-ink/70">{a.role}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      {signedIn && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {entreprises === null ? (
            <button onClick={connectLeo} className="rounded-md border border-ink/30 px-3 py-1.5">{t.leoConnect}</button>
          ) : entreprises.length > 0 ? (
            <label className="flex items-center gap-2">{t.leoPick}
              <select defaultValue="" onChange={(e) => e.target.value && pickEntreprise(e.target.value)} className="rounded-md border border-ink/30 bg-white/60 px-2 py-1">
                <option value="" disabled>—</option>
                {entreprises.map((e) => <option key={e.id} value={e.id}>{e.nom}</option>)}
              </select>
            </label>
          ) : null}
          {leoNote && <span className="text-ink/70">{leoNote}</span>}
        </div>
      )}
      <p className="text-sm text-ink/70">{agent.personality}</p>
      <div className="flex gap-2">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={t.askPlaceholder.replace('{name}', agent.name)}
          className="flex-1 min-w-0 rounded-lg border border-ink/30 bg-white/60 px-3 py-2 text-sm"
          aria-label={t.ask}
        />
        {canListen && (
          <button
            onClick={toggleMic}
            aria-pressed={listening}
            className={`rounded-md px-3 text-sm border ${listening ? 'bg-terracotta text-white border-terracotta' : 'border-ink/30'}`}
          >
            🎤 {listening ? t.listening : t.call}
          </button>
        )}
        <button onClick={() => { setVoiceOn(false); send() }} disabled={!signedIn || busy || !question} className="rounded-md bg-terracotta text-white px-3 text-sm disabled:opacity-40">
          {t.send}
        </button>
      </div>
      {!signedIn && <p className="text-sm rounded-md bg-brass/15 border border-brass p-2">{t.needLogin}</p>}
      {(busy || answer) && (
        <div className="rounded-md bg-white/60 border border-ink/20 p-3 text-sm whitespace-pre-wrap" aria-live="polite">
          <strong>{agent.name} : </strong>{busy ? t.thinking : answer}
          {answer && canSpeak && <button className="ml-2 underline" onClick={() => speak(answer, lang)}>🔊</button>}
        </div>
      )}
    </section>
  )
}
