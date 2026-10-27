import { useState } from 'react'
import { Ico } from '../../Icones'
import { CATALOGUE, estCharge, nomPyodide, type Paquet } from './paquets'
import type { Lang } from '../../i18n'

const T = {
  fr: { titre: 'Bibliothèques', filtre: 'Chercher une bibliothèque', installes: 'Chargées', dispo: 'Disponibles', installer: 'Installer', encours: 'Chargement…', insere: 'Ajouter l’import', fait: 'Prête', pipTitre: 'Installer depuis PyPI (pip)', pipNom: 'nom-du-paquet', pipAide: 'Paquets Python purs, installés dans ton navigateur.', pipOk: (n: string) => `${n} installé`, pipKo: 'Échec', actualiser: 'Actualiser', aucun: 'Aucune bibliothèque ne correspond', categories: { donnees: 'Données', calcul: 'Calcul', ia: 'IA', image: 'Image', texte: 'Texte', outils: 'Outils' } },
  en: { titre: 'Libraries', filtre: 'Search a library', installes: 'Loaded', dispo: 'Available', installer: 'Install', encours: 'Loading…', insere: 'Add the import', fait: 'Ready', pipTitre: 'Install from PyPI (pip)', pipNom: 'package-name', pipAide: 'Pure Python packages, installed in your browser.', pipOk: (n: string) => `${n} installed`, pipKo: 'Failed', actualiser: 'Refresh', aucun: 'No library matches', categories: { donnees: 'Data', calcul: 'Maths', ia: 'AI', image: 'Image', texte: 'Text', outils: 'Tools' } },
}

export default function PaquetsVue({ lang, charges, onCharger, onInserer, onPip, onActualiser }: {
  lang: Lang; charges: string[]; onCharger: (nom: string) => Promise<{ ok: boolean; error?: string }>; onInserer: (ligne: string) => void
  onPip: (nom: string) => Promise<{ ok: boolean; error?: string }>; onActualiser: () => void
}) {
  const t = T[lang]
  const [filtre, setFiltre] = useState('')
  const [occupe, setOccupe] = useState<string[]>([])
  const [erreurs, setErreurs] = useState<Record<string, string>>({})
  const [pip, setPip] = useState('')
  const [pipEtat, setPipEtat] = useState<{ ok: boolean; texte: string } | null>(null)
  const [pipBusy, setPipBusy] = useState(false)

  const liste = CATALOGUE.filter((p) => !filtre || (p.id + ' ' + p[lang]).toLowerCase().includes(filtre.toLowerCase()))
  const prets = liste.filter((p) => estCharge(p.id, charges))
  const autres = liste.filter((p) => !estCharge(p.id, charges))

  const installer = async (p: Paquet) => {
    setOccupe((o) => [...o, p.id]); setErreurs((e) => { const n = { ...e }; delete n[p.id]; return n })
    const r = await onCharger(nomPyodide(p.id))
    setOccupe((o) => o.filter((x) => x !== p.id))
    if (!r.ok) setErreurs((e) => ({ ...e, [p.id]: r.error ?? t.pipKo }))
    onActualiser()
  }
  const lancerPip = async () => {
    const nom = pip.trim()
    if (!nom || pipBusy || !/^[A-Za-z0-9][A-Za-z0-9._-]*(\s+[A-Za-z0-9][A-Za-z0-9._-]*)*$/.test(nom)) return
    setPipBusy(true); setPipEtat(null)
    const r = await onPip(nom)
    setPipBusy(false)
    setPipEtat({ ok: r.ok, texte: r.ok ? t.pipOk(nom) : (r.error ?? t.pipKo) })
    if (r.ok) setPip('')
    onActualiser()
  }
  const carte = (p: Paquet, pret: boolean) => (
    <div key={p.id} className="px-3 py-2 hover:bg-[#2a2d2e] group">
      <div className="flex items-center gap-2">
        <span className="size-8 shrink-0 grid place-items-center rounded bg-[#2d2d30] border border-[var(--bd)]"><Ico n="pkg" className="size-4 text-[var(--ac2)]" /></span>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-white truncate">{p.id}</p>
          <p className="text-[11.5px] text-[var(--tx2)] truncate" title={p[lang]}>{p[lang]}</p>
        </div>
        {pret
          ? <span className="shrink-0 text-[11px] text-[var(--ok)] inline-flex items-center gap-1"><Ico n="check" className="size-3" />{t.fait}</span>
          : <button onClick={() => void installer(p)} disabled={occupe.includes(p.id)} className="shrink-0 h-6 px-2 rounded bg-[var(--ac)] hover:bg-[#1a8ae6] text-white text-[11.5px] font-medium disabled:opacity-60">{occupe.includes(p.id) ? t.encours : t.installer}</button>}
      </div>
      <div className="mt-1 flex items-center gap-2 pl-10">
        <code className="text-[11px] text-[var(--tx2)] truncate">{p.import}</code>
        <button onClick={() => onInserer(p.import)} className="ml-auto shrink-0 text-[11px] text-[var(--ac2)] hover:underline">{t.insere}</button>
      </div>
      {erreurs[p.id] && <p className="mt-1 pl-10 text-[11px] text-[var(--er)]">{erreurs[p.id]}</p>}
    </div>
  )
  return (
    <div className="h-full flex flex-col min-h-0 text-[var(--tx)]">
      <div className="shrink-0 h-9 px-3 flex items-center text-[11px] font-semibold uppercase tracking-wider text-[var(--tx2)]">
        <span className="flex-1">{t.titre}</span>
        <button onClick={onActualiser} title={t.actualiser} aria-label={t.actualiser} className="size-6 grid place-items-center rounded hover:bg-[#ffffff1a]"><Ico n="refresh" className="size-3.5" /></button>
      </div>
      <div className="px-3 pb-2"><input value={filtre} onChange={(e) => setFiltre(e.target.value)} placeholder={t.filtre} aria-label={t.filtre} className="w-full bg-[#3c3c3c] border border-transparent focus:border-[var(--ac)] px-2 py-1 text-[13px] outline-none text-white placeholder:text-[var(--tx3)]" /></div>
      <div className="flex-1 min-h-0 overflow-y-auto pb-3">
        {prets.length > 0 && <p className="px-3 pt-1 pb-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--tx2)]">{t.installes} ({prets.length})</p>}
        {prets.map((p) => carte(p, true))}
        {autres.length > 0 && <p className="px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--tx2)]">{t.dispo} ({autres.length})</p>}
        {autres.map((p) => carte(p, false))}
        {liste.length === 0 && <p className="px-3 pt-2 text-[12px] text-[var(--tx3)]">{t.aucun}</p>}
        <div className="mt-3 mx-3 pt-3 border-t border-[var(--bd)]">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--tx2)]">{t.pipTitre}</p>
          <p className="mt-1 text-[11.5px] text-[var(--tx3)]">{t.pipAide}</p>
          <form onSubmit={(e) => { e.preventDefault(); void lancerPip() }} className="mt-2 flex gap-1.5">
            <input value={pip} onChange={(e) => setPip(e.target.value)} placeholder={t.pipNom} aria-label={t.pipTitre} className="flex-1 min-w-0 bg-[#3c3c3c] border border-transparent focus:border-[var(--ac)] px-2 py-1 text-[13px] font-mono outline-none text-white placeholder:text-[var(--tx3)]" />
            <button disabled={!pip.trim() || pipBusy} className="h-7 px-2.5 rounded bg-[var(--ac)] hover:bg-[#1a8ae6] text-white text-[12px] font-medium disabled:opacity-50">{pipBusy ? '…' : t.installer}</button>
          </form>
          {pipEtat && <p className={`mt-1.5 text-[11.5px] ${pipEtat.ok ? 'text-[var(--ok)]' : 'text-[var(--er)]'}`} role="status">{pipEtat.texte}</p>}
        </div>
      </div>
    </div>
  )
}
