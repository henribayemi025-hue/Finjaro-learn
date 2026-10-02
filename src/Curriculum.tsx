import { lessons } from './lessons'
import { acu } from './academy-i18n'
import { TRACKS } from './tracks'
import type { Lang } from './i18n'

export const TRACK_ICON: Record<string, string> = { prog: '💻', data: '📊', dl: '🧠', eng: '🛠️', prompt: '💬', maths: '📐', crypto: '🔐', archi: '🔌', compil: '⚙️', nlp: '🗣️' }

/** Parcours cliquables : choisir un parcours ouvre sa première leçon non faite. Aucun chiffre inventé : seuls les vrais nombres de leçons. */
export default function Curriculum({ lang, done, current, onPick }: { lang: Lang; done: string[]; current: string; onPick: (key: string) => void }) {
  const t = acu(lang)
  return (
    <section aria-label={t.curriculum}>
      <div className="flex items-baseline justify-between gap-2 mb-2">
        <h2 className="text-lg">{t.curriculum}</h2>
        <p className="text-xs text-ink/60">{t.curriculumHelp}</p>
      </div>
      <ul className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 snap-x md:mx-0 md:px-0 md:grid md:grid-cols-4 md:overflow-visible">
        {TRACKS.map(({ key, groups }) => {
          const [name, desc] = t.tracks[key as keyof typeof t.tracks]
          const mine = lessons.filter((l) => groups.includes(l.group ?? 'js'))
          const fait = mine.filter((l) => done.includes(l.id)).length
          const pct = mine.length ? Math.round((fait / mine.length) * 100) : 0
          const on = key === current
          return (
            <li key={key} className="snap-start shrink-0 w-[15.5rem] md:w-auto">
              <button onClick={() => onPick(key)} aria-pressed={on}
                className={`card w-full h-full text-left p-3 flex flex-col gap-1.5 hover:-translate-y-0.5 transition ${on ? 'ring-2 ring-terracotta border-transparent' : ''}`}>
                <span className="flex items-center gap-2">
                  <span aria-hidden="true" className={`size-9 shrink-0 rounded-xl grid place-items-center text-lg ${on ? 'grad' : 'bg-terracotta/10'}`}>{TRACK_ICON[key]}</span>
                  <span className="font-bold text-sm leading-tight">{name}</span>
                </span>
                <span className="text-xs text-ink/65 line-clamp-2">{desc}</span>
                <span className="mt-auto pt-1 flex items-center gap-2">
                  <span className="flex-1 h-1.5 rounded-full bg-ink/10 overflow-hidden" role="progressbar" aria-label={name} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                    <span className="block h-full grad rounded-full" style={{ width: Math.max(pct, 0) + '%' }} />
                  </span>
                  <span className="text-[11px] font-semibold text-ink/70">{fait}/{mine.length}</span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
