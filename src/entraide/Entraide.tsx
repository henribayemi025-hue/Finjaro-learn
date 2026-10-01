import { useCallback, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../supabase'
import { agents } from '../agents'
import type { Lang } from '../i18n'
import { eu } from './i18n'

interface Q { id: string; auteur_id: string; titre: string; corps: string; code: string | null; parcours: string; tags: string[]; meilleure_reponse_id: string | null; masquee: boolean; created_at: string }
interface R { id: string; auteur_id: string | null; agent_id: string | null; corps: string; code: string | null; masquee: boolean; created_at: string }
interface Stats { pseudo: string | null; reponses_donnees: number; reponses_retenues: number; questions_posees: number }

const inp = 'w-full rounded-md border border-ink/30 bg-white/60 px-2 py-1.5 text-sm'
const btn = 'rounded-md bg-terracotta text-white px-3 py-1.5 text-sm disabled:opacity-40'
const ghost = 'rounded-md border border-ink/30 px-3 py-1.5 text-sm'
const pre = 'rounded-lg bg-ink text-cream p-3 text-sm overflow-x-auto whitespace-pre-wrap font-mono'

export default function Entraide({ lang, session }: { lang: Lang; session: Session | null }) {
  const t = eu(lang)
  const [pseudos, setPseudos] = useState<Record<string, string>>({})
  const [me, setMe] = useState<Stats | null>(null)
  const [meLoaded, setMeLoaded] = useState(false)
  const [questions, setQuestions] = useState<Q[]>([])
  const [open, setOpen] = useState<Q | null>(null)
  const [asking, setAsking] = useState(false)
  const [note, setNote] = useState('')

  const loadPseudos = useCallback(async (ids: string[]) => {
    const need = ids.filter((i) => i && !(i in pseudos))
    if (!need.length || !supabase) return
    const { data } = await supabase.from('learn_profils').select('user_id,pseudo').in('user_id', need)
    setPseudos((p) => ({ ...p, ...Object.fromEntries((data ?? []).map((r) => [r.user_id as string, r.pseudo as string])) }))
  }, [pseudos])

  const loadMe = useCallback(async () => {
    if (!supabase || !session) return
    const { data } = await supabase.rpc('learn_entraide_profil', { p_user: session.user.id })
    setMe((data as Stats[] | null)?.[0] ?? null)
    setMeLoaded(true)
  }, [session])

  const loadQuestions = useCallback(async () => {
    if (!supabase || !session) return
    const { data } = await supabase.from('learn_entraide_questions').select('*').order('created_at', { ascending: false }).limit(50)
    const qs = (data ?? []) as Q[]
    setQuestions(qs)
    loadPseudos(qs.map((q) => q.auteur_id))
  }, [session, loadPseudos])

  useEffect(() => { loadMe(); loadQuestions() }, [loadMe, loadQuestions])

  if (!supabase) return null
  if (!session) return <p className="rounded-md bg-brass/15 border border-brass p-3 text-sm">{t.login}</p>

  // Pseudo obligatoire pour participer
  if (meLoaded && !me?.pseudo) return <PseudoForm lang={lang} userId={session.user.id} onDone={loadMe} />

  if (open) {
    return <Detail lang={lang} session={session} q={open} pseudos={pseudos} loadPseudos={loadPseudos}
      onBack={() => { setOpen(null); loadQuestions() }} onQ={setOpen} />
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <h2 className="text-xl font-bold flex-1">{t.title}</h2>
        <button className={btn} onClick={() => setAsking(!asking)}>{t.ask}</button>
      </div>
      {me && (
        <p className="text-sm rounded-md bg-paper border border-brass/50 p-2">
          <strong>{t.profile} ({me.pseudo})</strong> · {me.reponses_donnees} {t.given} · {me.reponses_retenues} {t.kept} · {me.questions_posees} {t.asked}
        </p>
      )}
      {note && <p className="text-sm text-terracotta-dark" role="status">{note}</p>}
      {asking && <AskForm lang={lang} onDone={(id) => { setAsking(false); loadQuestions(); loadMe(); void id }} onError={() => setNote(t.error)} />}
      {questions.length === 0 ? <p className="text-sm text-ink/70">{t.empty}</p> : (
        <ul className="space-y-2">
          {questions.map((q) => (
            <li key={q.id}>
              <button onClick={() => setOpen(q)} className="w-full text-left rounded-lg border border-brass/50 bg-paper p-3">
                <span className="font-serif font-bold">{q.titre}{q.masquee && ` (${t.hidden})`}</span>
                <span className="block text-xs text-ink/60">
                  {t.paths[q.parcours as keyof typeof t.paths] ?? q.parcours} · {t.by} {pseudos[q.auteur_id] ?? '…'}
                  {q.meilleure_reponse_id ? ' · ✓' : ''}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function PseudoForm({ lang, userId, onDone }: { lang: Lang; userId: string; onDone: () => void }) {
  const t = eu(lang)
  const [v, setV] = useState('')
  const [err, setErr] = useState(false)
  const save = async () => {
    const { error } = await supabase!.from('learn_profils').insert({ user_id: userId, pseudo: v.trim() })
    if (error) setErr(true); else onDone()
  }
  return (
    <div className="space-y-2 max-w-md">
      <h2 className="text-xl font-bold">{t.pseudoTitle}</h2>
      <p className="text-sm text-ink/70">{t.pseudoHelp}</p>
      <input value={v} onChange={(e) => setV(e.target.value)} maxLength={30} className={inp} aria-label={t.pseudoTitle} />
      {err && <p className="text-sm text-terracotta-dark" role="status">{t.pseudoTaken}</p>}
      <button className={btn} disabled={v.trim().length < 3} onClick={save}>{t.pseudoSave}</button>
    </div>
  )
}

function AskForm({ lang, onDone, onError }: { lang: Lang; onDone: (id: string) => void; onError: () => void }) {
  const t = eu(lang)
  const [titre, setTitre] = useState(''); const [corps, setCorps] = useState(''); const [code, setCode] = useState('')
  const [parcours, setParcours] = useState('programmation'); const [tags, setTags] = useState('')
  const publish = async () => {
    const list = tags.split(',').map((x) => x.trim()).filter(Boolean).slice(0, 5)
    const { data, error } = await supabase!.rpc('learn_entraide_poser', { p_titre: titre.trim(), p_corps: corps.trim(), p_code: code, p_parcours: parcours, p_tags: list })
    if (error) onError(); else onDone(data as string)
  }
  return (
    <div className="rounded-xl border-2 border-brass bg-paper p-3 space-y-2">
      <input value={titre} onChange={(e) => setTitre(e.target.value)} maxLength={150} placeholder={t.qTitle} aria-label={t.qTitle} className={inp} />
      <textarea value={corps} onChange={(e) => setCorps(e.target.value)} maxLength={4000} rows={4} placeholder={t.qBody} aria-label={t.qBody} className={inp} />
      <textarea value={code} onChange={(e) => setCode(e.target.value)} maxLength={20000} rows={4} spellCheck={false} placeholder={t.qCode} aria-label={t.qCode} className={inp + ' font-mono'} />
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="text-sm">{t.qPath}
          <select value={parcours} onChange={(e) => setParcours(e.target.value)} className={inp}>
            {Object.entries(t.paths).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
          </select>
        </label>
        <label className="text-sm">{t.qTags}<input value={tags} onChange={(e) => setTags(e.target.value)} className={inp} /></label>
      </div>
      <button className={btn} disabled={titre.trim().length < 3 || !corps.trim()} onClick={publish}>{t.publish}</button>
    </div>
  )
}

function Detail({ lang, session, q, pseudos, loadPseudos, onBack, onQ }: {
  lang: Lang; session: Session; q: Q; pseudos: Record<string, string>; loadPseudos: (ids: string[]) => void
  onBack: () => void; onQ: (q: Q) => void
}) {
  const t = eu(lang)
  const [rs, setRs] = useState<R[]>([])
  const [text, setText] = useState(''); const [code, setCode] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [reporting, setReporting] = useState<string | null>(null)
  const [reason, setReason] = useState('')
  const isAuthor = q.auteur_id === session.user.id

  const load = useCallback(async () => {
    const { data } = await supabase!.from('learn_entraide_reponses').select('*').eq('question_id', q.id).order('created_at')
    const list = (data ?? []) as R[]
    setRs(list)
    loadPseudos(list.map((r) => r.auteur_id ?? ''))
  }, [q.id, loadPseudos])
  useEffect(() => { load() }, [load])

  const reply = async () => {
    const { error } = await supabase!.rpc('learn_entraide_repondre', { p_question: q.id, p_corps: text.trim(), p_code: code })
    if (error) setNote(t.error); else { setText(''); setCode(''); setNote(''); load() }
  }
  const choose = async (rid: string) => {
    const { error } = await supabase!.rpc('learn_entraide_choisir', { p_question: q.id, p_reponse: rid })
    if (error) setNote(t.error); else onQ({ ...q, meilleure_reponse_id: rid })
  }
  const askAgent = async (agentId: string) => {
    setBusy(true); setNote('')
    const { error } = await supabase!.functions.invoke('learn-tutor', { body: { mode: 'entraide', question_id: q.id, agent: { id: agentId }, lang } })
    setBusy(false)
    if (error) setNote((error as { context?: Response }).context?.status === 429 ? t.quota : t.error); else load()
  }
  const sendReport = async (type: 'question' | 'reponse', id: string) => {
    const { error } = await supabase!.rpc('learn_entraide_signaler', { p_type: type, p_cible: id, p_motif: reason.trim() || '—' })
    setNote(error ? t.error : t.reported); setReporting(null); setReason('')
  }

  const reportUi = (type: 'question' | 'reponse', id: string) => reporting === id ? (
    <span className="flex gap-1 items-center">
      <input value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} placeholder={t.reportReason} aria-label={t.reportReason} className={inp + ' !w-40'} />
      <button className={ghost} onClick={() => sendReport(type, id)}>{t.report}</button>
    </span>
  ) : <button className="text-xs underline" onClick={() => setReporting(id)}>{t.report}</button>

  return (
    <div className="space-y-3">
      <button className="text-sm underline" onClick={onBack}>{t.back}</button>
      <article className="rounded-xl border-2 border-brass bg-paper p-3 space-y-2">
        <h2 className="text-xl font-bold">{q.titre}</h2>
        <p className="text-xs text-ink/60">{t.by} {pseudos[q.auteur_id] ?? '…'} · {t.paths[q.parcours as keyof typeof t.paths] ?? q.parcours}{q.tags.length ? ' · ' + q.tags.join(', ') : ''}</p>
        <p className="text-sm whitespace-pre-wrap">{q.corps}</p>
        {q.code && <pre className={pre}>{q.code}</pre>}
        {reportUi('question', q.id)}
      </article>
      <h3 className="font-semibold">{t.answers}</h3>
      {rs.length === 0 && <p className="text-sm text-ink/60">{t.noAnswers}</p>}
      <ul className="space-y-2">
        {rs.map((r) => {
          const ag = r.agent_id ? agents.find((a) => a.id === r.agent_id) : null
          const best = q.meilleure_reponse_id === r.id
          return (
            <li key={r.id} className={`rounded-lg border p-3 space-y-1 ${best ? 'border-terracotta bg-terracotta/10' : 'border-brass/50 bg-paper'}`}>
              <p className="text-xs text-ink/60">
                {r.agent_id ? <><strong>{ag?.name ?? r.agent_id}</strong> · <em>{t.agent}</em></> : <strong>{pseudos[r.auteur_id ?? ''] ?? '…'}</strong>}
                {best && ` · ✓ ${t.best}`}
              </p>
              <p className="text-sm whitespace-pre-wrap">{r.corps}</p>
              {r.code && <pre className={pre}>{r.code}</pre>}
              <div className="flex gap-3 items-center">
                {isAuthor && !best && <button className="text-xs underline" onClick={() => choose(r.id)}>{t.choose}</button>}
                {reportUi('reponse', r.id)}
              </div>
            </li>
          )
        })}
      </ul>
      {note && <p className="text-sm text-terracotta-dark" role="status">{note}</p>}
      <div className="rounded-xl border border-ink/20 p-3 space-y-2">
        <textarea value={text} onChange={(e) => setText(e.target.value)} maxLength={4000} rows={3} placeholder={t.yourAnswer} aria-label={t.yourAnswer} className={inp} />
        <textarea value={code} onChange={(e) => setCode(e.target.value)} maxLength={20000} rows={3} spellCheck={false} placeholder={t.qCode} aria-label={t.qCode} className={inp + ' font-mono'} />
        <div className="flex gap-2 flex-wrap">
          <button className={btn} disabled={!text.trim()} onClick={reply}>{t.answer}</button>
          {agents.filter((a) => a.ready).map((a) => (
            <button key={a.id} className={ghost} disabled={busy} onClick={() => askAgent(a.id)}>{t.askAgent} · {a.name}</button>
          ))}
        </div>
      </div>
    </div>
  )
}
