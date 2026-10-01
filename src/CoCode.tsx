import { useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react'
import { apply, prune, initial, HELLO_EVERY, type CoEvent, type CoState } from './coop'
import { lessons } from './lessons'
import { runLesson, type RunResult } from './runner'
import { ui, type Lang } from './i18n'

const T = {
  fr: { title: 'Coder ensemble', pilot: 'Pilote', here: 'Présents', pass: 'Passer la main', to: 'à…', go: 'Passer', watching: 'Tu suis (copilote) : seul le pilote écrit.',
    driving: 'Tu es le pilote : ce que tu écris est vu par tous.', lesson: 'Exercice', run: 'Lancer (chez toi)', output: 'Résultat', ok: 'Ça marche !', ko: 'Pas encore.', you: '(toi)' },
  en: { title: 'Code together', pilot: 'Driver', here: 'Present', pass: 'Pass the keyboard', to: 'to…', go: 'Pass', watching: 'You are following (copilot): only the driver types.',
    driving: 'You are the driver: everyone sees what you type.', lesson: 'Exercise', run: 'Run (locally)', output: 'Output', ok: 'It works!', ko: 'Not yet.', you: '(you)' },
} as const

/** Éditeur partagé en direct (pilote / copilote) sur le canal Realtime privé de l'espace. */
export default function CoCode({ lang, me, send, handlerRef }: {
  lang: Lang; me: { id: string; name: string }; send: (ev: CoEvent) => void; handlerRef: MutableRefObject<((ev: CoEvent) => void) | null>
}) {
  const t = T[lang], u = ui[lang]
  const first = lessons[0]
  const [s, setS] = useState<CoState>(() => initial(first.id, first.starter))
  const sRef = useRef(s)
  const [res, setRes] = useState<RunResult | null>(null)
  const [target, setTarget] = useState('')
  const sendTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const update = (fn: (x: CoState) => CoState) => setS((x) => { const n = fn(x); sRef.current = n; return n })
  const emit = (ev: CoEvent) => { update((x) => apply(x, ev, Date.now())); send(ev) }

  useEffect(() => {
    handlerRef.current = (ev) => {
      update((x) => apply(x, ev, Date.now()))
      // Un nouvel arrivant demande l'état : le pilote le lui donne.
      if (ev.t === 'hello' && ev.ask && sRef.current.pilot === me.id) {
        const c = sRef.current
        send({ t: 'state', from: me.id, pilot: c.pilot, lesson: c.lesson, code: c.code })
      }
    }
    const hello = (ask = false) => emit({ t: 'hello', from: me.id, name: me.name, ask })
    hello(true)
    // Personne n'a répondu : on prend la main (la plus petite identité gagne si plusieurs arrivent en même temps).
    const claim = setTimeout(() => { if (sRef.current.pilot === '') emit({ t: 'pilot', from: me.id, to: me.id, claim: true }) }, 1500)
    const beat = setInterval(() => { hello(); update((x) => prune(x, me.id, Date.now())) }, HELLO_EVERY)
    return () => { handlerRef.current = null; clearTimeout(claim); clearInterval(beat) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me.id, me.name])

  const iAmPilot = s.pilot === me.id
  const lesson = lessons.find((l) => l.id === s.lesson) ?? first
  const people = useMemo(() => Object.entries(s.members), [s.members])
  const nameOf = (id: string) => s.members[id]?.name ?? '…'

  const onType = (code: string) => {
    if (!iAmPilot) return
    update((x) => ({ ...x, code }))
    if (sendTimer.current) clearTimeout(sendTimer.current)
    sendTimer.current = setTimeout(() => send({ t: 'code', from: me.id, code, lesson: sRef.current.lesson }), 120)
  }
  const pickLesson = (id: string) => {
    const l = lessons.find((x) => x.id === id)!
    emit({ t: 'code', from: me.id, code: l.starter, lesson: id }); setRes(null)
  }

  return (
    <section className="rounded-xl border-2 border-brass bg-paper p-3 space-y-3" aria-label={t.title}>
      <h3 className="font-serif font-bold text-lg">{t.title}</h3>
      <div className="flex flex-wrap gap-2 items-center text-sm">
        <span className="font-medium">{t.pilot} : ✏️ {s.pilot ? nameOf(s.pilot) : '…'}{s.pilot === me.id ? ' ' + t.you : ''}</span>
        <span className="text-ink/60">· {t.here} : {people.map(([id, m]) => m.name + (id === me.id ? ' ' + t.you : '')).join(', ')}</span>
      </div>
      <p className="text-xs text-ink/70" aria-live="polite">{iAmPilot ? t.driving : t.watching}</p>
      <label className="text-sm block">{t.lesson}
        <select value={s.lesson} disabled={!iAmPilot} onChange={(e) => pickLesson(e.target.value)} className="ml-2 rounded-md border border-ink/30 bg-white/60 px-2 py-1 disabled:opacity-60">
          {lessons.map((l) => <option key={l.id} value={l.id}>{l.title[lang]}</option>)}
        </select>
      </label>
      <p className="text-sm font-medium text-terracotta-dark">{lesson.task[lang]}</p>
      <div className="grid gap-3 lg:grid-cols-2 items-start">
        <textarea value={s.code} readOnly={!iAmPilot} onChange={(e) => onType(e.target.value)} rows={8} spellCheck={false}
          aria-label={t.title} className={`w-full rounded-lg border p-3 font-mono text-sm ${iAmPilot ? 'border-terracotta bg-white/70' : 'border-ink/30 bg-paper'}`} />
        <div className="space-y-2 min-w-0">
          <button className="bg-terracotta text-white rounded-md px-4 py-2 text-sm" onClick={async () => setRes(await runLesson(lesson, s.code))}>{t.run}</button>
          {res && (
            <div aria-live="polite" className="space-y-1">
              <h4 className="text-sm font-semibold">{t.output}</h4>
              <pre className="rounded-lg bg-ink text-cream p-3 text-sm overflow-x-auto whitespace-pre-wrap font-mono">{res.output.length ? res.output.join('\n') : u.noOutput}</pre>
              {res.error && <p className="text-sm text-terracotta-dark">{u.error} {res.error}</p>}
              {res.passed === true && <p className="font-medium">✅ {t.ok}</p>}
              {res.passed === false && !res.error && <p className="text-terracotta-dark">{t.ko}</p>}
            </div>
          )}
        </div>
      </div>
      {iAmPilot && people.length > 1 && (
        <div className="flex gap-2 items-center flex-wrap">
          <select value={target} onChange={(e) => setTarget(e.target.value)} aria-label={t.pass} className="rounded-md border border-ink/30 bg-white/60 px-2 py-1.5 text-sm">
            <option value="">{t.to}</option>
            {people.filter(([id]) => id !== me.id).map(([id, m]) => <option key={id} value={id}>{m.name}</option>)}
          </select>
          <button disabled={!target} className="rounded-md border border-ink/30 px-3 py-1.5 text-sm disabled:opacity-40"
            onClick={() => { emit({ t: 'pilot', from: me.id, to: target }); setTarget('') }}>🤝 {t.pass}</button>
        </div>
      )}
    </section>
  )
}
