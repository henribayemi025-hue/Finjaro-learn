import { useMemo, useRef, useState, lazy, Suspense } from 'react'
import { Ico } from '../../Icones'
import { Md } from '../../Md'
import { idCellule, lireCarnet, type Carnet, type Cellule } from './fichiers'
import { redemarrerTerminal, terminalPython } from '../../runner'
import type { Lang } from '../../i18n'

const Editeur = lazy(() => import('../../atelier/Editeur'))
interface Sortie { n: number; sortie: string[]; valeur: string | null; erreur: string | null; images: string[] }
const T = {
  fr: { code: 'Code', texte: 'Texte', toutLancer: 'Tout exécuter', redemarrer: 'Redémarrer', vider: 'Effacer les sorties', lancer: 'Exécuter la cellule', supprimer: 'Supprimer la cellule', haut: 'Monter', bas: 'Descendre', ajouterCode: 'Ajouter une cellule de code', ajouterTexte: 'Ajouter une cellule de texte', modifier: 'Double-clic pour modifier', noyau: 'Noyau Python', pret: 'prêt', occupe: 'occupé', exportNb: 'Exporter (.ipynb)', vide: 'Texte vide : double-clic pour écrire' },
  en: { code: 'Code', texte: 'Text', toutLancer: 'Run all', redemarrer: 'Restart', vider: 'Clear outputs', lancer: 'Run cell', supprimer: 'Delete cell', haut: 'Move up', bas: 'Move down', ajouterCode: 'Add a code cell', ajouterTexte: 'Add a text cell', modifier: 'Double-click to edit', noyau: 'Python kernel', pret: 'idle', occupe: 'busy', exportNb: 'Export (.ipynb)', vide: 'Empty text: double-click to write' },
}

/** Un notebook : des cellules de code et de texte, qui partagent leurs variables (comme Jupyter). */
export default function Notebook({ lang, contenu, onChange }: { lang: Lang; contenu: string; onChange: (json: string) => void }) {
  const t = T[lang]
  const carnet = useMemo(() => lireCarnet(contenu), [contenu])
  const [sorties, setSorties] = useState<Record<string, Sortie>>({})
  const [actuelle, setActuelle] = useState<string | null>(null)
  const [edite, setEdite] = useState<string | null>(null)
  const compteur = useRef(0)
  const maj = (c: Carnet) => onChange(JSON.stringify(c))
  const modifier = (id: string, source: string) => maj({ cellules: carnet.cellules.map((x) => (x.id === id ? { ...x, source } : x)) })
  const ajouter = (type: Cellule['type'], apres?: string) => {
    const nv: Cellule = { id: idCellule(), type, source: '' }
    const i = apres ? carnet.cellules.findIndex((c) => c.id === apres) + 1 : carnet.cellules.length
    const l = [...carnet.cellules]; l.splice(i, 0, nv); maj({ cellules: l })
    if (type === 'texte') setEdite(nv.id)
  }
  const supprimer = (id: string) => { maj({ cellules: carnet.cellules.filter((c) => c.id !== id) }); setSorties((s) => { const n = { ...s }; delete n[id]; return n }) }
  const deplacer = (id: string, d: -1 | 1) => {
    const l = [...carnet.cellules]; const i = l.findIndex((c) => c.id === id); const j = i + d
    if (j < 0 || j >= l.length) return
    ;[l[i], l[j]] = [l[j], l[i]]; maj({ cellules: l })
  }
  const lancer = async (c: Cellule) => {
    if (c.type !== 'code' || actuelle) return
    setActuelle(c.id)
    const r = await terminalPython(c.source)
    compteur.current += 1
    setSorties((s) => ({ ...s, [c.id]: { n: compteur.current, sortie: r.output, valeur: r.valeur, erreur: r.error, images: r.images } }))
    setActuelle(null)
  }
  const toutLancer = async () => { for (const c of carnet.cellules) { if (c.type === 'code') await lancer(c) } }
  const exporter = () => {
    const nb = { nbformat: 4, nbformat_minor: 5, metadata: { kernelspec: { name: 'python3', display_name: 'Python 3', language: 'python' } }, cells: carnet.cellules.map((c) => c.type === 'texte' ? { cell_type: 'markdown', metadata: {}, source: c.source } : { cell_type: 'code', metadata: {}, execution_count: null, outputs: [], source: c.source }) }
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(nb, null, 1)], { type: 'application/json' })); a.download = 'notebook.ipynb'; a.click(); URL.revokeObjectURL(a.href)
  }
  const bouton = 'h-7 px-2 rounded flex items-center gap-1.5 text-[12px] text-[var(--tx)] hover:bg-[#ffffff14] disabled:opacity-40'
  return (
    <div className="h-full flex flex-col min-h-0">
      <div className="shrink-0 h-9 px-2 flex items-center gap-0.5 border-b border-[var(--bd)] bg-[var(--b1)]">
        <button className={bouton} onClick={() => ajouter('code')} title={t.ajouterCode}><Ico n="plus" className="size-3.5" />{t.code}</button>
        <button className={bouton} onClick={() => ajouter('texte')} title={t.ajouterTexte}><Ico n="plus" className="size-3.5" />{t.texte}</button>
        <span className="w-px h-4 bg-[var(--bd)] mx-1" />
        <button className={bouton} onClick={() => void toutLancer()} disabled={!!actuelle}><Ico n="zap" className="size-3.5" />{t.toutLancer}</button>
        <button className={bouton} onClick={() => { void redemarrerTerminal(); setSorties({}); compteur.current = 0 }}><Ico n="refresh" className="size-3.5" />{t.redemarrer}</button>
        <button className={bouton} onClick={() => setSorties({})}><Ico n="eraser" className="size-3.5" />{t.vider}</button>
        <button className={bouton} onClick={exporter}><Ico n="download" className="size-3.5" />{t.exportNb}</button>
        <span className="flex-1" />
        <span className="flex items-center gap-1.5 pr-2 text-[11.5px] text-[var(--tx2)]"><Ico n="cpu" className="size-3.5" />{t.noyau} · <span className={actuelle ? 'text-[var(--wa)]' : 'text-[var(--ok)]'}>{actuelle ? t.occupe : t.pret}</span></span>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto py-3 px-2 sm:px-4 space-y-2">
        {carnet.cellules.map((c, idx) => {
          const s = sorties[c.id]
          const hauteur = Math.min(420, Math.max(64, c.source.split('\n').length * 21 + 18))
          return (
            <div key={c.id} className="group relative flex gap-2">
              <div className="w-12 shrink-0 pt-1 text-right">
                {c.type === 'code' && (
                  <button onClick={() => void lancer(c)} disabled={!!actuelle} title={t.lancer} aria-label={t.lancer}
                    className="size-7 rounded-full inline-grid place-items-center text-[var(--tx2)] hover:text-white hover:bg-[#ffffff1a] disabled:opacity-40">
                    {actuelle === c.id ? <Ico n="spin" className="size-3.5" /> : <Ico n="play" className="size-3.5" />}
                  </button>
                )}
                {c.type === 'code' && <p className="text-[10.5px] font-mono text-[var(--tx3)] pr-1.5">[{s ? s.n : ' '}]</p>}
              </div>
              <div className="min-w-0 flex-1">
                <div className={`rounded-md border ${actuelle === c.id ? 'border-[var(--ac)]' : 'border-[var(--bd)] group-focus-within:border-[#4a4a4a]'} bg-[var(--b1)] overflow-hidden`}>
                  {c.type === 'code'
                    ? <div style={{ height: hauteur }}><Suspense fallback={<div className="p-3 text-[var(--tx3)] text-[12px]">…</div>}>
                      <Editeur chemin="cellule.py" valeur={c.source} onChange={(v) => modifier(c.id, v)} onCurseur={() => {}} onLancer={() => void lancer(c)} label={`${t.code} ${idx + 1}`} ide />
                    </Suspense></div>
                    : edite === c.id
                      ? <textarea autoFocus value={c.source} onChange={(e) => modifier(c.id, e.target.value)} onBlur={() => setEdite(null)} rows={Math.max(3, c.source.split('\n').length)} aria-label={`${t.texte} ${idx + 1}`}
                        className="w-full resize-y bg-[var(--b1)] p-3 text-[13px] font-mono text-[var(--tx)] outline-none" />
                      : <div onDoubleClick={() => setEdite(c.id)} title={t.modifier} className="p-3 text-[13.5px] cursor-text min-h-10">
                        {c.source.trim() ? <Md text={c.source} className="md-sombre" /> : <p className="text-[var(--tx3)] text-[12px]">{t.vide}</p>}
                      </div>}
                </div>
                {s && (
                  <div className="mt-1 px-3 py-2 font-mono text-[12.5px] leading-relaxed text-[var(--tx)]" aria-live="polite">
                    {s.sortie.length > 0 && <pre className="whitespace-pre-wrap">{s.sortie.join('\n')}</pre>}
                    {s.valeur !== null && <pre className="whitespace-pre-wrap text-[#4ec9b0]">{s.valeur}</pre>}
                    {s.images.map((src, i) => <img key={i} src={src} alt="" className="my-1 max-w-full max-h-[380px] rounded border border-[var(--bd)] bg-white" />)}
                    {s.erreur && <pre className="whitespace-pre-wrap text-[var(--er)]">{s.erreur}</pre>}
                  </div>
                )}
              </div>
              <div className="absolute -right-0.5 top-0 hidden group-hover:flex items-center gap-0.5 rounded bg-[var(--b2)] border border-[var(--bd)] px-0.5 shadow">
                <button onClick={() => deplacer(c.id, -1)} title={t.haut} aria-label={t.haut} className="size-6 grid place-items-center rounded hover:bg-[#ffffff1a] text-[var(--tx2)]"><Ico n="up" className="size-3.5" /></button>
                <button onClick={() => deplacer(c.id, 1)} title={t.bas} aria-label={t.bas} className="size-6 grid place-items-center rounded hover:bg-[#ffffff1a] text-[var(--tx2)]"><Ico n="down" className="size-3.5" /></button>
                <button onClick={() => ajouter('code', c.id)} title={t.ajouterCode} aria-label={t.ajouterCode} className="size-6 grid place-items-center rounded hover:bg-[#ffffff1a] text-[var(--tx2)]"><Ico n="plus" className="size-3.5" /></button>
                <button onClick={() => supprimer(c.id)} title={t.supprimer} aria-label={t.supprimer} className="size-6 grid place-items-center rounded hover:bg-[#ffffff1a] text-[var(--tx2)]"><Ico n="trash" className="size-3.5" /></button>
              </div>
            </div>
          )
        })}
        <div className="flex gap-2 pl-14 pt-1">
          <button onClick={() => ajouter('code')} className="h-7 px-2.5 rounded border border-dashed border-[var(--bd)] text-[12px] text-[var(--tx2)] hover:text-white hover:border-[#5a5a5a]"><Ico n="plus" className="size-3 mr-1" />{t.code}</button>
          <button onClick={() => ajouter('texte')} className="h-7 px-2.5 rounded border border-dashed border-[var(--bd)] text-[12px] text-[var(--tx2)] hover:text-white hover:border-[#5a5a5a]"><Ico n="plus" className="size-3 mr-1" />{t.texte}</button>
        </div>
      </div>
    </div>
  )
}
