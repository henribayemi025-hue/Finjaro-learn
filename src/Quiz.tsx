import { useMemo, useState } from 'react'
import type { Lesson } from './lessons'
import type { Lang } from './i18n'

/**
 * PETIT QUIZ dans chaque leçon (Beau, 14/10 : « ce n'est pas interactif, des quiz comme Gemini »).
 * Deux jeux construits à partir du vrai code de la solution, sans modèle : la bonne réponse est celle du code.
 * - Compléter : un mot-clé de la solution est caché, on choisit le bon parmi quatre.
 * - Remettre dans l'ordre : les lignes de la solution sont mélangées, on les touche dans le bon ordre.
 */

const MOTS = {
  js: ['return', 'for', 'if', 'else', 'let', 'const', 'function', 'console.log', 'push', 'length', '===', '%', '*', '+'],
  py: ['return', 'for', 'in', 'if', 'else', 'def', 'print', 'append', 'len', 'range', '==', '%', '*', 'join', 'split'],
  sql: ['SELECT', 'FROM', 'WHERE', 'ORDER BY', 'GROUP BY', 'COUNT', 'SUM', 'JOIN', 'ON', 'DESC', 'AS', 'AND'],
}
const T = {
  fr: { title: 'Petit quiz', fill: 'Compléter', order: 'Remettre dans l’ordre', fillQ: 'Quel mot manque à la place de ____ ?', orderQ: 'Touche les lignes dans le bon ordre.',
    check: 'Vérifier', reset: 'Recommencer', good: 'Bravo, c’est ça !', bad: 'Pas tout à fait. Réessaie.', none: 'Pas de quiz pour cette leçon.', answer: 'Ta réponse', undo: 'Retirer la dernière' },
  en: { title: 'Quick quiz', fill: 'Fill in', order: 'Put in order', fillQ: 'Which word goes where ____ is?', orderQ: 'Tap the lines in the right order.',
    check: 'Check', reset: 'Start again', good: 'Well done, that’s it!', bad: 'Not quite. Try again.', none: 'No quiz for this lesson.', answer: 'Your answer', undo: 'Remove the last one' },
} as const

/** Graine stable par leçon : le quiz est le même à chaque visite (pas de hasard). */
function graine(s: string) { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0 }
function melange<X>(a: X[], g: number): X[] {
  const r = [...a]; let x = g || 1
  for (let i = r.length - 1; i > 0; i--) { x = (Math.imul(x, 1103515245) + 12345) >>> 0; const j = x % (i + 1); [r[i], r[j]] = [r[j], r[i]] }
  return r
}
const echap = (m: string) => m.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const motif = (m: string) => new RegExp(/^\w/.test(m) ? `\\b${echap(m)}\\b` : echap(m))

export function construireQuiz(l: Lesson) {
  const g = graine(l.id)
  const langage = l.lang === 'py' ? 'py' : l.lang === 'sql' ? 'sql' : 'js'
  const code = l.solution.replace(/\r/g, '')
  // Compléter : le premier mot-clé (dans un ordre propre à la leçon) présent dans la solution.
  const presents = melange(MOTS[langage], g).filter((m) => motif(m).test(code))
  const mot = presents[0]
  const trou = mot ? (() => {
    const lignes = code.split('\n')
    const i = lignes.findIndex((x) => motif(mot).test(x))
    return { avant: lignes.slice(Math.max(0, i - 2), i).join('\n'), ligne: lignes[i].replace(motif(mot), '____'), apres: lignes.slice(i + 1, i + 3).join('\n'),
      bon: mot, choix: melange([mot, ...melange(MOTS[langage].filter((m) => m !== mot), g + 7).slice(0, 3)], g + 3) }
  })() : null
  // Remettre dans l'ordre : 3 à 8 lignes non vides, mélangées (jamais dans l'ordre d'origine).
  const lignes = code.split('\n').filter((x) => x.trim())
  let ordre: { lignes: string[]; melange: number[] } | null = null
  if (lignes.length >= 3 && lignes.length <= 8 && new Set(lignes).size === lignes.length) {
    let m = melange(lignes.map((_, i) => i), g + 11)
    if (m.every((v, i) => v === i)) m = [...m.slice(1), m[0]]
    ordre = { lignes, melange: m }
  }
  return { trou, ordre }
}

export default function Quiz({ lesson, lang }: { lesson: Lesson; lang: Lang }) {
  const t = T[lang]
  const q = useMemo(() => construireQuiz(lesson), [lesson])
  const [jeu, setJeu] = useState<'fill' | 'order'>(q.trou ? 'fill' : 'order')
  const [pris, setPris] = useState('')
  const [suite, setSuite] = useState<number[]>([])
  const [verdict, setVerdict] = useState<boolean | null>(null)
  if (!q.trou && !q.ordre) return null
  const changer = (j: 'fill' | 'order') => { setJeu(j); setVerdict(null); setPris(''); setSuite([]) }
  const pre = 'rounded-lg bg-code text-code-fg p-3 text-[13px] font-mono whitespace-pre overflow-x-auto'

  return (
    <section className="card p-5 sm:p-6 space-y-3" aria-label={t.title}>
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-sm uppercase tracking-wide text-ink/55 flex-1 basis-full sm:basis-auto">🧩 {t.title}</h3>
        <div className="flex rounded-full border border-brass overflow-hidden text-sm" role="tablist">
          {q.trou && <button role="tab" aria-selected={jeu === 'fill'} onClick={() => changer('fill')} className={`px-3 min-h-9 ${jeu === 'fill' ? 'bg-terracotta text-white' : ''}`}>{t.fill}</button>}
          {q.ordre && <button role="tab" aria-selected={jeu === 'order'} onClick={() => changer('order')} className={`px-3 min-h-9 ${jeu === 'order' ? 'bg-terracotta text-white' : ''}`}>{t.order}</button>}
        </div>
      </div>

      {jeu === 'fill' && q.trou && (
        <div className="space-y-3">
          <p className="font-semibold text-[15px]">{t.fillQ}</p>
          <pre className={pre}>{q.trou.avant ? q.trou.avant + '\n' : ''}<mark className="bg-amber/40 text-inherit rounded px-0.5">{q.trou.ligne}</mark>{q.trou.apres ? '\n' + q.trou.apres : ''}</pre>
          <div className="grid grid-cols-2 gap-2">
            {q.trou.choix.map((c) => (
              <button key={c} onClick={() => { setPris(c); setVerdict(c === q.trou!.bon) }} aria-pressed={pris === c}
                className={`min-h-11 rounded-xl border px-3 font-mono text-sm ${pris === c ? (verdict ? 'border-[#16a34a] bg-[color-mix(in_srgb,#22c55e_14%,transparent)]' : 'border-terracotta bg-terracotta/10') : 'border-brass/60 bg-paper hover:border-terracotta'}`}>{c}</button>
            ))}
          </div>
        </div>
      )}

      {jeu === 'order' && q.ordre && (
        <div className="space-y-3">
          <p className="font-semibold text-[15px]">{t.orderQ}</p>
          <div className="space-y-1.5">
            {q.ordre.melange.map((i) => {
              const pos = suite.indexOf(i)
              return (
                <button key={i} disabled={pos >= 0} onClick={() => { const s = [...suite, i]; setSuite(s); setVerdict(s.length === q.ordre!.lignes.length ? s.every((v, k) => v === k) : null) }}
                  className={`w-full text-left rounded-lg border px-3 py-2 font-mono text-[13px] whitespace-pre overflow-x-auto flex gap-2 ${pos >= 0 ? 'border-terracotta/50 bg-terracotta/8 opacity-70' : 'border-brass/60 bg-paper hover:border-terracotta'}`}>
                  <span className="shrink-0 w-5 text-ink/50 font-sans">{pos >= 0 ? pos + 1 : '·'}</span><span className="min-w-0">{q.ordre!.lignes[i]}</span>
                </button>
              )
            })}
          </div>
          {suite.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs text-ink/60">{t.answer}</p>
              <pre className={pre}>{suite.map((i) => q.ordre!.lignes[i]).join('\n')}</pre>
              <div className="flex gap-2">
                <button className="btn" onClick={() => { setSuite(suite.slice(0, -1)); setVerdict(null) }}>↶ {t.undo}</button>
                <button className="btn" onClick={() => { setSuite([]); setVerdict(null) }}>{t.reset}</button>
              </div>
            </div>
          )}
        </div>
      )}

      {verdict !== null && (
        <p role="status" className={`rounded-xl p-3 text-sm font-semibold ${verdict ? 'bg-[color-mix(in_srgb,#22c55e_14%,transparent)] border border-[color-mix(in_srgb,#22c55e_45%,transparent)]' : 'bg-terracotta/10 border border-terracotta/40 text-terracotta-dark'}`}>
          {verdict ? '✅ ' + t.good : t.bad}
        </p>
      )}
    </section>
  )
}
