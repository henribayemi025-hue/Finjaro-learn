import { useEffect, useMemo, useState } from 'react'
import { lessons, type Lesson } from './lessons'
import { acu } from './academy-i18n'
import { TRACKS } from './tracks'
import { TRACK_ICON } from './Curriculum'
import type { Lang } from './i18n'
import { chargerIndex, type Numero } from './Lettre'

type Niveau = 'debutant' | 'intermediaire' | 'avance'
/** Niveau conseillé de chaque parcours (une indication de difficulté, pas une note). */
const NIVEAU: Record<string, Niveau> = {
  projets: 'debutant', prog: 'debutant', prompt: 'debutant',
  data: 'intermediaire', dl: 'intermediaire', maths: 'intermediaire', crypto: 'intermediaire', archi: 'intermediaire', ccpp: 'intermediaire', robo: 'intermediaire', outils: 'intermediaire',
  eng: 'avance', algo: 'avance', quant: 'avance', compil: 'avance', nlp: 'avance',
}
/** Projets phares : de vraies leçons de Learn. */
const CLES = [
  { id: 'dl-xor', ico: '🧠', fr: 'Réseau de neurones', en: 'Neural network' },
  { id: 'ai-projet-rag', ico: '📚', fr: 'Assistant RAG', en: 'RAG assistant' },
  { id: 'archi-cpu', ico: '🔌', fr: 'Mini-processeur', en: 'Tiny processor' },
  { id: 'crypto-rsa', ico: '🔐', fr: 'Cryptographie RSA', en: 'RSA cryptography' },
]

const T = {
  fr: {
    resume: 'Reprendre la leçon', chrono: 'Défi chrono', projets: 'Projets guidés', lesson: 'Leçon', global: 'Progression globale', done: 'réussies',
    key: 'Projet clé', search: 'Rechercher une notion, un code, un algo…', all: 'Tous', debutant: 'Débutant', intermediaire: 'Intermédiaire', avance: 'Avancé',
    lessons: 'leçons', verified: 'Progression vérifiée', cont: 'Continuer', start: 'Commencer', review: 'Revoir', none: 'Aucune leçon ne correspond.', tracks: 'Tes parcours',
  },
  en: {
    resume: 'Resume the lesson', chrono: 'Speed challenge', projets: 'Guided projects', lesson: 'Lesson', global: 'Overall progress', done: 'passed',
    key: 'Key project', search: 'Search a concept, some code, an algorithm…', all: 'All', debutant: 'Beginner', intermediaire: 'Intermediate', avance: 'Advanced',
    lessons: 'lessons', verified: 'Verified progress', cont: 'Continue', start: 'Start', review: 'Review', none: 'No lesson matches.', tracks: 'Your tracks',
  },
} as const

const sansAccents = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
const trackOf = (l: Lesson) => TRACKS.find((tr) => tr.groups.includes(l.group ?? 'js'))?.key ?? 'prog'

/** Petit réseau décoratif (pas une donnée). */
function MiniReseau() {
  const a = [[24, 30], [24, 70]], b = [[100, 22], [100, 50], [100, 78]], c = [[176, 50]]
  return (
    <svg viewBox="0 0 200 100" className="w-full h-20" aria-hidden="true">
      {a.flatMap(([x1, y1]) => b.map(([x2, y2]) => <line key={`${x1}${y1}${x2}${y2}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--color-terracotta)" strokeOpacity=".35" />))}
      {b.map(([x1, y1]) => <line key={`o${y1}`} x1={x1} y1={y1} x2={176} y2={50} stroke="var(--color-amber)" strokeOpacity=".5" />)}
      {[...a, ...b, ...c].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="9" fill="var(--color-paper)" stroke={i >= 5 ? 'var(--color-amber)' : 'var(--color-terracotta)'} strokeWidth="2.5" />)}
    </svg>
  )
}

export default function Accueil({ lang, done, idx, onOpen, onResume, onChrono, onLettre }: {
  lang: Lang; done: string[]; idx: number
  onOpen: (i: number) => void; onResume: () => void; onChrono: () => void; onLettre: () => void
}) {
  const [dernier, setDernier] = useState<Numero | null>(null)
  useEffect(() => { chargerIndex().then((l) => setDernier(l[0] ?? null)).catch(() => { /* pas de lettre : la carte reste discrète */ }) }, [])
  const t = T[lang]
  const a = acu(lang)
  const [q, setQ] = useState('')
  const [niv, setNiv] = useState<'' | Niveau>('')
  const lesson = lessons[idx]
  const tr = TRACKS.find((x) => x.key === trackOf(lesson))!
  const mine = lessons.filter((l) => trackOf(l) === tr.key)
  const pos = mine.findIndex((l) => l.id === lesson.id) + 1
  const pct = Math.round((done.length / lessons.length) * 100)
  const resultats = useMemo(() => {
    const s = sansAccents(q.trim())
    if (s.length < 2) return []
    return lessons.map((l, i) => ({ l, i })).filter(({ l }) => sansAccents(l.title[lang] + ' ' + l.title.en).includes(s)).slice(0, 12)
  }, [q, lang])

  return (
    <div className="space-y-6">
      {/* Reprendre la leçon */}
      <section className="card hero-glow relative overflow-hidden p-5 sm:p-8 rise">
        <div className="relative grid gap-6 lg:grid-cols-[1fr_300px] items-center">
          <div className="min-w-0 space-y-3">
            <p className="text-xs font-mono font-semibold uppercase tracking-[.18em] text-terracotta-dark flex items-center gap-2">
              <span className="size-2 rounded-full bg-terracotta animate-pulse" aria-hidden="true" />{TRACK_ICON[tr.key]} {tr.name[lang]}
            </p>
            <h2 className="font-display text-3xl sm:text-4xl leading-[1.1]">{t.lesson} {pos} : {lesson.title[lang]}</h2>
            <p className="text-ink/65 line-clamp-2 max-w-2xl">{lesson.explain[lang]}</p>
            <div className="max-w-md">
              <div className="flex justify-between text-sm font-semibold mb-1.5"><span>{t.global}</span><span className="font-mono text-terracotta-dark">{done.length}/{lessons.length} {t.done}</span></div>
              <div className="h-2 rounded-full bg-ink/10 overflow-hidden" role="progressbar" aria-label={t.global} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                <div className="h-full grad rounded-full" style={{ width: pct + '%' }} />
              </div>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <button className="btn btn-primary text-base px-6 py-3.5" onClick={onResume}>▶ {t.resume} →</button>
              <button className="btn px-4" onClick={onChrono}>⚡ {t.chrono}</button>
              <button className="btn px-4" onClick={() => { const i = lessons.findIndex((l) => trackOf(l) === 'projets' && !done.includes(l.id)); onOpen(i >= 0 ? i : lessons.findIndex((l) => trackOf(l) === 'projets')) }}>🏗️ {t.projets}</button>
            </div>
          </div>
          <div className="hidden lg:block rounded-2xl border border-brass bg-cream/60 p-4">
            <p className="text-xs font-mono text-ink/60 mb-1">{tr.name[lang]}</p>
            <MiniReseau />
          </div>
        </div>
      </section>

      {/* La Lettre de l'IA */}
      <button onClick={onLettre} className="card w-full p-4 text-left flex items-center gap-4 hover:-translate-y-0.5 transition">
        <span aria-hidden="true" className="size-12 shrink-0 rounded-2xl grad grid place-items-center text-2xl shadow-md">📰</span>
        <span className="min-w-0 flex-1">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-terracotta-dark">{lang === 'fr' ? 'Chaque matin' : 'Every morning'}</span>
          <span className="block font-display text-lg leading-tight">{lang === 'fr' ? 'La Lettre de l’IA' : 'The AI Letter'}</span>
          {dernier && <span className="block text-sm text-ink/65 truncate">{dernier.titre}</span>}
        </span>
        <span aria-hidden="true" className="text-terracotta-dark font-bold">→</span>
      </button>

      {/* Projets clés */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        {CLES.map((c) => {
          const i = lessons.findIndex((l) => l.id === c.id)
          if (i < 0) return null
          return (
            <button key={c.id} onClick={() => onOpen(i)} className="card p-3 text-left flex items-center gap-3 hover:-translate-y-0.5 transition">
              <span aria-hidden="true" className="size-10 shrink-0 rounded-xl bg-terracotta/12 grid place-items-center text-lg">{c.ico}</span>
              <span className="min-w-0">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-ink/50">{t.key}{done.includes(c.id) ? ' · ✓' : ''}</span>
                <span className="block text-sm font-bold truncate">{c[lang]}</span>
              </span>
            </button>
          )
        })}
      </section>

      {/* Recherche + niveaux */}
      <section className="flex flex-col sm:flex-row gap-2">
        <label className="flex-1 relative">
          <span className="sr-only">{t.search}</span>
          <span aria-hidden="true" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/45">⌕</span>
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.search}
            className="w-full min-h-12 rounded-2xl border border-brass pl-10 pr-4 text-sm" />
        </label>
        <div role="group" aria-label="niveau" className="flex gap-1 rounded-2xl border border-brass bg-paper p-1 overflow-x-auto">
          {(['', 'debutant', 'intermediaire', 'avance'] as const).map((n) => (
            <button key={n || 'tous'} aria-pressed={niv === n} onClick={() => setNiv(n)}
              className={`shrink-0 min-h-10 rounded-xl px-3 text-sm font-semibold ${niv === n ? 'grad text-white' : 'text-ink/70 hover:text-ink'}`}>{n ? t[n] : t.all}</button>
          ))}
        </div>
      </section>
      {q.trim().length >= 2 && (
        <ul className="card divide-y divide-brass/60 overflow-hidden" aria-live="polite">
          {resultats.length === 0 && <li className="p-4 text-sm text-ink/60">{t.none}</li>}
          {resultats.map(({ l, i }) => (
            <li key={l.id}>
              <button className="w-full min-h-11 text-left px-4 py-2.5 hover:bg-terracotta/8 flex items-center gap-3 text-sm" onClick={() => { setQ(''); onOpen(i) }}>
                <span aria-hidden="true">{TRACK_ICON[trackOf(l)]}</span>
                <span className="flex-1 min-w-0 font-medium">{l.title[lang]}</span>
                {done.includes(l.id) && <span className="text-terracotta-dark font-bold" aria-label="✓">✓</span>}
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Parcours */}
      <section>
        <h2 className="font-display text-xl mb-3">{t.tracks} <span className="text-sm font-sans text-ink/50">({TRACKS.filter((x) => !niv || NIVEAU[x.key] === niv).length})</span></h2>
        <ul className="flex md:grid md:grid-cols-2 xl:grid-cols-3 gap-3 overflow-x-auto md:overflow-visible snap-x -mx-4 px-4 md:mx-0 md:px-0 pb-2">
          {TRACKS.filter((x) => !niv || NIVEAU[x.key] === niv).map(({ key, name }) => {
            const ls = lessons.map((l, i) => ({ l, i })).filter(({ l }) => trackOf(l) === key)
            const fait = ls.filter(({ l }) => done.includes(l.id)).length
            const p = ls.length ? Math.round((fait / ls.length) * 100) : 0
            const desc = a.tracks[key as keyof typeof a.tracks]?.[1] ?? ''
            const suivantes = [...ls.filter(({ l }) => !done.includes(l.id)), ...ls.filter(({ l }) => done.includes(l.id))].slice(0, 2)
            const next = ls.find(({ l }) => !done.includes(l.id)) ?? ls[0]
            return (
              <li key={key} className="snap-start shrink-0 w-[85%] sm:w-[60%] md:w-auto">
                <div className="card h-full p-4 sm:p-5 flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <span aria-hidden="true" className="size-12 shrink-0 rounded-2xl grad grid place-items-center text-xl shadow-md">{TRACK_ICON[key]}</span>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-display text-lg leading-tight">{name[lang]}</h3>
                      <p className="text-xs text-ink/60 mt-1 flex flex-wrap gap-x-2 items-center">
                        <span>{ls.length} {t.lessons}</span><span aria-hidden="true">·</span>
                        <span className="uppercase tracking-wide font-semibold text-[10px] rounded-md bg-ink/6 px-1.5 py-0.5">{t[NIVEAU[key] ?? 'intermediaire']}</span>
                      </p>
                    </div>
                    {fait > 0 && <span className="chip shrink-0">✓ {fait}/{ls.length}</span>}
                  </div>
                  <p className="text-sm text-ink/70 line-clamp-2">{desc}</p>
                  <div>
                    <div className="flex justify-between text-xs mb-1"><span className="text-ink/60">{t.verified}</span><span className="font-bold">{p}%</span></div>
                    <div className="h-1.5 rounded-full bg-ink/10 overflow-hidden"><div className="h-full grad rounded-full" style={{ width: p + '%' }} /></div>
                  </div>
                  <ul className="space-y-1">
                    {suivantes.map(({ l, i }) => (
                      <li key={l.id}>
                        <button onClick={() => onOpen(i)} className={`w-full min-h-11 text-left rounded-xl px-3 py-2 text-sm flex items-center gap-2 ${done.includes(l.id) ? 'bg-[color-mix(in_srgb,#22c55e_10%,transparent)]' : 'hover:bg-ink/5'}`}>
                          <span aria-hidden="true" className={`size-4 shrink-0 rounded-full border-2 ${done.includes(l.id) ? 'bg-[#22c55e] border-[#22c55e]' : 'border-ink/30'}`} />
                          <span className="truncate">{l.title[lang]}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                  <button onClick={() => next && onOpen(next.i)} className="btn mt-auto w-full bg-terracotta/10 border-transparent text-terracotta-dark">
                    {fait === ls.length && ls.length ? t.review : fait > 0 ? t.cont : t.start} →
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}
