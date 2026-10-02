import { useState } from 'react'
import { agents, loadCustomAgents, saveCustomAgents, type CustomAgent } from './agents'
import AgentFace from './AgentFace'
import VoiceModal from './VoiceModal'
import CustomAgentModal from './CustomAgentModal'
import { acu } from './academy-i18n'
import { ui, type Lang } from './i18n'
import { canSpeak, speakSmart, voixIAActive, setVoixIA } from './voice'
import { askTutor } from './tutor'
import { leoAvatar, listEntreprises, listLeoAgents, type LeoAgent, type LeoEntreprise } from './leo'

export interface LessonCtx { title: string; code: string; output: string }

export default function AgentPanel({ lang, signedIn, ctx }: { lang: Lang; signedIn: boolean; ctx: LessonCtx }) {
  const t = ui[lang]
  const [agentId, setAgentId] = useState('finia')
  const [question, setQuestion] = useState('')
  const a = acu(lang)
  const [calling, setCalling] = useState(false)
  const [socratique, setSocratique] = useState(() => { try { return localStorage.getItem('learn:socratique') === '1' } catch { return false } })
  const [voixIA, setVoixIAState] = useState(voixIAActive)
  const [creating, setCreating] = useState(false)
  const [customs, setCustoms] = useState<CustomAgent[]>(loadCustomAgents)
  const [answer, setAnswer] = useState('')
  const [busy, setBusy] = useState(false)
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
    ...customs.map((c) => ({
      key: 'custom:' + c.id, name: c.name, role: c.role, personality: c.personality,
      face: c.face, initial: c.name[0], ready: true, custom: { name: c.name, personality: c.personality },
    })),
    ...leoAgents.map((a) => ({
      key: 'leo:' + a.id, name: a.nom, role: a.poste ?? 'Léo', personality: a.personnalite ?? '',
      face: leoAvatar(a.avatar_url), initial: a.emoji || a.nom[0], ready: true,
      custom: { name: a.nom, personality: a.personnalite ?? '' },
    })),
  ]
  const agent = cards.find((a) => a.key === agentId) ?? cards[0]

  const send = async (q = question) => {
    if (!q.trim() || busy) return
    setBusy(true); setAnswer('')
    const r = await askTutor({ question: q, code: ctx.code, lesson: ctx.title, output: ctx.output, lang, agentId, custom: agent.custom, socratique })
    const text = r.answer ?? (r.error === 'quota' ? t.quota : t.aiError)
    setAnswer(text); setBusy(false)
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
              <span className="shrink-0"><AgentFace src={a.face} initial={a.initial} size="sm" speaking={false} /></span>
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
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <button onClick={() => setCreating(true)} className="rounded-md border border-ink/30 px-3 py-1.5">+ {a.custom}</button>
        {agent.key.startsWith('custom:') && (
          <button className="underline text-xs" onClick={() => { const next = customs.filter((c) => 'custom:' + c.id !== agent.key); setCustoms(next); saveCustomAgents(next); setAgentId('finia') }}>{a.remove}</button>
        )}
      </div>
      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <input type="checkbox" checked={socratique} className="accent-[var(--color-terracotta)] size-4"
          onChange={(e) => { setSocratique(e.target.checked); try { localStorage.setItem('learn:socratique', e.target.checked ? '1' : '0') } catch { /* ignoré */ } }} />
        <span><strong>{a.socratic}</strong> — {a.socraticHelp}</span>
      </label>
      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <input type="checkbox" checked={voixIA} className="accent-[var(--color-terracotta)] size-4"
          onChange={(e) => { setVoixIAState(e.target.checked); setVoixIA(e.target.checked) }} />
        <span><strong>{a.voiceAI}</strong> — {a.voiceAIHelp}</span>
      </label>
      <p className="text-sm text-ink/70">{agent.personality}</p>
      <div className="flex flex-wrap sm:flex-nowrap gap-2">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && signedIn && !busy && question) { e.preventDefault(); void send() } }}
          placeholder={t.askPlaceholder.replace('{name}', agent.name)}
          className="basis-full sm:basis-auto flex-1 min-w-0 rounded-lg border border-ink/30 bg-white/60 px-3 py-2 text-sm"
          aria-label={t.ask}
        />
        <button onClick={() => setCalling(true)} disabled={!signedIn} className="rounded-md px-3 text-sm border border-ink/30 disabled:opacity-40">
          🎤 {t.call}
        </button>
        <button onClick={() => send()} disabled={!signedIn || busy || !question} className="rounded-md bg-terracotta text-white px-3 text-sm disabled:opacity-40">
          {t.send}
        </button>
      </div>
      {!signedIn && <p className="text-sm rounded-md bg-brass/15 border border-brass p-2">{t.needLogin}</p>}
      {(busy || answer) && (
        <div className="rounded-md bg-white/60 border border-ink/20 p-3 text-sm whitespace-pre-wrap" aria-live="polite">
          <strong>{agent.name} : </strong>{busy ? t.thinking : answer}
          {answer && canSpeak && <button className="ml-2 underline" onClick={() => speakSmart(answer, lang, () => {}, agent.key === 'ia' ? 'Puck' : 'Kore')}>🔊</button>}
        </div>
      )}
      {calling && (
        <VoiceModal lang={lang} agent={{ key: agent.key.includes(':') ? 'js' : agent.key, name: agent.name, face: agent.face, initial: agent.initial, custom: agent.custom }}
          lesson={ctx.title} code={ctx.code} onClose={() => setCalling(false)} />
      )}
      {creating && (
        <CustomAgentModal lang={lang} onClose={() => setCreating(false)}
          onSave={(c) => { const next = [...customs, c]; setCustoms(next); saveCustomAgents(next); setAgentId('custom:' + c.id); setCreating(false) }} />
      )}
    </section>
  )
}
