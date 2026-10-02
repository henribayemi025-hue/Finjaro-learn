import { lessons, type Lesson } from './lessons'
import { acu } from './academy-i18n'
import { TRACKS } from './tracks'
import { TRACK_ICON } from './Curriculum'
import type { Lang } from './i18n'

const T = {
  fr: { back: 'Accueil', lessons: 'leçons', done: 'réussies', cont: 'Continuer', start: 'Commencer', review: 'Revoir depuis le début', current: 'en cours' },
  en: { back: 'Home', lessons: 'lessons', done: 'passed', cont: 'Continue', start: 'Start', review: 'Review from the start', current: 'current' },
} as const

/** Page d'un parcours : sa progression et la liste de ses leçons, par section. */
export default function Parcours({ lang, k, done, current, onOpen, onBack }: { lang: Lang; k: string; done: string[]; current: string; onOpen: (i: number) => void; onBack: () => void }) {
  const t = T[lang]
  const tr = TRACKS.find((x) => x.key === k)!
  const desc = acu(lang).tracks[k as keyof ReturnType<typeof acu>['tracks']]?.[1] ?? ''
  const ls = lessons.map((l, i) => ({ l, i })).filter(({ l }) => tr.groups.includes(l.group ?? 'js'))
  const fait = ls.filter(({ l }) => done.includes(l.id)).length
  const pct = ls.length ? Math.round((fait / ls.length) * 100) : 0
  const next = ls.find(({ l }) => !done.includes(l.id)) ?? ls[0]
  const groupe = (l: Lesson) => l.group ?? 'js'

  return (
    <div className="space-y-5">
      <button className="btn px-3" onClick={onBack}>← {t.back}</button>
      <header className="card hero-glow p-5 sm:p-7 space-y-4 rise">
        <div className="flex items-center gap-4">
          <span aria-hidden="true" className="size-14 shrink-0 rounded-2xl grad grid place-items-center text-2xl shadow-md">{TRACK_ICON[k]}</span>
          <div className="min-w-0">
            <h2 className="font-display text-2xl sm:text-3xl leading-tight break-words">{tr.name[lang]}</h2>
            <p className="text-sm text-ink/65">{ls.length} {t.lessons} · {fait} {t.done}</p>
          </div>
        </div>
        <p className="text-ink/75">{desc}</p>
        <div className="h-2 rounded-full bg-ink/10 overflow-hidden" role="progressbar" aria-label={tr.name[lang]} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full grad rounded-full" style={{ width: pct + '%' }} />
        </div>
        {next && <button className="btn btn-primary px-6 py-3 text-base w-full sm:w-auto justify-start text-left" onClick={() => onOpen(next.i)}>▶ {fait === ls.length ? t.review : fait ? t.cont : t.start} : {next.l.title[lang]}</button>}
      </header>
      {tr.groups.map((g) => {
        const items = ls.filter(({ l }) => groupe(l) === g)
        if (!items.length) return null
        return (
          <section key={g} className="card p-3 sm:p-4">
            <h3 className="text-xs uppercase tracking-wider text-ink/55 font-bold px-2 pt-1 pb-2">{tr.groupName[g]?.[lang] ?? g}</h3>
            <ol className="space-y-1">
              {items.map(({ l, i }) => {
                const ok = done.includes(l.id)
                const n = ls.findIndex((x) => x.i === i) + 1
                return (
                  <li key={l.id}>
                    <button onClick={() => onOpen(i)} aria-current={l.id === current ? 'step' : undefined}
                      className={`w-full min-h-12 text-left rounded-xl px-3 py-2.5 flex items-center gap-3 ${l.id === current ? 'bg-terracotta/10 ring-1 ring-terracotta/40' : 'hover:bg-ink/5'}`}>
                      <span className={`shrink-0 size-7 rounded-full grid place-items-center text-xs font-bold ${ok ? 'grad text-white' : 'bg-ink/8 text-ink/60'}`}>{ok ? '✓' : n}</span>
                      <span className="flex-1 min-w-0 font-medium">{l.title[lang]}</span>
                      {l.id === current && <span className="chip shrink-0">{t.current}</span>}
                      <span aria-hidden="true" className="text-ink/40">›</span>
                    </button>
                  </li>
                )
              })}
            </ol>
          </section>
        )
      })}
    </div>
  )
}
