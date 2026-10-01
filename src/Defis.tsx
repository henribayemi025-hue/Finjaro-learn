import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabase'
import { lessons } from './lessons'
import { runCode } from './runner'
import type { Lang } from './i18n'

const T = {
  fr: {
    title: 'Défis du groupe', none: 'Aucun défi pour l’instant.', launch: 'Lancer un défi', pick: 'Exercice', go: 'Lancer',
    back: '← Défis', task: 'Même exercice pour tous. Chacun résout seul ; les solutions des autres se découvrent après avoir rendu la sienne.',
    run: 'Essayer', submit: 'Rendre ma solution', resubmit: 'Mettre à jour ma solution', done: 'Solution rendue.',
    others: 'Solutions du groupe', declared: 'réussi (déclaré par la personne)', notDeclared: 'pas réussi (déclaré)', yours: '(toi)',
    count: 'solution(s) rendue(s)', locked: 'Rends ta solution pour voir celles du groupe.', error: 'Action impossible.',
    note: 'Le « réussi » est déclaré par chacun : ce n’est pas une note officielle.', ok: 'Ça marche !', ko: 'Pas encore.',
  },
  en: {
    title: 'Group challenges', none: 'No challenge yet.', launch: 'Start a challenge', pick: 'Exercise', go: 'Start',
    back: '← Challenges', task: 'Same exercise for everyone. Each person solves alone; others’ solutions unlock after you submit yours.',
    run: 'Try', submit: 'Submit my solution', resubmit: 'Update my solution', done: 'Solution submitted.',
    others: 'Group solutions', declared: 'passed (self-declared)', notDeclared: 'not passed (self-declared)', yours: '(you)',
    count: 'solution(s) submitted', locked: 'Submit your solution to see the group’s.', error: 'Not possible.',
    note: '“Passed” is self-declared: it is not an official grade.', ok: 'It works!', ko: 'Not yet.',
  },
} as const

interface Defi { id: string; lesson_id: string; created_at: string }
interface Sol { user_id: string; code: string; passed: boolean }

const btn = 'rounded-md bg-terracotta text-white px-3 py-1.5 text-sm disabled:opacity-40'
const ghost = 'rounded-md border border-ink/30 px-3 py-1.5 text-sm'
const pre = 'rounded-lg bg-ink text-cream p-3 text-sm overflow-x-auto whitespace-pre-wrap font-mono'

export default function Defis({ lang, userId, espaceId }: { lang: Lang; userId: string; espaceId: string }) {
  const t = T[lang]
  const [defis, setDefis] = useState<Defi[]>([])
  const [open, setOpen] = useState<Defi | null>(null)
  const [isHost, setIsHost] = useState(false)
  const [pick, setPick] = useState(lessons[0].id)
  const [note, setNote] = useState('')

  const load = useCallback(async () => {
    const { data } = await supabase!.from('learn_defis').select('id,lesson_id,created_at').eq('espace_id', espaceId).order('created_at', { ascending: false })
    setDefis((data ?? []) as Defi[])
  }, [espaceId])

  useEffect(() => {
    load()
    supabase!.from('learn_membres').select('role').eq('espace_id', espaceId).eq('user_id', userId).maybeSingle()
      .then(({ data }) => setIsHost(data?.role === 'animateur'))
  }, [load, espaceId, userId])

  const launch = async () => {
    const { error } = await supabase!.from('learn_defis').insert({ espace_id: espaceId, lesson_id: pick, created_by: userId })
    if (error) setNote(t.error); else { setNote(''); load() }
  }

  if (open) return <Defi lang={lang} userId={userId} espaceId={espaceId} defi={open} onBack={() => setOpen(null)} />

  return (
    <section className="rounded-xl border-2 border-brass bg-paper p-3 space-y-3" aria-label={t.title}>
      <h3 className="font-serif font-bold text-lg">{t.title}</h3>
      {isHost && (
        <div className="flex gap-2 items-center flex-wrap">
          <label className="text-sm">{t.pick}
            <select value={pick} onChange={(e) => setPick(e.target.value)} className="ml-2 rounded-md border border-ink/30 bg-white/60 px-2 py-1">
              {lessons.map((l) => <option key={l.id} value={l.id}>{l.title[lang]}</option>)}
            </select>
          </label>
          <button className={btn} onClick={launch}>{t.launch}</button>
        </div>
      )}
      {note && <p className="text-sm text-terracotta-dark" role="status">{note}</p>}
      {defis.length === 0 ? <p className="text-sm text-ink/60">{t.none}</p> : (
        <ul className="grid gap-2 sm:grid-cols-2">
          {defis.map((d) => {
            const l = lessons.find((x) => x.id === d.lesson_id)
            return (
              <li key={d.id}>
                <button onClick={() => setOpen(d)} className="w-full text-left rounded-lg border border-brass/50 bg-white/50 p-3">
                  <span className="font-semibold">{l?.title[lang] ?? d.lesson_id}</span>
                  <span className="block text-xs text-ink/60">{new Date(d.created_at).toLocaleDateString(lang)}</span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

function Defi({ lang, userId, espaceId, defi, onBack }: { lang: Lang; userId: string; espaceId: string; defi: Defi; onBack: () => void }) {
  const t = T[lang]
  const lesson = lessons.find((l) => l.id === defi.lesson_id) ?? lessons[0]
  const [code, setCode] = useState(lesson.starter)
  const [passed, setPassed] = useState<boolean | null>(null)
  const [out, setOut] = useState('')
  const [mine, setMine] = useState<Sol | null>(null)
  const [sols, setSols] = useState<Sol[]>([])
  const [names, setNames] = useState<Record<string, string>>({})
  const [msg, setMsg] = useState('')

  // La base ne renvoie les solutions des autres qu'une fois la sienne rendue (RLS).
  const load = useCallback(async () => {
    const { data } = await supabase!.from('learn_solutions').select('user_id,code,passed').eq('defi_id', defi.id)
    const list = (data ?? []) as Sol[]
    setSols(list)
    const m = list.find((s) => s.user_id === userId) ?? null
    setMine(m)
    if (m) setCode((c) => (c === lesson.starter ? m.code : c))
    const ids = list.map((s) => s.user_id)
    if (ids.length) {
      const { data: ps } = await supabase!.from('learn_profils').select('user_id,pseudo').in('user_id', ids)
      setNames(Object.fromEntries((ps ?? []).map((p) => [p.user_id as string, p.pseudo as string])))
    }
  }, [defi.id, userId, lesson.starter])
  useEffect(() => { load() }, [load])

  const run = async () => {
    const r = await runCode(code, lesson.checks)
    setPassed(r.passed === true); setOut(r.error ? `${r.error}` : r.output.join('\n'))
    return r.passed === true
  }

  const submit = async () => {
    const ok = await run()
    let error = null
    if (mine) {
      ;({ error } = await supabase!.from('learn_solutions').update({ code, passed: ok }).eq('defi_id', defi.id).eq('user_id', userId))
    } else {
      ;({ error } = await supabase!.from('learn_solutions').insert({ defi_id: defi.id, espace_id: espaceId, user_id: userId, code, passed: ok }))
    }
    setMsg(error ? t.error : t.done)
    if (!error) load()
  }

  return (
    <section className="rounded-xl border-2 border-brass bg-paper p-3 space-y-3">
      <button className="text-sm underline" onClick={onBack}>{t.back}</button>
      <h3 className="font-serif font-bold text-lg">{lesson.title[lang]}</h3>
      <p className="text-sm font-medium text-terracotta-dark">{lesson.task[lang]}</p>
      <p className="text-xs text-ink/60">{t.task}</p>
      <div className="grid gap-3 lg:grid-cols-2 items-start">
        <textarea value={code} onChange={(e) => setCode(e.target.value)} rows={8} spellCheck={false} aria-label={lesson.title[lang]}
          className="w-full rounded-lg border border-ink/30 bg-white/70 p-3 font-mono text-sm" />
        <div className="space-y-2 min-w-0">
          <div className="flex gap-2 flex-wrap">
            <button className={ghost} onClick={run}>{t.run}</button>
            <button className={btn} onClick={submit}>{mine ? t.resubmit : t.submit}</button>
          </div>
          {passed !== null && <p className="text-sm">{passed ? `✅ ${t.ok}` : t.ko}</p>}
          {out && <pre className={pre}>{out}</pre>}
          {msg && <p className="text-sm" role="status">{msg}</p>}
        </div>
      </div>
      <div className="space-y-2">
        <h4 className="font-semibold text-sm">{t.others}{mine ? ` · ${sols.length} ${t.count}` : ''}</h4>
        {!mine ? <p className="text-sm text-ink/60">{t.locked}</p> : (
          <ul className="space-y-2">
            {sols.map((s) => (
              <li key={s.user_id} className="rounded-lg border border-brass/50 bg-white/50 p-2 space-y-1">
                <p className="text-xs text-ink/70">
                  <strong>{names[s.user_id] ?? '…'}</strong>{s.user_id === userId ? ` ${t.yours}` : ''} · {s.passed ? t.declared : t.notDeclared}
                </p>
                <pre className={pre}>{s.code}</pre>
              </li>
            ))}
          </ul>
        )}
        <p className="text-xs text-ink/50">{t.note}</p>
      </div>
    </section>
  )
}
