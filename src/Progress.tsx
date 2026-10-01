import { lessons } from './lessons'
import type { Lang } from './i18n'
import { TRACKS } from './tracks'

// ───────── Journées actives (stockage local, rien d'envoyé) ─────────
const KEY = 'learn:days'
export function loadDays(): string[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '[]') } catch { return [] }
}
const dayStr = (d: Date) => d.toISOString().slice(0, 10)
export function recordDay() {
  const days = loadDays(), today = dayStr(new Date())
  if (!days.includes(today)) {
    days.push(today)
    try { localStorage.setItem(KEY, JSON.stringify(days.slice(-800))) } catch { /* ignoré */ }
  }
}

/** Série en cours (jours consécutifs jusqu'à aujourd'hui ou hier) et meilleure série. */
export function streaks(days: string[]) {
  const set = new Set(days)
  const t = new Date(); t.setUTCHours(0, 0, 0, 0)
  let cur = 0
  const d = new Date(t)
  if (!set.has(dayStr(d))) d.setUTCDate(d.getUTCDate() - 1)
  while (set.has(dayStr(d))) { cur++; d.setUTCDate(d.getUTCDate() - 1) }
  let best = 0, run = 0, prev: Date | null = null
  for (const s of [...set].sort()) {
    const x = new Date(s + 'T00:00:00Z')
    run = prev && (x.getTime() - prev.getTime()) / 86400000 === 1 ? run + 1 : 1
    best = Math.max(best, run); prev = x
  }
  return { cur, best }
}

const T = {
  fr: {
    title: 'Ma progression', tree: 'Arbre de compétences', treeHelp: 'Chaque point est une leçon ; il s’allume quand tu la réussis. Clique pour l’ouvrir.',
    bilan: 'Mon bilan', done: 'leçons réussies', days: 'jours actifs', streak: 'série en cours', best: 'meilleure série', tracksDone: 'parcours complets',
    achievements: 'Succès', locked: 'à débloquer', rank: 'Titre', local: 'Ces chiffres sont calculés sur ton appareil à partir de ce que tu as vraiment réussi.',
    titles: ['Curieux', 'Apprenti', 'Codeur', 'Praticien', 'Ingénieur en herbe'], daysUnit: 'j',
  },
  en: {
    title: 'My progress', tree: 'Skill tree', treeHelp: 'Each dot is a lesson; it lights up when you pass it. Click to open it.',
    bilan: 'My summary', done: 'lessons passed', days: 'active days', streak: 'current streak', best: 'best streak', tracksDone: 'tracks completed',
    achievements: 'Achievements', locked: 'locked', rank: 'Title', local: 'These figures are computed on your device from what you really passed.',
    titles: ['Curious', 'Apprentice', 'Coder', 'Practitioner', 'Engineer in the making'], daysUnit: 'd',
  },
} as const

interface Ach { id: string; fr: string; en: string; descFr: string; descEn: string; ok: (c: Ctx) => boolean }
interface Ctx { done: Set<string>; byGroup: (g: string[]) => { total: number; fait: number }; st: { cur: number; best: number }; trackDone: number }

const ACH: Ach[] = [
  { id: 'first', fr: 'Premier pas', en: 'First step', descFr: 'Réussir une leçon', descEn: 'Pass a lesson', ok: (c) => c.done.size >= 1 },
  { id: 'ten', fr: 'Dix leçons', en: 'Ten lessons', descFr: 'Réussir 10 leçons', descEn: 'Pass 10 lessons', ok: (c) => c.done.size >= 10 },
  { id: 'fifty', fr: 'Cinquante leçons', en: 'Fifty lessons', descFr: 'Réussir 50 leçons', descEn: 'Pass 50 lessons', ok: (c) => c.done.size >= 50 },
  { id: 'bases', fr: 'Bases de Python', en: 'Python basics', descFr: 'Terminer « Python · bases »', descEn: 'Finish “Python · basics”', ok: (c) => { const g = c.byGroup(['py-bases']); return g.total > 0 && g.fait === g.total } },
  { id: 'algo', fr: 'Algorithmicien', en: 'Algorithmist', descFr: 'Terminer « algorithmes et structures »', descEn: 'Finish “algorithms and structures”', ok: (c) => { const g = c.byGroup(['py-algo']); return g.total > 0 && g.fait === g.total } },
  { id: 'chart', fr: 'Premier graphique', en: 'First chart', descFr: 'Tracer ta première courbe', descEn: 'Plot your first curve', ok: (c) => c.done.has('viz-courbe') },
  { id: 'xor', fr: 'Un réseau qui apprend', en: 'A network that learns', descFr: 'Faire apprendre le XOR à un réseau', descEn: 'Teach a network XOR', ok: (c) => c.done.has('dl-xor') },
  { id: 'attention', fr: 'Attention !', en: 'Attention!', descFr: 'Écrire le mécanisme d’attention', descEn: 'Write the attention mechanism', ok: (c) => c.done.has('dl-attention') },
  { id: 'ia', fr: 'Ma première IA', en: 'My first AI', descFr: 'Terminer le projet « ta première IA »', descEn: 'Finish the “your first AI” project', ok: (c) => c.done.has('dl-capstone') },
  { id: 'rag', fr: 'Assistant RAG', en: 'RAG assistant', descFr: 'Terminer le projet RAG', descEn: 'Finish the RAG project', ok: (c) => c.done.has('ai-projet-rag') },
  { id: 'track', fr: 'Parcours complet', en: 'Track completed', descFr: 'Terminer un parcours en entier', descEn: 'Finish a whole track', ok: (c) => c.trackDone >= 1 },
  { id: 's3', fr: 'Trois jours de suite', en: 'Three days in a row', descFr: 'Série de 3 jours', descEn: '3-day streak', ok: (c) => c.st.best >= 3 },
  { id: 's7', fr: 'Une semaine de suite', en: 'A week in a row', descFr: 'Série de 7 jours', descEn: '7-day streak', ok: (c) => c.st.best >= 7 },
]

export default function Progress({ lang, done, onOpen }: { lang: Lang; done: string[]; onOpen: (lessonId: string) => void }) {
  const t = T[lang]
  const set = new Set(done)
  const days = loadDays()
  const st = streaks(days)
  const byGroup = (g: string[]) => {
    const ls = lessons.filter((l) => g.includes(l.group ?? 'js'))
    return { total: ls.length, fait: ls.filter((l) => set.has(l.id)).length }
  }
  const trackDone = TRACKS.filter((tr) => { const g = byGroup(tr.groups); return g.total > 0 && g.fait === g.total }).length
  const ctx: Ctx = { done: set, byGroup, st, trackDone }
  const n = done.length
  const title = t.titles[n >= 60 ? 4 : n >= 30 ? 3 : n >= 10 ? 2 : n >= 1 ? 1 : 0]

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">{t.title}</h2>

      <section className="rounded-xl border-2 border-brass bg-paper p-4 space-y-3" aria-label={t.bilan}>
        <div className="flex items-baseline gap-3 flex-wrap">
          <h3 className="font-serif font-bold text-lg">{t.bilan}</h3>
          <span className="ml-auto rounded-full bg-terracotta text-white px-3 py-0.5 text-sm" aria-label={t.rank}>{title}</span>
        </div>
        <dl className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
          {([[n, t.done], [days.length, t.days], [st.cur, t.streak], [st.best, t.best], [trackDone, t.tracksDone]] as const).map(([v, l]) => (
            <div key={l} className="rounded-lg border border-brass/40 p-2">
              <dt className="sr-only">{l}</dt>
              <dd className="font-serif text-3xl font-bold text-terracotta-dark">{v}</dd>
              <dd className="text-xs text-ink/70">{l}</dd>
            </div>
          ))}
        </dl>
        <p className="text-xs text-ink/50">{t.local}</p>
      </section>

      <section aria-label={t.tree} className="space-y-2">
        <h3 className="font-serif font-bold text-lg">{t.tree}</h3>
        <p className="text-xs text-ink/60">{t.treeHelp}</p>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {TRACKS.map((tr) => {
            const g = byGroup(tr.groups)
            return (
              <div key={tr.key} className="rounded-xl border border-brass/50 bg-paper p-3">
                <p className="font-serif font-bold">{tr.name[lang]} <span className="text-xs font-sans font-normal text-ink/60">{g.fait}/{g.total}</span></p>
                <div className="mt-2 pl-3 border-l-2 border-terracotta/40 space-y-3">
                  {tr.groups.map((gr) => {
                    const ls = lessons.filter((l) => (l.group ?? 'js') === gr)
                    return (
                      <div key={gr}>
                        <p className="text-[11px] uppercase tracking-wide text-ink/50 mb-1">{tr.groupName[gr]?.[lang] ?? gr}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {ls.map((l) => (
                            <button key={l.id} onClick={() => onOpen(l.id)} title={l.title[lang]} aria-label={`${l.title[lang]}${set.has(l.id) ? ' ✓' : ''}`}
                              className={`size-5 rounded-full border transition ${set.has(l.id) ? 'bg-terracotta border-terracotta shadow-[0_0_10px_var(--color-terracotta)]' : 'bg-transparent border-ink/30 hover:border-terracotta'}`} />
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section aria-label={t.achievements} className="space-y-2">
        <h3 className="font-serif font-bold text-lg">{t.achievements}</h3>
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {ACH.map((a) => {
            const ok = a.ok(ctx)
            return (
              <li key={a.id} className={`rounded-lg border p-3 ${ok ? 'border-terracotta bg-terracotta/10' : 'border-ink/20 opacity-60'}`}>
                <p className="font-semibold text-sm">{ok ? '🏆 ' : '🔒 '}{lang === 'fr' ? a.fr : a.en}</p>
                <p className="text-xs text-ink/70">{lang === 'fr' ? a.descFr : a.descEn}{ok ? '' : ` · ${t.locked}`}</p>
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}
