import { useState } from 'react'
import { lessons } from './lessons'
import { acu } from './academy-i18n'
import type { Lang } from './i18n'

/** Vue d'ensemble des parcours. Aucun chiffre inventé : seul le nombre réel de leçons du parcours ouvert est affiché. */
export default function Curriculum({ lang, done }: { lang: Lang; done: string[] }) {
  const t = acu(lang)
  const [open, setOpen] = useState(() => window.innerWidth >= 768)
  const order = [
    { k: 'prog', groups: ['js', 'py-bases', 'py-algo', 'py-lecture', 'py-projets'] },
    { k: 'data', groups: ['ds-numpy', 'ds-pandas', 'ds-ml', 'ds-viz'] },
    { k: 'dl', groups: ['dl', 'dl-reseaux'] },
    { k: 'eng', groups: ['ai-rag', 'ai-agents'] },
    { k: 'prompt', groups: ['pe'] },
    { k: 'maths', groups: ['maths'] },
    { k: 'crypto', groups: ['crypto'] },
  ] as const
  return (
    <details className="space-y-2" open={open} onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}>
      <summary className="text-xs uppercase tracking-wide text-ink/60 cursor-pointer">{t.curriculum} · {done.length}/{lessons.length}</summary>
      <p className="text-xs text-ink/60">{t.curriculumHelp}</p>
      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {order.map(({ k, groups }) => {
          const [name, desc] = t.tracks[k]
          const mine = lessons.filter((l) => (groups as readonly string[]).includes(l.group ?? 'js'))
          const fait = mine.filter((l) => done.includes(l.id)).length
          const pct = mine.length ? Math.round((fait / mine.length) * 100) : 0
          return (
            <li key={k} className={`rounded-xl border p-3 ${mine.length ? 'border-terracotta/60 bg-terracotta/10' : 'border-brass/50 bg-paper opacity-80'}`}>
              <p className="font-serif font-bold text-sm">{name}</p>
              <p className="text-xs text-ink/70">{desc}</p>
              {mine.length > 0 ? (
                <>
                  <div className="mt-2 h-1.5 rounded-full bg-ink/10 overflow-hidden" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                    <div className="h-full bg-terracotta" style={{ width: pct + '%' }} />
                  </div>
                  <p className="text-xs mt-1 font-medium">{fait}/{mine.length} {t.lessonsCount}</p>
                </>
              ) : <p className="text-xs mt-1 font-medium">{t.soon}</p>}
            </li>
          )
        })}
      </ul>
    </details>
  )
}
