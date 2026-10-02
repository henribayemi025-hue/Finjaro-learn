import { useEffect, useState } from 'react'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import type { Lang } from './i18n'

export interface Numero { date: string; numero: number; titre: string; fichier: string }

const BASE = import.meta.env.BASE_URL + 'lettre/'
const T = {
  fr: { title: 'La Lettre de l’IA', sub: 'Chaque matin : les nouveautés de l’IA, sourcées et datées.', archive: 'Anciens numéros', loading: 'Chargement…', error: 'La lettre n’a pas pu être chargée. Vérifie ta connexion et réessaie.', retry: 'Réessayer', n: 'Numéro', fr: 'La lettre est rédigée en français.' },
  en: { title: 'The AI Letter', sub: 'Every morning: what’s new in AI, sourced and dated.', archive: 'Past issues', loading: 'Loading…', error: 'The letter could not be loaded. Check your connection and try again.', retry: 'Try again', n: 'Issue', fr: 'The letter is written in French.' },
} as const

/** Rendu Markdown sûr : liens ouverts dans un nouvel onglet, tableaux dans un cadre qui défile. */
function rendu(md: string) {
  const html = marked.parse(md, { async: false, gfm: true }) as string
  const propre = DOMPurify.sanitize(html, { USE_PROFILES: { html: true } })
  const doc = new DOMParser().parseFromString(`<div>${propre}</div>`, 'text/html')
  doc.querySelectorAll('a[href]').forEach((a) => { a.setAttribute('target', '_blank'); a.setAttribute('rel', 'noopener noreferrer') })
  doc.querySelectorAll('table').forEach((t) => {
    const w = doc.createElement('div'); w.className = 'lettre-table'; w.setAttribute('tabindex', '0')
    t.replaceWith(w); w.appendChild(t)
  })
  return doc.body.firstElementChild!.innerHTML
}

/** Liste des numéros (la plus récente en tête). Exportée pour l'accueil. */
export async function chargerIndex(): Promise<Numero[]> {
  const r = await fetch(BASE + 'index.json', { cache: 'no-cache' })
  if (!r.ok) throw new Error(String(r.status))
  const liste = (await r.json()) as Numero[]
  return [...liste].sort((a, b) => b.date.localeCompare(a.date))
}

export default function Lettre({ lang, date, onDate }: { lang: Lang; date: string | null; onDate: (d: string) => void }) {
  const t = T[lang]
  const [index, setIndex] = useState<Numero[] | null>(null)
  const [html, setHtml] = useState('')
  const [err, setErr] = useState(false)
  const [essai, setEssai] = useState(0)

  useEffect(() => { setErr(false); chargerIndex().then(setIndex).catch(() => setErr(true)) }, [essai])
  const courant = index ? (index.find((n) => n.date === date) ?? index[0]) : null
  useEffect(() => {
    if (!courant) return
    setHtml('')
    fetch(BASE + courant.fichier, { cache: 'no-cache' })
      .then((r) => { if (!r.ok) throw new Error(String(r.status)); return r.text() })
      .then((md) => setHtml(rendu(md)))
      .catch(() => setErr(true))
  }, [courant?.fichier]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_260px] items-start">
      <div className="min-w-0 space-y-3">
        <header className="flex items-center gap-3">
          <span aria-hidden="true" className="size-11 rounded-2xl grad grid place-items-center text-xl shadow-md">📰</span>
          <div>
            <h2 className="text-2xl leading-tight">{t.title}</h2>
            <p className="text-sm text-ink/60">{t.sub}{lang === 'en' ? ' ' + t.fr : ''}</p>
          </div>
        </header>
        {err && (
          <div className="card p-4 text-sm space-y-2" role="alert">
            <p>{t.error}</p>
            <button className="btn" onClick={() => setEssai((e) => e + 1)}>{t.retry}</button>
          </div>
        )}
        {!err && !html && <p className="text-sm text-ink/60" role="status">{t.loading}</p>}
        {html && <article lang="fr" className="card lettre p-5 sm:p-8 rise" dangerouslySetInnerHTML={{ __html: html }} />}
      </div>
      {index && index.length > 0 && (
        <nav aria-label={t.archive} className="card p-4 lg:sticky lg:top-20">
          <h3 className="text-xs uppercase tracking-wide text-ink/55 font-bold mb-2">{t.archive}</h3>
          <ul className="space-y-1">
            {index.map((n) => (
              <li key={n.date}>
                <button onClick={() => onDate(n.date)} aria-current={courant?.date === n.date ? 'page' : undefined}
                  className={`w-full min-h-11 text-left rounded-xl px-3 py-2 text-sm ${courant?.date === n.date ? 'bg-terracotta/12 font-semibold' : 'hover:bg-ink/5'}`}>
                  <span className="block text-xs text-ink/55">{t.n} {n.numero} · {n.date}</span>
                  <span className="block">{n.titre}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  )
}
