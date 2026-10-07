import { useEffect, useMemo, useState } from 'react'
import { lessons, type Lesson } from './lessons'
import { acu } from './academy-i18n'
import { TRACKS } from './tracks'
import { TRACK_ICON } from './Curriculum'
import type { Lang } from './i18n'
import { chargerIndex, type Numero } from './Lettre'
import Carrousel, { type Diapo } from './Carrousel'

type Niveau = 'debutant' | 'intermediaire' | 'avance'
/** Niveau conseillé de chaque parcours (une indication de difficulté, pas une note). */
const NIVEAU: Record<string, Niveau> = {
  projets: 'debutant', prog: 'debutant', prompt: 'debutant',
  data: 'intermediaire', dl: 'intermediaire', maths: 'intermediaire', crypto: 'intermediaire', archi: 'intermediaire', ethique: 'intermediaire', systemes: 'avance', signal: 'intermediaire', bio: 'intermediaire', neuro: 'avance', jeux: 'intermediaire', ccpp: 'intermediaire', robo: 'intermediaire', outils: 'intermediaire',
  eng: 'avance', algo: 'avance', quant: 'avance', compil: 'avance', nlp: 'avance',
}
// Débutant d'abord dans la liste des parcours (audit du 07/10, L1 : 22 parcours au même niveau perdaient le nouveau).
const ORDRE: Record<Niveau, number> = { debutant: 0, intermediaire: 1, avance: 2 }
/** Projets phares : de vraies leçons de Learn. */
const CLES = [
  { id: 'dl-xor', ico: '🧠', fr: 'Réseau de neurones', en: 'Neural network' },
  { id: 'ai-projet-rag', ico: '📚', fr: 'Assistant RAG', en: 'RAG assistant' },
  { id: 'archi-cpu', ico: '🔌', fr: 'Mini-processeur', en: 'Tiny processor' },
  { id: 'crypto-rsa', ico: '🔐', fr: 'Cryptographie RSA', en: 'RSA cryptography' },
]

const T = {
  fr: {
    resume: 'Reprendre la leçon', mine: 'Reprendre où je me suis arrêté', next: 'À découvrir', chrono: 'Défi chrono', projets: 'Projets guidés', lesson: 'Leçon', global: 'Progression globale', done: 'réussies',
    key: 'Projet clé', search: 'Rechercher une notion, un code, un algo…', all: 'Tous', debutant: 'Débutant', intermediaire: 'Intermédiaire', avance: 'Avancé',
    lessons: 'leçons', verified: 'Progression vérifiée', cont: 'Continuer', start: 'Commencer', review: 'Revoir', none: 'Aucune leçon ne correspond.', tracks: 'Tes parcours',
    startHere: 'Commence ici', first: 'Commencer ma première leçon',
  },
  en: {
    resume: 'Resume the lesson', mine: 'Pick up where I left off', next: 'To explore', chrono: 'Speed challenge', projets: 'Guided projects', lesson: 'Lesson', global: 'Overall progress', done: 'passed',
    key: 'Key project', search: 'Search a concept, some code, an algorithm…', all: 'All', debutant: 'Beginner', intermediaire: 'Intermediate', avance: 'Advanced',
    lessons: 'lessons', verified: 'Verified progress', cont: 'Continue', start: 'Start', review: 'Review', none: 'No lesson matches.', tracks: 'Your tracks',
    startHere: 'Start here', first: 'Start my first lesson',
  },
} as const

const sansAccents = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
const trackOf = (l: Lesson) => TRACKS.find((tr) => tr.groups.includes(l.group ?? 'js'))?.key ?? 'prog'


export default function Accueil({ lang, done, idx, onOpen, onTrack, onResume, onChrono, onLettre }: {
  lang: Lang; done: string[]; idx: number
  onOpen: (i: number) => void; onTrack: (k: string) => void; onResume: () => void; onChrono: () => void; onLettre: () => void
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
  // Personne n'a « repris » une leçon à 0/237 : à l'arrivée, une seule porte, « Commencer » (audit du 07/10, L1).
  const neuf = done.length === 0
  const img = (k: string) => import.meta.env.BASE_URL + 'images/parcours/' + k + '.jpg'
  const diapos: Diapo[] = useMemo(() => {
    const liste: Diapo[] = [{
      key: 'courant', image: img(tr.key), badge: neuf ? t.startHere : t.resume, titre: `${t.lesson} ${pos} : ${lesson.title[lang]}`,
      sousTitre: `${TRACK_ICON[tr.key] ?? ''} ${tr.name[lang]}`, action: neuf ? t.start : t.resume, onClick: onResume,
    }]
    for (const x of TRACKS) {
      if (x.key === tr.key || liste.length >= 9) continue
      // À 0 leçon, seulement les parcours débutants : neuf « Leçon 1 » différentes perdaient le nouveau (L5).
      if (neuf && NIVEAU[x.key] !== 'debutant') continue
      const ls = lessons.map((l, i) => ({ l, i })).filter(({ l }) => trackOf(l) === x.key)
      const suite = ls.find(({ l }) => !done.includes(l.id))
      if (!suite) continue
      const n = ls.indexOf(suite) + 1
      liste.push({
        key: x.key, image: img(x.key), badge: `${TRACK_ICON[x.key] ?? ''} ${x.name[lang]}`, titre: `${t.lesson} ${n} : ${suite.l.title[lang]}`,
        sousTitre: n > 1 ? t.cont : t.next, action: n > 1 ? t.cont : t.start, onClick: () => onOpen(suite.i),
      })
    }
    return liste
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, idx, done])
  const resultats = useMemo(() => {
    const s = sansAccents(q.trim())
    if (s.length < 2) return []
    return lessons.map((l, i) => ({ l, i })).filter(({ l }) => sansAccents(l.title[lang] + ' ' + l.title.en).includes(s)).slice(0, 12)
  }, [q, lang])

  return (
    <div className="space-y-6">
      {/* Carrousel : la leçon en cours d'abord, puis la prochaine leçon de chaque autre parcours. */}
      <Carrousel lang={lang} diapos={diapos} />
      <section className="card p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex justify-between text-sm font-semibold mb-1.5"><span>{t.global}</span><span className="font-mono text-terracotta-dark">{done.length}/{lessons.length} {t.done}</span></div>
          <div className="h-2 rounded-full bg-ink/10 overflow-hidden" role="progressbar" aria-label={t.global} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full grad rounded-full" style={{ width: pct + '%' }} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn btn-primary" onClick={onResume}>▶ {neuf ? t.first : t.mine}</button>
          <button className="btn px-4" onClick={onChrono}>⚡ {t.chrono}</button>
          <button className="btn px-4" onClick={() => onTrack('projets')}>🏗️ {t.projets}</button>
        </div>
      </section>

      {/* La Lettre de l'IA */}
      <button onClick={onLettre} className="card w-full p-4 text-left flex items-center gap-4 hover:-translate-y-0.5 transition">
        <span aria-hidden="true" className="size-12 shrink-0 rounded-2xl grad grid place-items-center text-2xl shadow-md">📰</span>
        <span className="min-w-0 flex-1">
          <span className="block text-[11px] font-bold uppercase tracking-wider text-terracotta-dark">{lang === 'fr' ? 'Chaque matin' : 'Every morning'}</span>
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
                <span className="block text-[11px] font-bold uppercase tracking-wider text-ink/50">{t.key}{done.includes(c.id) ? ' · ✓' : ''}</span>
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
              className={`shrink-0 min-h-11 rounded-xl px-3 text-sm font-semibold ${niv === n ? 'grad text-white' : 'text-ink/70 hover:text-ink'}`}>{n ? t[n] : t.all}</button>
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
          {[...TRACKS].sort((x, y) => ORDRE[NIVEAU[x.key] ?? 'intermediaire'] - ORDRE[NIVEAU[y.key] ?? 'intermediaire']).filter((x) => !niv || NIVEAU[x.key] === niv).map(({ key, name }) => {
            const ls = lessons.map((l, i) => ({ l, i })).filter(({ l }) => trackOf(l) === key)
            const fait = ls.filter(({ l }) => done.includes(l.id)).length
            const p = ls.length ? Math.round((fait / ls.length) * 100) : 0
            const desc = a.tracks[key as keyof typeof a.tracks]?.[1] ?? ''
            const suivantes = [...ls.filter(({ l }) => !done.includes(l.id)), ...ls.filter(({ l }) => done.includes(l.id))].slice(0, 2)
            const next = ls.find(({ l }) => !done.includes(l.id)) ?? ls[0]
            return (
              <li key={key} className="snap-start shrink-0 w-[85%] sm:w-[60%] md:w-auto">
                <div className="card h-full overflow-hidden flex flex-col">
                  <button onClick={() => onTrack(key)} className="group relative block h-36 text-left overflow-hidden" aria-label={(lang === 'fr' ? 'Ouvrir le parcours ' : 'Open track ') + name[lang]}>
                    <img src={import.meta.env.BASE_URL + 'images/parcours/sm/' + key + '.jpg'} alt="" loading="lazy" decoding="async" className="absolute inset-0 size-full object-cover transition duration-500 group-hover:scale-105" />
                    <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                    <span className="absolute top-3 left-3 uppercase tracking-wide font-bold text-[11px] rounded-full bg-white/90 text-ink px-2 py-0.5">{t[NIVEAU[key] ?? 'intermediaire']}</span>
                    {fait > 0 && <span className="absolute top-3 right-3 rounded-full bg-[#22c55e] text-white text-xs font-bold px-2 py-0.5">✓ {fait}/{ls.length}</span>}
                    <span className="absolute inset-x-0 bottom-0 p-3.5 text-white">
                      <h3 className="font-display text-xl leading-tight drop-shadow">{name[lang]} <span aria-hidden="true">›</span></h3>
                      <span className="text-xs text-white/85">{ls.length} {t.lessons}</span>
                    </span>
                  </button>
                  <div className="p-4 sm:p-5 pt-3 sm:pt-4 flex flex-col gap-3 flex-1">
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
                  <div className="mt-auto grid grid-cols-2 gap-2">
                    <button onClick={() => onTrack(key)} className="btn">{lang === 'fr' ? `Les ${ls.length} leçons` : `All ${ls.length} lessons`}</button>
                    <button onClick={() => next && onOpen(next.i)} className="btn bg-terracotta/10 border-transparent text-terracotta-dark">
                      {fait === ls.length && ls.length ? t.review : fait > 0 ? t.cont : t.start} →
                    </button>
                  </div>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}
