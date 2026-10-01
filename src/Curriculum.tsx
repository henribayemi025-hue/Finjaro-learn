import { useState } from 'react'
import { lessons } from './lessons'
import { acu } from './academy-i18n'
import type { Lang } from './i18n'

/** Vue d'ensemble des parcours. Aucun chiffre inventé : seul le nombre réel de leçons du parcours ouvert est affiché. */
export default function Curriculum({ lang, done }: { lang: Lang; done: string[] }) {
  const t = acu(lang)
  const [open, setOpen] = useState(() => window.innerWidth >= 768)
  const order = ['prog', 'data', 'dl', 'eng', 'prompt'] as const
  return (
    <details className="space-y-2" open={open} onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}>
      <summary className="text-xs uppercase tracking-wide text-ink/60 cursor-pointer">{t.curriculum} · {done.length}/{lessons.length}</summary>
      <p className="text-xs text-ink/60">{t.curriculumHelp}</p>
      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        {order.map((k, i) => {
          const [name, desc] = t.tracks[k]
          const open = i === 0
          return (
            <li key={k} className={`rounded-lg border p-3 ${open ? 'border-terracotta bg-terracotta/10' : 'border-brass/50 bg-paper opacity-80'}`}>
              <p className="font-serif font-bold text-sm">{name}</p>
              <p className="text-xs text-ink/70">{desc}</p>
              <p className="text-xs mt-1 font-medium">
                {open ? `${t.inProgress} · ${done.length}/${lessons.length} ${t.lessonsCount}` : t.soon}
              </p>
            </li>
          )
        })}
      </ul>
    </details>
  )
}
