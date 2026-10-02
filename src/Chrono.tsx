import { useEffect, useMemo, useRef, useState } from 'react'
import { chronoBank, type ChronoQ } from './chronoBank'
import { playError, playSuccess } from './sounds'
import type { Lang } from './i18n'

const DUREE = 60
const PENALITE = 3

const T = {
  fr: {
    title: 'Défi chrono', intro: `${DUREE} secondes : devine ce qu'affiche chaque petit programme Python. Une erreur coûte ${PENALITE} secondes.`,
    start: 'Démarrer', again: 'Rejouer', close: 'Fermer', score: 'Score', best: 'Ton record', newBest: 'Nouveau record !',
    q: 'Que va afficher ce code ?', end: 'Temps écoulé', review: 'À revoir', good: 'Bonne réponse', none: 'Aucune erreur, bravo.',
    empty: '(rien)', local: 'Record gardé sur cet appareil.',
  },
  en: {
    title: 'Speed challenge', intro: `${DUREE} seconds: guess what each tiny Python program prints. A mistake costs ${PENALITE} seconds.`,
    start: 'Start', again: 'Play again', close: 'Close', score: 'Score', best: 'Your best', newBest: 'New record!',
    q: 'What will this code print?', end: 'Time is up', review: 'To review', good: 'Right answer', none: 'No mistakes, well done.',
    empty: '(nothing)', local: 'Best score kept on this device.',
  },
} as const

const melange = <X,>(a: X[]) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]] } return b }
const lireRecord = () => { try { return Number(localStorage.getItem('learn:chrono:best') ?? 0) || 0 } catch { return 0 } }

/** Série de questions « que va afficher ce code ? » contre la montre. Le score et le record restent sur l'appareil. */
export default function Chrono({ lang, sound, onClose, onPlayed }: { lang: Lang; sound: boolean; onClose: () => void; onPlayed: () => void }) {
  const t = T[lang]
  const [phase, setPhase] = useState<'intro' | 'jeu' | 'fin'>('intro')
  const [ordre, setOrdre] = useState<ChronoQ[]>([])
  const [k, setK] = useState(0)
  const [reste, setReste] = useState(DUREE)
  const [score, setScore] = useState(0)
  const [rate, setRate] = useState<ChronoQ[]>([])
  const [flash, setFlash] = useState<null | { ok: boolean; bonne: string }>(null)
  const [record, setRecord] = useState(lireRecord)
  const [nouveau, setNouveau] = useState(false)
  const fin = useRef(0)

  const q = ordre[k]
  const choix = useMemo(() => (q ? melange([q.answer, ...q.wrong]) : []), [q])

  const demarrer = () => {
    // Du plus simple au plus difficile, mélangé à l'intérieur de chaque niveau.
    setOrdre([1, 2, 3].flatMap((n) => melange(chronoBank.filter((x) => x.level === n))))
    setK(0); setScore(0); setRate([]); setFlash(null); setNouveau(false)
    fin.current = Date.now() + DUREE * 1000
    setReste(DUREE); setPhase('jeu')
  }

  useEffect(() => {
    if (phase !== 'jeu') return
    const id = setInterval(() => {
      const r = Math.max(0, Math.ceil((fin.current - Date.now()) / 1000))
      setReste(r)
      if (r === 0) setPhase('fin')
    }, 200)
    return () => clearInterval(id)
  }, [phase])

  useEffect(() => {
    if (phase !== 'fin') return
    onPlayed()
    if (score > record) {
      setRecord(score); setNouveau(true)
      try { localStorage.setItem('learn:chrono:best', String(score)) } catch { /* ignoré */ }
    }
  }, [phase]) // eslint-disable-line react-hooks/exhaustive-deps

  const repondre = (c: string) => {
    if (flash || !q) return
    const ok = c === q.answer
    if (sound) (ok ? playSuccess : playError)()
    if (ok) setScore((s) => s + 1)
    else { setRate((r) => [...r, q]); fin.current -= PENALITE * 1000 }
    setFlash({ ok, bonne: q.answer })
    setTimeout(() => {
      setFlash(null)
      if (k + 1 >= ordre.length) setPhase('fin')
      else setK(k + 1)
    }, ok ? 350 : 1100)
  }

  const affiche = (s: string) => (s === '' ? t.empty : s)

  return (
    <div className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-sm grid place-items-center p-3" role="dialog" aria-modal="true" aria-label={t.title}
      onKeyDown={(e) => { if (e.key === 'Escape') onClose() }}>
      <div className="card w-full max-w-xl max-h-[92vh] overflow-y-auto p-5 sm:p-6 space-y-4 rise">
        <div className="flex items-center gap-3">
          <span aria-hidden="true" className="size-10 rounded-xl grad grid place-items-center text-xl">⚡</span>
          <h2 className="text-xl flex-1">{t.title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label={t.close}>✕</button>
        </div>

        {phase === 'intro' && (
          <div className="space-y-4 text-center">
            <p className="text-ink/75">{t.intro}</p>
            {record > 0 && <p className="chip mx-auto">🏆 {t.best} : {record}</p>}
            <button autoFocus className="btn btn-primary px-8 py-3 text-base" onClick={demarrer}>{t.start}</button>
            <p className="text-xs text-ink/55">{t.local}</p>
          </div>
        )}

        {phase === 'jeu' && q && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm font-semibold">
              <span className="chip">{t.score} : {score}</span>
              <span className="flex-1 h-2 rounded-full bg-ink/10 overflow-hidden" role="progressbar" aria-label="temps" aria-valuenow={reste} aria-valuemin={0} aria-valuemax={DUREE}>
                <span className={`block h-full rounded-full transition-all ${reste <= 10 ? 'bg-terracotta' : 'grad'}`} style={{ width: (reste / DUREE) * 100 + '%' }} />
              </span>
              <span className={`tabular-nums w-10 text-right ${reste <= 10 ? 'text-terracotta-dark' : ''}`} aria-live="off">{reste}s</span>
            </div>
            <p className="text-sm text-ink/60">{t.q}</p>
            <pre className="rounded-xl bg-code text-code-fg p-4 text-sm font-mono overflow-x-auto leading-6">{q.code}</pre>
            <div className="grid grid-cols-2 gap-2">
              {choix.map((c) => {
                const etat = flash ? (c === flash.bonne ? 'ring-2 ring-[#22c55e] bg-[color-mix(in_srgb,#22c55e_15%,transparent)]' : 'opacity-50') : ''
                return (
                  <button key={c} onClick={() => repondre(c)} disabled={!!flash}
                    className={`btn justify-start text-left font-mono whitespace-pre-wrap break-all min-h-12 ${etat}`}>{affiche(c)}</button>
                )
              })}
            </div>
            <p className="text-sm min-h-5" aria-live="polite">{flash && (flash.ok ? '✅' : '❌ ' + t.good + ' : ' + affiche(flash.bonne))}</p>
          </div>
        )}

        {phase === 'fin' && (
          <div className="space-y-4">
            <div className="text-center space-y-1">
              <p className="text-sm text-ink/60">{t.end}</p>
              <p className="text-5xl font-extrabold grad-text">{score}</p>
              <p className="text-sm">{nouveau ? '🏆 ' + t.newBest : `${t.best} : ${record}`}</p>
            </div>
            <div>
              <h3 className="text-sm uppercase tracking-wide text-ink/55 mb-2">{t.review}</h3>
              {rate.length === 0 ? <p className="text-sm">{t.none}</p> : (
                <ul className="space-y-2">
                  {rate.map((r) => (
                    <li key={r.code} className="rounded-xl border border-brass p-3 space-y-1">
                      <pre className="font-mono text-xs whitespace-pre-wrap">{r.code}</pre>
                      <p className="text-sm">→ <span className="font-mono font-semibold">{affiche(r.answer)}</span></p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="flex gap-2 justify-center">
              <button className="btn btn-primary" onClick={demarrer}>{t.again}</button>
              <button className="btn" onClick={onClose}>{t.close}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
