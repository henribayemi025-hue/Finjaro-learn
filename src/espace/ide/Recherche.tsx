import { useMemo, useState } from 'react'
import { Ico } from '../../Icones'
import type { Lang } from '../../i18n'

const T = {
  fr: { placeholder: 'Rechercher dans le projet', casse: 'Respecter la casse', regex: 'Expression régulière', aucun: 'Aucun résultat', vide: 'Tape un mot pour chercher dans tous les fichiers du projet.', resultats: (n: number, f: number) => `${n} résultat${n > 1 ? 's' : ''} dans ${f} fichier${f > 1 ? 's' : ''}`, invalide: 'Expression invalide', limite: 'Résultats limités aux 200 premiers' },
  en: { placeholder: 'Search the project', casse: 'Match case', regex: 'Regular expression', aucun: 'No results', vide: 'Type a word to search all the files of the project.', resultats: (n: number, f: number) => `${n} result${n > 1 ? 's' : ''} in ${f} file${f > 1 ? 's' : ''}`, invalide: 'Invalid expression', limite: 'Results limited to the first 200' },
}
export interface Source { nom: string; contenu: string }

export default function Recherche({ lang, sources, onAller }: { lang: Lang; sources: Source[]; onAller: (nom: string, ligne: number) => void }) {
  const t = T[lang]
  const [q, setQ] = useState('')
  const [casse, setCasse] = useState(false)
  const [regex, setRegex] = useState(false)
  const { groupes, total, erreur, tronque } = useMemo(() => {
    const vide = { groupes: [] as { nom: string; lignes: { n: number; texte: string; a: number; b: number }[] }[], total: 0, erreur: false, tronque: false }
    if (!q) return vide
    let re: RegExp
    try { re = new RegExp(regex ? q : q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), casse ? 'g' : 'gi') } catch { return { ...vide, erreur: true } }
    const groupes: typeof vide.groupes = []
    let total = 0, tronque = false
    for (const s of sources) {
      const lignes: { n: number; texte: string; a: number; b: number }[] = []
      s.contenu.split('\n').forEach((texte, i) => {
        re.lastIndex = 0
        const m = re.exec(texte)
        if (m && m[0].length > 0) { if (total < 200) { lignes.push({ n: i + 1, texte, a: m.index, b: m.index + m[0].length }); total++ } else tronque = true }
      })
      if (lignes.length) groupes.push({ nom: s.nom, lignes })
    }
    return { groupes, total, erreur: false, tronque }
  }, [q, casse, regex, sources])

  const bouton = (actif: boolean) => `h-6 px-1.5 rounded text-[11px] font-mono border ${actif ? 'border-[var(--ac)] bg-[#0078d433] text-white' : 'border-transparent text-[var(--tx2)] hover:bg-[#ffffff14]'}`
  return (
    <div className="h-full flex flex-col min-h-0 text-[var(--tx)]">
      <div className="shrink-0 h-9 px-3 flex items-center text-[11px] font-semibold uppercase tracking-wider text-[var(--tx2)]">{lang === 'fr' ? 'Recherche' : 'Search'}</div>
      <div className="px-3 pb-2">
        <div className="flex items-center gap-1 bg-[#3c3c3c] border border-transparent focus-within:border-[var(--ac)] px-1.5">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.placeholder} aria-label={t.placeholder} autoFocus className="flex-1 min-w-0 bg-transparent py-1 text-[13px] outline-none text-white placeholder:text-[var(--tx3)]" />
          <button onClick={() => setCasse((x) => !x)} className={bouton(casse)} title={t.casse} aria-pressed={casse}>Aa</button>
          <button onClick={() => setRegex((x) => !x)} className={bouton(regex)} title={t.regex} aria-pressed={regex}>.*</button>
        </div>
        {erreur && <p className="mt-1 text-[11.5px] text-[var(--er)]">{t.invalide}</p>}
        {!erreur && q && <p className="mt-1.5 text-[11.5px] text-[var(--tx2)]">{total ? t.resultats(total, groupes.length) : t.aucun}</p>}
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto pb-3">
        {!q && <p className="px-3 text-[12px] leading-relaxed text-[var(--tx3)]">{t.vide}</p>}
        {groupes.map((g) => (
          <div key={g.nom}>
            <div className="px-3 h-6 flex items-center gap-1 text-[12px] font-semibold"><Ico n="down" className="size-3" /><span className="truncate">{g.nom}</span><span className="ml-auto text-[10.5px] rounded-full bg-[#4d4d4d] px-1.5 text-white">{g.lignes.length}</span></div>
            {g.lignes.map((l) => (
              <button key={g.nom + l.n} onClick={() => onAller(g.nom, l.n)} className="w-full text-left pl-7 pr-2 h-[22px] flex items-center gap-2 text-[12px] hover:bg-[#2a2d2e] font-mono">
                <span className="shrink-0 text-[var(--tx3)] w-6 text-right">{l.n}</span>
                <span className="truncate text-[var(--tx)]">{l.texte.slice(Math.max(0, l.a - 12), l.a)}<mark className="bg-[#ea5c0055] text-white rounded-sm">{l.texte.slice(l.a, l.b)}</mark>{l.texte.slice(l.b, l.b + 60)}</span>
              </button>
            ))}
          </div>
        ))}
        {tronque && <p className="px-3 pt-2 text-[11.5px] text-[var(--tx3)]">{t.limite}</p>}
      </div>
    </div>
  )
}
