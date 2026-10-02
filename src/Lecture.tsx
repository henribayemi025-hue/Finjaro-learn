import { useState } from 'react'
import type { Lang } from './i18n'

const T = {
  fr: { title: 'À vérifier, point par point', ok: 'J’ai lu et compris', done: 'Lu et compris ✓', next: 'Leçon suivante →', all: 'Coche chaque point pour valider.' },
  en: { title: 'Check, point by point', ok: 'I have read and understood', done: 'Read and understood ✓', next: 'Next lesson →', all: 'Tick every point to confirm.' },
} as const

/** Page à lire : chaque point se coche ; la page n'est validée que quand tout est coché (pas de « suivant » à l'aveugle). */
export default function Lecture({ lang, points, fait, hasNext, onOk, onNext }: { lang: Lang; points: string[]; fait: boolean; hasNext: boolean; onOk: () => void; onNext: () => void }) {
  const t = T[lang]
  const [coches, setCoches] = useState<boolean[]>(() => points.map(() => fait))
  const tout = coches.every(Boolean)
  return (
    <section className="card p-5 sm:p-6 space-y-3">
      <h3 className="text-sm uppercase tracking-wide text-ink/55">{t.title}</h3>
      <ul className="space-y-2">
        {points.map((p, i) => (
          <li key={i}>
            <label className="flex items-start gap-3 rounded-xl border border-brass p-3 cursor-pointer min-h-11 hover:bg-ink/5">
              <input type="checkbox" checked={coches[i]} onChange={(e) => setCoches(coches.map((c, j) => (j === i ? e.target.checked : c)))} className="size-5 mt-0.5 shrink-0 accent-[var(--color-terracotta)]" />
              <span className="leading-relaxed">{p}</span>
            </label>
          </li>
        ))}
      </ul>
      {!tout && <p className="text-xs text-ink/60">{t.all}</p>}
      <div className="flex flex-wrap gap-2">
        <button className="btn btn-primary" disabled={!tout || fait} onClick={onOk}>{fait ? t.done : t.ok}</button>
        {fait && hasNext && <button className="btn btn-dark" onClick={onNext}>{t.next}</button>}
      </div>
    </section>
  )
}
