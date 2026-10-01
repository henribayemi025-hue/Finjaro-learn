import { useRef, useState } from 'react'
import { agents } from './agents'
import { ui, type Lang } from './i18n'
import { canListen, listen } from './voice'

/** Réponses du tuteur IA désactivées tant que la base commune n'est pas validée par Beau. */
const TUTOR_ENABLED = false

export default function AgentPanel({ lang }: { lang: Lang }) {
  const t = ui[lang]
  const [agentId, setAgentId] = useState('js')
  const [question, setQuestion] = useState('')
  const [listening, setListening] = useState(false)
  const stop = useRef<(() => void) | null>(null)
  const agent = agents.find((a) => a.id === agentId)!

  const toggleMic = () => {
    if (listening) { stop.current?.(); return }
    setListening(true)
    stop.current = listen(lang, (txt) => setQuestion(txt), () => setListening(false))
  }

  return (
    <section className="rounded-xl border-2 border-brass bg-paper p-3 space-y-3" aria-label={t.agents}>
      <h3 className="font-serif font-bold text-lg">{t.agents}</h3>
      <ul className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {agents.map((a) => (
          <li key={a.id}>
            <button
              disabled={!a.ready}
              onClick={() => setAgentId(a.id)}
              aria-pressed={a.id === agentId}
              className={`w-full h-full text-left rounded-lg border p-2 flex gap-2 items-center ${
                a.id === agentId ? 'border-terracotta bg-terracotta/10' : 'border-brass/50'
              } ${a.ready ? '' : 'opacity-50'}`}
            >
              {a.face ? (
                <img src={a.face} alt="" className="size-10 rounded-full object-cover shrink-0" />
              ) : (
                <span className="size-10 rounded-full bg-terracotta text-white grid place-items-center font-serif font-bold shrink-0">
                  {a.name[0]}
                </span>
              )}
              <span className="min-w-0">
                <span className="block font-semibold text-sm">{a.name}</span>
                <span className="block text-xs text-ink/70">{a.ready ? a.role[lang] : `${a.role[lang]} · ${t.soon}`}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      <p className="text-sm text-ink/70">{agent.personality[lang]}</p>
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
        <button disabled={!TUTOR_ENABLED || !question} className="rounded-md bg-terracotta text-white px-3 text-sm disabled:opacity-40">
          {t.send}
        </button>
      </div>
      {!TUTOR_ENABLED && <p className="text-sm rounded-md bg-brass/15 border border-brass p-2">{t.aiSoon}</p>}
    </section>
  )
}
