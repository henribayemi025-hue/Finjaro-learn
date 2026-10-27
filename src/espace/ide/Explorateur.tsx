import { useMemo, useRef, useState } from 'react'
import { Ico, type NomIcone } from '../../Icones'
import { extension, nomLibre, nomValide, type Fichier } from './fichiers'
import type { Lang } from '../../i18n'

const T = {
  fr: { projet: 'Projet', nouveau: 'Nouveau fichier', nouveauCarnet: 'Nouveau notebook', importer: 'Importer un fichier', nom: 'nom-du-fichier.py', invalide: 'Nom invalide (lettres, chiffres, _ - . /)', existe: 'Ce fichier existe déjà', renommer: 'Renommer', supprimer: 'Supprimer', confirme: 'Supprimer ce fichier ?', lecon: 'fichier de la leçon', vide: 'Aucun autre fichier. Crée un module (utils.py), un notebook ou importe un csv.', trop: 'Fichier trop gros (1 Mo au plus)', texte: 'Seuls les fichiers texte (py, csv, json, md…) sont acceptés', ouvrir: 'Ouvrir', dossier: 'dossier' },
  en: { projet: 'Project', nouveau: 'New file', nouveauCarnet: 'New notebook', importer: 'Import a file', nom: 'file-name.py', invalide: 'Invalid name (letters, digits, _ - . /)', existe: 'This file already exists', renommer: 'Rename', supprimer: 'Delete', confirme: 'Delete this file?', lecon: 'lesson file', vide: 'No other file. Create a module (utils.py), a notebook, or import a csv.', trop: 'File too large (1 MB max)', texte: 'Only text files (py, csv, json, md…) are accepted', ouvrir: 'Open', dossier: 'folder' },
}

export function iconeFichier(nom: string): { n: NomIcone; c: string } {
  const e = extension(nom)
  if (e === 'py') return { n: 'code', c: 'text-[#4b8bbe]' }
  if (e === 'ipynb') return { n: 'notebook', c: 'text-[#f37726]' }
  if (e === 'csv') return { n: 'table', c: 'text-[#3fb950]' }
  if (e === 'json') return { n: 'file', c: 'text-[#cca700]' }
  if (e === 'md') return { n: 'book', c: 'text-[#3794ff]' }
  if (e === 'sql') return { n: 'db', c: 'text-[#d19a66]' }
  return { n: 'file', c: 'text-[#9d9d9d]' }
}

export default function Explorateur({ lang, titre, nomMain, fichiers, actif, onOuvrir, onCreer, onSupprimer, onRenommer, onImporter, extras }: {
  lang: Lang; titre: string; nomMain: string; fichiers: Fichier[]; actif: string
  onOuvrir: (nom: string) => void; onCreer: (nom: string) => void; onSupprimer: (nom: string) => void; onRenommer: (ancien: string, nouveau: string) => void
  onImporter: (liste: FileList) => string | void
  /** Éléments de plus (la base de données d'un exercice SQL, le bac à prompts, les notes). */
  extras?: { id: string; nom: string; icone: NomIcone }[]
}) {
  const t = T[lang]
  const [creation, setCreation] = useState<'' | 'fichier' | 'carnet'>('')
  const [valeur, setValeur] = useState('')
  const [renomme, setRenomme] = useState<string | null>(null)
  const [avis, setAvis] = useState('')
  const [fermes, setFermes] = useState<string[]>([])
  const choisir = useRef<HTMLInputElement>(null)
  const pris = useMemo(() => [nomMain, ...fichiers.map((f) => f.nom)], [nomMain, fichiers])

  const valider = () => {
    const brut = valeur.trim()
    if (!brut) { setCreation(''); return }
    const nom = creation === 'carnet' && !brut.includes('.') ? brut + '.ipynb' : brut
    if (!nomValide(nom)) { setAvis(t.invalide); return }
    if (pris.includes(nom)) { setAvis(t.existe); return }
    onCreer(nom); setCreation(''); setValeur(''); setAvis('')
  }
  const validerRenom = (ancien: string) => {
    const nom = valeur.trim()
    if (!nom || nom === ancien) { setRenomme(null); return }
    if (!nomValide(nom)) { setAvis(t.invalide); return }
    if (pris.includes(nom)) { setAvis(t.existe); return }
    onRenommer(ancien, nom); setRenomme(null); setValeur(''); setAvis('')
  }
  // Arbre : les dossiers d'abord, les fichiers ensuite, chacun dans l'ordre alphabétique.
  const arbre = useMemo(() => {
    const racine: { dossiers: Record<string, Fichier[]>; fichiers: Fichier[] } = { dossiers: {}, fichiers: [] }
    for (const f of [...fichiers].sort((a, b) => a.nom.localeCompare(b.nom))) {
      const i = f.nom.indexOf('/')
      if (i > 0) (racine.dossiers[f.nom.slice(0, i)] ??= []).push(f)
      else racine.fichiers.push(f)
    }
    return racine
  }, [fichiers])

  const ligne = (nom: string, affiche: string, profond: boolean, verrou = false) => {
    const ic = iconeFichier(nom)
    const estActif = nom === actif
    return (
      <div key={nom} className={`group flex items-center h-[26px] pr-1 text-[13px] ${estActif ? 'bg-[#37373d] text-white' : 'text-[var(--tx)] hover:bg-[#2a2d2e]'}`} style={{ paddingLeft: profond ? 28 : 12 }}>
        {renomme === nom ? (
          <input autoFocus value={valeur} onChange={(e) => { setValeur(e.target.value); setAvis('') }} onBlur={() => validerRenom(nom)}
            onKeyDown={(e) => { if (e.key === 'Enter') validerRenom(nom); if (e.key === 'Escape') { setRenomme(null); setAvis('') } }}
            className="flex-1 min-w-0 bg-[#3c3c3c] border border-[var(--ac)] text-[13px] px-1 outline-none text-white" aria-label={t.renommer} />
        ) : (
          <button onClick={() => onOuvrir(nom)} className="flex-1 min-w-0 flex items-center gap-1.5 text-left h-full" title={verrou ? t.lecon : nom}>
            <Ico n={ic.n} className={`size-3.5 ${ic.c}`} /><span className="truncate">{affiche}</span>
            {verrou && <span className="ml-1 text-[10px] uppercase tracking-wide text-[var(--tx3)]">{t.lecon}</span>}
          </button>
        )}
        {!verrou && renomme !== nom && (
          <span className="hidden group-hover:flex items-center">
            <button onClick={() => { setRenomme(nom); setValeur(nom) }} aria-label={t.renommer} title={t.renommer} className="size-5 grid place-items-center rounded hover:bg-[#ffffff1a] text-[var(--tx2)]"><Ico n="pencil" className="size-3" /></button>
            <button onClick={() => { if (window.confirm(t.confirme)) onSupprimer(nom) }} aria-label={t.supprimer} title={t.supprimer} className="size-5 grid place-items-center rounded hover:bg-[#ffffff1a] text-[var(--tx2)]"><Ico n="trash" className="size-3" /></button>
          </span>
        )}
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col min-h-0 text-[var(--tx)]">
      <div className="shrink-0 h-9 px-3 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--tx2)]">
        <span className="flex-1">{t.projet}</span>
        <button onClick={() => { setCreation('fichier'); setValeur(''); setAvis('') }} title={t.nouveau} aria-label={t.nouveau} className="size-6 grid place-items-center rounded hover:bg-[#ffffff1a]"><Ico n="plus" className="size-3.5" /></button>
        <button onClick={() => { setCreation('carnet'); setValeur(''); setAvis('') }} title={t.nouveauCarnet} aria-label={t.nouveauCarnet} className="size-6 grid place-items-center rounded hover:bg-[#ffffff1a]"><Ico n="notebook" className="size-3.5" /></button>
        <button onClick={() => choisir.current?.click()} title={t.importer} aria-label={t.importer} className="size-6 grid place-items-center rounded hover:bg-[#ffffff1a]"><Ico n="upload" className="size-3.5" /></button>
        <input ref={choisir} type="file" multiple className="hidden" accept=".py,.csv,.json,.md,.txt,.sql,.js,.html,.css,.yaml,.yml,.toml,.ipynb" onChange={(e) => { if (e.target.files?.length) setAvis(onImporter(e.target.files) || ''); e.target.value = '' }} />
      </div>
      <div className="px-3 pb-1 flex items-center gap-1 text-[12px] font-semibold text-[var(--tx)]"><Ico n="down" className="size-3.5" /><span className="truncate">{titre}</span></div>
      <div className="flex-1 min-h-0 overflow-y-auto pb-3">
        {creation && (
          <div className="px-3 py-1">
            <input autoFocus value={valeur} onChange={(e) => { setValeur(e.target.value); setAvis('') }} placeholder={creation === 'carnet' ? 'carnet.ipynb' : t.nom}
              onBlur={() => { if (!valeur.trim()) { setCreation(''); setAvis('') } }}
              onKeyDown={(e) => { if (e.key === 'Enter') valider(); if (e.key === 'Escape') { setCreation(''); setAvis('') } }}
              className="w-full bg-[#3c3c3c] border border-[var(--ac)] text-[13px] px-1.5 py-0.5 outline-none text-white placeholder:text-[var(--tx3)]" aria-label={t.nouveau} />
          </div>
        )}
        {avis && <p className="px-3 py-1 text-[11.5px] text-[var(--er)]" role="alert">{avis}</p>}
        {ligne(nomMain, nomMain, false, true)}
        {Object.entries(arbre.dossiers).map(([d, liste]) => (
          <div key={d}>
            <button onClick={() => setFermes((x) => (x.includes(d) ? x.filter((y) => y !== d) : [...x, d]))} className="w-full flex items-center gap-1.5 h-[26px] px-3 text-[13px] hover:bg-[#2a2d2e] text-left">
              <Ico n={fermes.includes(d) ? 'right' : 'down'} className="size-3.5" /><Ico n="folder" className="size-3.5 text-[#c09553]" /><span className="truncate">{d}</span>
            </button>
            {!fermes.includes(d) && liste.map((f) => ligne(f.nom, f.nom.slice(d.length + 1), true))}
          </div>
        ))}
        {arbre.fichiers.map((f) => ligne(f.nom, f.nom, false))}
        {extras?.map((x) => (
          <button key={x.id} onClick={() => onOuvrir(x.id)} className={`w-full flex items-center gap-1.5 h-[26px] px-3 text-[13px] text-left ${actif === x.id ? 'bg-[#37373d] text-white' : 'hover:bg-[#2a2d2e]'}`}>
            <Ico n={x.icone} className="size-3.5 text-[#9d9d9d]" /><span className="truncate">{x.nom}</span>
          </button>
        ))}
        {fichiers.length === 0 && <p className="px-3 pt-3 text-[12px] leading-relaxed text-[var(--tx3)]">{t.vide}</p>}
      </div>
    </div>
  )
}

/** Un nom libre pour un fichier importé, et son contenu (texte seulement, 1 Mo au plus). */
export async function lireFichierImporte(f: File, pris: string[]): Promise<{ nom: string; contenu: string } | { erreur: 'trop' | 'texte' }> {
  if (f.size > 1_000_000) return { erreur: 'trop' }
  if (!/\.(py|csv|json|md|txt|sql|js|html|css|ya?ml|toml|ipynb)$/i.test(f.name)) return { erreur: 'texte' }
  const contenu = await f.text()
  if (contenu.includes('\u0000')) return { erreur: 'texte' }
  const base = f.name.replace(/[^A-Za-z0-9_\-.]/g, '_').replace(/^\.+/, '')
  return { nom: nomLibre(base || 'fichier.txt', pris), contenu }
}
