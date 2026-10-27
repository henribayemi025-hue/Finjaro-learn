import { useEffect, useMemo, useRef, useState } from 'react'
import { Ico, type NomIcone } from '../../Icones'
import type { Lang } from '../../i18n'

export interface Commande { id: string; titre: string; section: string; icone?: NomIcone; raccourci?: string; mots?: string; run: () => void }

/** Une correspondance « floue » : les lettres tapées doivent apparaître dans l'ordre. Plus le score est bas, mieux c'est. */
function score(texte: string, q: string): number {
  if (!q) return 0
  const a = texte.toLowerCase(), b = q.toLowerCase()
  const direct = a.indexOf(b)
  if (direct >= 0) return direct
  let i = 0, dernier = -1, trou = 0
  for (const ch of b) { const j = a.indexOf(ch, i); if (j < 0) return -1; if (dernier >= 0) trou += j - dernier - 1; dernier = j; i = j + 1 }
  return 50 + trou
}

export default function Palette({ lang, ouverte, onFermer, commandes }: { lang: Lang; ouverte: boolean; onFermer: () => void; commandes: Commande[] }) {
  const [q, setQ] = useState('')
  const [sel, setSel] = useState(0)
  const liste = useRef<HTMLDivElement>(null)
  useEffect(() => { if (ouverte) { setQ(''); setSel(0) } }, [ouverte])
  const resultats = useMemo(() => {
    const brut = q.startsWith('>') ? q.slice(1).trim() : q.trim()
    return commandes.map((c) => ({ c, s: score(c.titre + ' ' + c.section + ' ' + (c.mots ?? ''), brut) })).filter((x) => x.s >= 0).sort((a, b) => a.s - b.s).slice(0, 60).map((x) => x.c)
  }, [q, commandes])
  useEffect(() => { setSel(0) }, [q])
  useEffect(() => { liste.current?.querySelector('[data-actif="1"]')?.scrollIntoView({ block: 'nearest' }) }, [sel])
  if (!ouverte) return null
  const lancer = (c: Commande | undefined) => { if (!c) return; onFermer(); setTimeout(c.run, 0) }
  return (
    <div className="fixed inset-0 z-[60] flex justify-center items-start pt-[12vh] bg-black/30" onMouseDown={onFermer} role="dialog" aria-modal="true" aria-label={lang === 'fr' ? 'Palette de commandes' : 'Command palette'}>
      <div className="w-[min(640px,94vw)] rounded-lg overflow-hidden border border-[#454545] bg-[#252526] shadow-2xl shadow-black/60" onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 px-3 border-b border-[#2b2b2b]">
          <Ico n="command" className="size-4 text-[var(--tx2)]" />
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} aria-label={lang === 'fr' ? 'Chercher une commande, un fichier, une bibliothèque' : 'Search a command, file or library'}
            placeholder={lang === 'fr' ? 'Chercher une commande, un fichier, une bibliothèque…' : 'Search a command, file or library…'}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => Math.min(resultats.length - 1, s + 1)) }
              else if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => Math.max(0, s - 1)) }
              else if (e.key === 'Enter') { e.preventDefault(); lancer(resultats[sel]) }
              else if (e.key === 'Escape') { e.preventDefault(); onFermer() }
            }}
            className="flex-1 min-w-0 bg-transparent py-2.5 text-[14px] text-white outline-none placeholder:text-[var(--tx3)]" />
          <kbd className="text-[10.5px] text-[var(--tx3)] border border-[#3c3c3c] rounded px-1">Esc</kbd>
        </div>
        <div ref={liste} className="max-h-[52vh] overflow-y-auto py-1" role="listbox">
          {resultats.length === 0 && <p className="px-4 py-6 text-center text-[13px] text-[var(--tx3)]">{lang === 'fr' ? 'Aucun résultat' : 'No results'}</p>}
          {resultats.map((c, i) => {
            const nouvelle = i === 0 || resultats[i - 1].section !== c.section
            return (
              <div key={c.id}>
                {nouvelle && <p className="px-3 pt-2 pb-1 text-[10.5px] font-semibold uppercase tracking-wider text-[var(--tx3)]">{c.section}</p>}
                <button role="option" aria-selected={i === sel} data-actif={i === sel ? '1' : '0'} onMouseMove={() => setSel(i)} onClick={() => lancer(c)}
                  className={`w-full flex items-center gap-2.5 px-3 h-8 text-left text-[13px] ${i === sel ? 'bg-[#04395e] text-white' : 'text-[var(--tx)]'}`}>
                  <Ico n={c.icone ?? 'command'} className="size-3.5 text-[var(--tx2)]" />
                  <span className="flex-1 truncate">{c.titre}</span>
                  {c.raccourci && <kbd className="text-[10.5px] text-[var(--tx2)] border border-[#3c3c3c] rounded px-1.5 bg-[#1f1f1f]">{c.raccourci}</kbd>}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
