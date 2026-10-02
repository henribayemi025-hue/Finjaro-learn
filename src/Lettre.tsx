import { useEffect, useMemo, useState } from 'react'
import { marked, type Token, type Tokens } from 'marked'
import DOMPurify from 'dompurify'
import type { Lang } from './i18n'

export interface Numero { date: string; numero: number; titre: string; fichier: string }

const BASE = import.meta.env.BASE_URL + 'lettre/'
const FAV = 'learn:lettre:favoris'

const T = {
  fr: {
    title: 'La Lettre de l’IA', daily: 'Édition du jour', archive: 'Anciens numéros', loading: 'Chargement…', error: 'La lettre n’a pas pu être chargée. Vérifie ta connexion et réessaie.', retry: 'Réessayer', n: 'Numéro',
    all: 'Tout', news: 'Actus', github: 'GitHub', prompt: 'Prompt', favs: 'Favoris', search: 'Filtrer les actus, dépôts, prompts…',
    repos: 'Dépôts GitHub du jour', prompts: 'Le prompt du jour', actu: 'L’actu IA', key: 'À retenir', sources: 'Sources', copy: 'Copier', copied: 'Copié !', clone: 'git clone',
    fav: 'Garder en favori', unfav: 'Retirer des favoris', nothing: 'Rien ne correspond.', noFav: 'Aucun favori : touche ☆ sur une actu ou un dépôt pour le garder (sur cet appareil).',
    usage: 'Cas d’usage', prev: 'Précédent', next: 'Suivant', today: 'Étoiles du jour', fr: '',
  },
  en: {
    title: 'The AI Letter', daily: 'Today’s edition', archive: 'Past issues', loading: 'Loading…', error: 'The letter could not be loaded. Check your connection and try again.', retry: 'Try again', n: 'Issue',
    all: 'All', news: 'News', github: 'GitHub', prompt: 'Prompt', favs: 'Saved', search: 'Filter news, repos, prompts…',
    repos: 'Today’s GitHub repos', prompts: 'Prompt of the day', actu: 'AI news', key: 'Key point', sources: 'Sources', copy: 'Copy', copied: 'Copied!', clone: 'git clone',
    fav: 'Save', unfav: 'Unsave', nothing: 'Nothing matches.', noFav: 'No saved items: tap ☆ on a news item or a repo to keep it (on this device).',
    usage: 'Use case', prev: 'Previous', next: 'Next', today: 'Stars today', fr: '(written in French)',
  },
} as const

// ───────── Lecture du Markdown du jour (rien n'est ajouté : tout vient du fichier) ─────────
type Kind = 'news' | 'repos' | 'prompt' | 'other'
interface Section { kind: Kind; title: string; tokens: Token[] }
interface Actu { id: string; title: string; body: Token[]; key: Token[]; sources: Token[] }
interface Repo { id: string; owner: string; name: string; url: string; desc: string; extra: { label: string; value: string }[] }

const html = (tokens: Token[]) => {
  const h = marked.parser(Object.assign([...tokens], { links: {} })) as string
  const doc = new DOMParser().parseFromString(`<div>${DOMPurify.sanitize(h)}</div>`, 'text/html')
  doc.querySelectorAll('a[href]').forEach((a) => { a.setAttribute('target', '_blank'); a.setAttribute('rel', 'noopener noreferrer') })
  doc.querySelectorAll('table').forEach((t) => { const w = doc.createElement('div'); w.className = 'lettre-table'; w.setAttribute('tabindex', '0'); t.replaceWith(w); w.appendChild(t) })
  return doc.body.firstElementChild!.innerHTML
}
/** Titre de rubrique : le Markdown en ligne (gras…) est rendu, pas affiché tel quel. */
const Titre = ({ md }: { md: string }) => <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(marked.parseInline(md, { async: false }) as string) }} />
const Html = ({ tokens, className = '' }: { tokens: Token[]; className?: string }) => <div className={`lettre ${className}`} dangerouslySetInnerHTML={{ __html: html(tokens) }} />
const texte = (tokens: Token[]) => tokens.map((t) => ('raw' in t ? t.raw : '')).join(' ')

function kindOf(title: string): Kind {
  const s = title.toLowerCase()
  if (s.includes('📰') || s.includes('nouveautés du jour')) return 'news'
  if (s.includes('⭐') || s.includes('dépôt') || s.includes('github')) return 'repos'
  if (s.includes('prompt')) return 'prompt'
  return 'other'
}

function analyse(md: string) {
  const tokens = marked.lexer(md)
  const intro: Token[] = []
  const sections: Section[] = []
  let titre = ''
  for (const t of tokens) {
    if (t.type === 'heading' && t.depth === 1) { titre = t.text; continue }
    if (t.type === 'heading' && t.depth === 2) { sections.push({ kind: kindOf(t.text), title: t.text, tokens: [] }); continue }
    if (t.type === 'hr' || t.type === 'space') continue
    ;(sections.length ? sections[sections.length - 1].tokens : intro).push(t)
  }
  return { titre, intro, sections }
}

function actus(s: Section): { actus: Actu[]; rest: Token[] } {
  const res: Actu[] = []; const rest: Token[] = []
  for (const t of s.tokens) {
    if (t.type === 'heading' && t.depth === 3) { res.push({ id: 'a:' + t.text, title: t.text, body: [], key: [], sources: [] }); continue }
    if (!res.length) { rest.push(t); continue }
    const a = res[res.length - 1]
    const raw = 'raw' in t ? t.raw.trim() : ''
    if (/^\*\*À retenir/i.test(raw)) a.key.push(t)
    else if (/^Sources?\s*:/i.test(raw)) a.sources.push(t)
    else a.body.push(t)
  }
  return { actus: res, rest }
}

function depots(s: Section): { repos: Repo[]; avant: Token[]; rest: Token[] } {
  const repos: Repo[] = []; const avant: Token[] = []; const rest: Token[] = []
  for (const t of s.tokens) {
    if (t.type !== 'table') { (repos.length ? rest : avant).push(t); continue }
    const tb = t as Tokens.Table
    for (const row of tb.rows) {
      const m = row[0]?.text.match(/\[([^\]]+)\]\((https:\/\/github\.com\/[^)\s]+)\)/)
      if (!m) continue
      const [owner, name] = m[1].split('/')
      repos.push({
        id: 'r:' + m[1], owner: owner ?? '', name: name ?? m[1], url: m[2],
        desc: row[1]?.text ?? '',
        extra: row.slice(2).map((c, i) => ({ label: tb.header[i + 2]?.text ?? '', value: c.text })),
      })
    }
  }
  return { repos, avant, rest }
}

/** Dessin vectoriel décoratif, propre à chaque titre (pas une photo, pas une donnée). */
function Dessin({ seed }: { seed: string }) {
  let h = 0; for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0
  const r = (n: number) => { h = (h * 1103515245 + 12345) >>> 0; return h % n }
  const pts = Array.from({ length: 6 }, () => [20 + r(260), 18 + r(84)])
  const forme = r(3)
  return (
    <svg viewBox="0 0 300 120" className="w-full h-28" aria-hidden="true">
      <defs><radialGradient id={'g' + seed.length + forme} cx="50%" cy="50%" r="60%"><stop offset="0" stopColor="var(--color-terracotta)" stopOpacity=".28" /><stop offset="1" stopColor="var(--color-terracotta)" stopOpacity="0" /></radialGradient></defs>
      <rect width="300" height="120" fill={`url(#g${seed.length}${forme})`} />
      {forme === 0 && pts.slice(1).map(([x, y], i) => <path key={i} d={`M${pts[i][0]},${pts[i][1]} Q150,60 ${x},${y}`} fill="none" stroke="var(--color-terracotta)" strokeOpacity=".5" strokeDasharray="4 4" />)}
      {forme === 1 && pts.map(([x, y], i) => <line key={i} x1="150" y1="60" x2={x} y2={y} stroke="var(--color-amber)" strokeOpacity=".55" />)}
      {forme === 2 && [30, 60, 90].map((y) => <line key={y} x1="20" x2="280" y1={y} y2={y} stroke="var(--color-terracotta)" strokeOpacity=".35" />)}
      {pts.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={i % 2 ? 5 : 8} fill="var(--color-paper)" stroke={i % 2 ? 'var(--color-amber)' : 'var(--color-terracotta)'} strokeWidth="2.5" />)}
      <rect x="132" y="42" width="36" height="36" rx="9" fill="var(--color-paper)" stroke="var(--color-terracotta)" strokeWidth="2.5" />
      <circle cx="150" cy="60" r="6" fill="var(--color-terracotta)" />
    </svg>
  )
}

/** Liste des numéros (la plus récente en tête). Exportée pour l'accueil. */
export async function chargerIndex(): Promise<Numero[]> {
  const r = await fetch(BASE + 'index.json', { cache: 'no-cache' })
  if (!r.ok) throw new Error(String(r.status))
  return ([...(await r.json())] as Numero[]).sort((a, b) => b.date.localeCompare(a.date))
}

const lireFav = (): string[] => { try { return JSON.parse(localStorage.getItem(FAV) ?? '[]') } catch { return [] } }

export default function Lettre({ lang, date, onDate }: { lang: Lang; date: string | null; onDate: (d: string) => void }) {
  const t = T[lang]
  const [index, setIndex] = useState<Numero[] | null>(null)
  const [md, setMd] = useState('')
  const [err, setErr] = useState(false)
  const [essai, setEssai] = useState(0)
  const [filtre, setFiltre] = useState<'all' | 'news' | 'github' | 'prompt' | 'favs'>('all')
  const [q, setQ] = useState('')
  const [favs, setFavs] = useState<string[]>(lireFav)
  const [copie, setCopie] = useState('')

  useEffect(() => { setErr(false); chargerIndex().then(setIndex).catch(() => setErr(true)) }, [essai])
  const courant = index ? (index.find((n) => n.date === date) ?? index[0]) : null
  useEffect(() => {
    if (!courant) return
    setMd('')
    fetch(BASE + courant.fichier, { cache: 'no-cache' })
      .then((r) => { if (!r.ok) throw new Error(String(r.status)); return r.text() })
      .then(setMd).catch(() => setErr(true))
  }, [courant?.fichier]) // eslint-disable-line react-hooks/exhaustive-deps

  const doc = useMemo(() => (md ? analyse(md) : null), [md])
  const news = doc?.sections.find((s) => s.kind === 'news')
  const reposS = doc?.sections.find((s) => s.kind === 'repos')
  const promptS = doc?.sections.find((s) => s.kind === 'prompt')
  const autres = doc?.sections.filter((s) => s.kind === 'other') ?? []
  const A = news ? actus(news) : { actus: [], rest: [] }
  const R = reposS ? depots(reposS) : { repos: [], avant: [], rest: [] }
  const promptCode = promptS?.tokens.find((x) => x.type === 'code') as Tokens.Code | undefined

  const toggleFav = (id: string) => setFavs((f) => {
    const n = f.includes(id) ? f.filter((x) => x !== id) : [...f, id]
    try { localStorage.setItem(FAV, JSON.stringify(n.slice(-200))) } catch { /* ignoré */ }
    return n
  })
  const copier = async (txt: string, id: string) => {
    try { await navigator.clipboard.writeText(txt); setCopie(id); setTimeout(() => setCopie(''), 1500) } catch { /* presse-papiers refusé */ }
  }
  const s = q.trim().toLowerCase()
  const garde = (id: string, txt: string) => (filtre !== 'favs' || favs.includes(id)) && (!s || txt.toLowerCase().includes(s))
  const actusVues = A.actus.filter((a) => (filtre === 'all' || filtre === 'news' || filtre === 'favs') && garde(a.id, a.title + ' ' + texte(a.body) + ' ' + texte(a.key)))
  const reposVus = R.repos.filter((r) => (filtre === 'all' || filtre === 'github' || filtre === 'favs') && garde(r.id, r.owner + '/' + r.name + ' ' + r.desc))
  const voirPrompt = !!promptS && (filtre === 'all' || filtre === 'prompt') && (!s || texte(promptS.tokens).toLowerCase().includes(s))
  const voirAutres = (filtre === 'all' || filtre === 'news') && !s
  const rien = !actusVues.length && !reposVus.length && !voirPrompt && !voirAutres

  const Etoile = ({ id }: { id: string }) => (
    <button onClick={() => toggleFav(id)} aria-pressed={favs.includes(id)} aria-label={favs.includes(id) ? t.unfav : t.fav} title={favs.includes(id) ? t.unfav : t.fav}
      className={`icon-btn shrink-0 ${favs.includes(id) ? 'text-terracotta-dark border-terracotta' : ''}`}>{favs.includes(id) ? '★' : '☆'}</button>
  )

  const filtres = [
    ['all', t.all, A.actus.length + R.repos.length + (promptS ? 1 : 0)],
    ['news', t.news, A.actus.length],
    ['github', t.github, R.repos.length],
    ...(promptS ? [['prompt', t.prompt, 1]] : []),
    ['favs', t.favs, favs.length],
  ] as [typeof filtre, string, number][]

  return (
    <div className="space-y-6">
      {err && (
        <div className="card p-4 text-sm space-y-2" role="alert"><p>{t.error}</p><button className="btn" onClick={() => setEssai((e) => e + 1)}>{t.retry}</button></div>
      )}
      {!err && !doc && <p className="text-sm text-ink/60" role="status">{t.loading}</p>}

      {doc && courant && (
        <>
          {/* En-tête « édition du jour » */}
          <header className="card hero-glow p-5 sm:p-8 space-y-4 rise">
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-mono">
              <span className="text-terracotta-dark font-bold uppercase tracking-[.16em]">📰 {t.daily}</span>
              <span className="text-ink/60">{t.n} {courant.numero} · {courant.date}</span>
            </p>
            <h2 className="font-display text-4xl sm:text-5xl leading-none">La Lettre de <span className="grad-text">l’IA</span></h2>
            {doc.intro.length > 0 && <Html tokens={doc.intro} className="text-ink/75 max-w-3xl" />}
            {lang === 'en' && <p className="text-xs text-ink/55">{t.fr}</p>}
            <div className="flex flex-col lg:flex-row gap-2 pt-1">
              <div role="group" aria-label="filtres" className="flex gap-1 rounded-2xl border border-brass bg-paper p-1 overflow-x-auto">
                {filtres.map(([k, l, n]) => (
                  <button key={k} aria-pressed={filtre === k} onClick={() => setFiltre(k)}
                    className={`shrink-0 min-h-11 rounded-xl px-3 text-sm font-semibold flex items-center gap-1.5 ${filtre === k ? 'grad text-white' : 'text-ink/70 hover:text-ink'}`}>
                    {l}<span className={`text-[11px] rounded-md px-1.5 ${filtre === k ? 'bg-white/25' : 'bg-ink/8'}`}>{n}</span>
                  </button>
                ))}
              </div>
              <label className="flex-1 relative">
                <span className="sr-only">{t.search}</span>
                <span aria-hidden="true" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/45">⌕</span>
                <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.search} className="w-full min-h-12 rounded-2xl border border-brass pl-10 pr-4 text-sm" />
              </label>
            </div>
          </header>

          {rien && <p className="card p-4 text-sm text-ink/65">{filtre === 'favs' && !favs.length ? t.noFav : t.nothing}</p>}

          {/* Dépôts GitHub du jour : carrousel */}
          {reposVus.length > 0 && reposS && (
            <section aria-labelledby="l-repos">
              <h3 id="l-repos" className="font-display text-2xl mb-1"><Titre md={reposS.title} /></h3>
              {R.avant.length > 0 && <Html tokens={R.avant} className="text-sm text-ink/65 mb-3" />}
              <ul className="flex gap-3 overflow-x-auto snap-x pb-3 -mx-4 px-4 md:mx-0 md:px-0">
                {reposVus.map((r, i) => (
                  <li key={r.id} className="snap-start shrink-0 w-[82%] sm:w-[340px]">
                    <div className="card h-full p-4 flex flex-col gap-3">
                      <div className="flex items-start gap-3">
                        <span aria-hidden="true" className="size-10 shrink-0 rounded-xl bg-ink/6 grid place-items-center font-mono text-xs font-bold">#{i + 1}</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-mono text-ink/55 truncate">{r.owner}</p>
                          <a href={r.url} target="_blank" rel="noopener noreferrer" className="font-display text-lg font-bold underline-offset-2 hover:underline break-words">{r.name}</a>
                        </div>
                        <Etoile id={r.id} />
                      </div>
                      <p className="text-sm text-ink/75 flex-1">{r.desc}</p>
                      {r.extra.filter((x) => x.value).map((x) => (
                        <p key={x.label} className="text-xs"><span className="text-ink/55">{x.label} : </span><span className="font-mono font-bold">{x.value}</span></p>
                      ))}
                      <button onClick={() => copier(`git clone ${r.url}.git`, r.id)} className="btn justify-start font-mono text-xs w-full" aria-label={`${t.copy} : git clone ${r.url}.git`}>
                        ⧉ {copie === r.id ? t.copied : `${t.clone} ${r.owner}/${r.name}`}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
              {filtre !== 'favs' && R.rest.length > 0 && <Html tokens={R.rest} className="text-sm text-ink/70" />}
            </section>
          )}

          {/* Prompt du jour : façon éditeur */}
          {voirPrompt && promptS && (
            <section aria-labelledby="l-prompt" className="card p-5 sm:p-7 space-y-4">
              <h3 id="l-prompt" className="font-display text-2xl"><Titre md={promptS.title} /></h3>
              <Html tokens={promptS.tokens.filter((x) => x !== promptCode)} className="text-ink/80" />
              {promptCode && (
                <div className="ide">
                  <div className="ide-bar">
                    <span className="ide-dot bg-[#ff5f57]" /><span className="ide-dot bg-[#febc2e]" /><span className="ide-dot bg-[#28c840]" />
                    <span className="ml-2 font-mono">prompt-du-jour.txt</span>
                    <button onClick={() => copier(promptCode.text, 'prompt')} className="ml-auto btn btn-primary py-1 px-3 text-xs">⧉ {copie === 'prompt' ? t.copied : t.copy}</button>
                  </div>
                  <pre className="p-4 text-sm font-mono whitespace-pre-wrap leading-6 max-h-96 overflow-y-auto">
                    {promptCode.text.split('\n').map((l, i) => <div key={i}><span className="inline-block w-7 text-right mr-3 opacity-40 select-none">{i + 1}</span>{l}</div>)}
                  </pre>
                </div>
              )}
            </section>
          )}

          {/* L'actu IA : cartes */}
          {actusVues.length > 0 && news && (
            <section aria-labelledby="l-news">
              <h3 id="l-news" className="font-display text-2xl mb-3"><Titre md={news.title} /></h3>
              <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {actusVues.map((a) => (
                  <li key={a.id}>
                    <article className="card h-full overflow-hidden flex flex-col">
                      <div className="relative border-b border-brass bg-cream/50">
                        <Dessin seed={a.title} />
                        <div className="absolute top-2 right-2"><Etoile id={a.id} /></div>
                      </div>
                      <div className="p-4 sm:p-5 flex flex-col gap-3 flex-1">
                        <h4 className="font-display text-lg leading-snug">{a.title}</h4>
                        <Html tokens={a.body} className="text-sm text-ink/80" />
                        {a.key.length > 0 && (
                          <div className="rounded-xl bg-terracotta/8 border border-terracotta/25 p-3">
                            <Html tokens={a.key} className="text-sm" />
                          </div>
                        )}
                        {a.sources.length > 0 && <Html tokens={a.sources} className="text-xs mt-auto pt-2 border-t border-brass" />}
                      </div>
                    </article>
                  </li>
                ))}
              </ul>
              {filtre !== 'favs' && !s && A.rest.length > 0 && <Html tokens={A.rest} className="text-sm text-ink/70 mt-2" />}
            </section>
          )}

          {/* Autres rubriques du numéro (nouveautés des assistants, astuce, mot du jour…) */}
          {voirAutres && autres.map((sec) => (
            <section key={sec.title} className="card p-5 sm:p-7">
              <h3 className="font-display text-2xl mb-2"><Titre md={sec.title} /></h3>
              <Html tokens={sec.tokens} />
            </section>
          ))}

          {/* Anciens numéros */}
          {index && index.length > 0 && (
            <nav aria-label={t.archive} className="card p-4">
              <h3 className="text-xs uppercase tracking-wide text-ink/55 font-bold mb-2">{t.archive}</h3>
              <ul className="grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
                {index.map((n) => (
                  <li key={n.date}>
                    <button onClick={() => onDate(n.date)} aria-current={courant.date === n.date ? 'page' : undefined}
                      className={`w-full min-h-11 text-left rounded-xl px-3 py-2 text-sm ${courant.date === n.date ? 'bg-terracotta/12 font-semibold' : 'hover:bg-ink/5'}`}>
                      <span className="block text-xs text-ink/55">{t.n} {n.numero} · {n.date}</span>
                      <span className="block">{n.titre}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </>
      )}
    </div>
  )
}
