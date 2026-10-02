import { lazy, Suspense, useEffect, useRef, useState } from 'react'
const AtelierProjet = lazy(() => import('./atelier/AtelierProjet'))
import { lessons } from './lessons'
import { listeProjets, sauverProjet, supprimerProjet, nouvelId, importer, type Projet } from './atelierStore'
import { listeCompte, chargerCompte, supprimerCompte, nonEnregistre, type ResumeCompte } from './atelierCompte'
import { supabase } from './supabase'
import type { Lang } from './i18n'

const T = {
  fr: {
    title: 'Atelier', sub: 'Tes projets de code, avec plusieurs fichiers. Ils s’enregistrent sur cet appareil ; connecte-toi pour les garder aussi dans ton compte et les retrouver ailleurs.',
    cloud: 'Dans mon compte', cloudSave: 'Enregistrer dans mon compte', cloudShort: 'Compte', cloudSaving: 'Envoi…', cloudSaved: 'Enregistré dans ton compte', cloudDirty: 'Modifications pas encore dans ton compte',
    cloudLogin: 'Connecte-toi pour garder tes projets dans ton compte et les retrouver sur tous tes appareils.', login: 'Se connecter', cloudNone: 'Rien dans ton compte pour l’instant : ouvre un projet et « Enregistrer dans mon compte ».',
    cloudDel: 'Supprimer du compte', confirmCloudDel: 'Supprimer ce projet de ton compte ? (la copie sur cet appareil, s’il y en a une, reste)', cloudErr: 'Impossible de lire ton compte pour l’instant.',
    cloudNewer: 'La version de ton compte est plus récente que celle de cet appareil, qui a des modifications non enregistrées. Remplacer la copie de cet appareil ?', limits: '30 projets, 50 fichiers par projet, 5 Mo au total',
    newPy: '+ Projet Python', newJs: '+ Projet JavaScript', import: 'Importer un projet', templates: 'Partir d’un modèle', mine: 'Mes projets', none: 'Aucun projet pour l’instant.',
    open: 'Ouvrir', del: 'Supprimer', confirmDel: 'Supprimer ce projet de l’appareil ? (exporte-le d’abord si tu veux le garder)', back: 'Atelier', run: 'Lancer', export: 'Exporter',
    files: 'Fichiers', addFile: '+ Fichier', rename: 'Renommer', delFile: 'Supprimer le fichier', main: 'principal', setMain: 'En faire le fichier principal', output: 'Console',
    nothing: '(rien affiché)', loadingPy: 'Chargement de Python… (une seule fois)', badImport: 'Ce fichier n’est pas un projet de l’Atelier.', fileName: 'Nom du fichier (ex. outils.py)',
    badName: 'Nom invalide ou déjà pris.', notFound: 'Projet introuvable sur cet appareil.', untitled: 'Mon projet', lastSave: 'Enregistré sur l’appareil', hint: 'Lance le projet : la console affiche ici le résultat du fichier principal.',
  },
  en: {
    title: 'Workshop', sub: 'Your code projects, with several files. They are saved on this device; sign in to keep them in your account too and find them elsewhere.',
    cloud: 'In my account', cloudSave: 'Save to my account', cloudShort: 'Account', cloudSaving: 'Sending…', cloudSaved: 'Saved to your account', cloudDirty: 'Changes not yet in your account',
    cloudLogin: 'Sign in to keep your projects in your account and find them on all your devices.', login: 'Sign in', cloudNone: 'Nothing in your account yet: open a project and “Save to my account”.',
    cloudDel: 'Delete from account', confirmCloudDel: 'Delete this project from your account? (the copy on this device, if any, stays)', cloudErr: 'Cannot read your account right now.',
    cloudNewer: 'Your account’s version is newer than this device’s, which has unsaved changes. Replace this device’s copy?', limits: '30 projects, 50 files per project, 5 MB in total',
    newPy: '+ Python project', newJs: '+ JavaScript project', import: 'Import a project', templates: 'Start from a template', mine: 'My projects', none: 'No project yet.',
    open: 'Open', del: 'Delete', confirmDel: 'Delete this project from the device? (export it first to keep it)', back: 'Workshop', run: 'Run', export: 'Export',
    files: 'Files', addFile: '+ File', rename: 'Rename', delFile: 'Delete file', main: 'main', setMain: 'Make it the main file', output: 'Console',
    nothing: '(nothing printed)', loadingPy: 'Loading Python… (only once)', badImport: 'This file is not a Workshop project.', fileName: 'File name (e.g. tools.py)',
    badName: 'Invalid or already used name.', notFound: 'Project not found on this device.', untitled: 'My project', lastSave: 'Saved on the device', hint: 'Run the project: the console shows the main file’s output here.',
  },
} as const

const sol = (id: string) => lessons.find((l) => l.id === id)?.solution ?? ''
/** Modèles de départ : le code des projets guidés (déjà vérifié) + un fichier principal qui s'en sert. */
const MODELES = [
  { ico: '🧮', fr: 'Calculatrice', en: 'Calculator', fichiers: () => [
    { chemin: 'main.py', contenu: "from calculatrice import Calculatrice\n\nc = Calculatrice()\nfor operation in ['2 + 3', '* 4', '/ 0', '- 1']:\n    print(operation, '→', c.entre(operation))\n" },
    { chemin: 'calculatrice.py', contenu: sol('pg-calc-4') + '\n' },
  ] },
  { ico: '🤖', fr: 'Robot explorateur', en: 'Explorer robot', fichiers: () => [
    { chemin: 'main.py', contenu: "from robot import deplace, retour\n\nprint('Position finale :', deplace('AADAAGA'))\nprint('Pas pour rentrer à la base :', retour((3, 2), (0, 0), {(1, 0), (1, 1)}))\n" },
    { chemin: 'robot.py', contenu: sol('pg-robot-4') + '\n' },
  ] },
  { ico: '💬', fr: 'Assistant FAQ', en: 'FAQ assistant', fichiers: () => [
    { chemin: 'main.py', contenu: "from faq import repond\n\nFAQ = [\n    ('Quels sont vos horaires ?', 'Du lundi au samedi, de 8 h à 18 h.'),\n    ('Comment payer ?', 'Par carte ou en espèces.'),\n]\n\nfor q in ['Vos horaires samedi ?', 'Je peux payer par carte ?', 'Quelle est la météo ?']:\n    print(q, '→', repond(q, FAQ))\n" },
    { chemin: 'faq.py', contenu: sol('pg-faq-3') + '\n' },
  ] },
] as const

export default function Atelier({ lang, id, ai, signedIn, onOpen, onBack }: { lang: Lang; id: string | null; ai: boolean; signedIn: boolean; onOpen: (id: string) => void; onBack: () => void }) {
  const t = T[lang]
  const [liste, setListe] = useState<Projet[] | null>(null)
  const [note, setNote] = useState('')
  const fichierRef = useRef<HTMLInputElement>(null)
  const compteOn = !!supabase && signedIn
  const [compte, setCompte] = useState<ResumeCompte[] | null>(null)
  const [compteErr, setCompteErr] = useState('')

  useEffect(() => { if (!id) listeProjets().then(setListe).catch(() => setListe([])) }, [id])
  useEffect(() => {
    setCompte(null); setCompteErr('')
    if (id || !compteOn) return
    listeCompte().then(setCompte).catch(() => { setCompte([]); setCompteErr(t.cloudErr) })
  }, [id, compteOn, t.cloudErr])

  const creer = async (proj: Omit<Projet, 'id' | 'maj'>) => {
    const np: Projet = { ...proj, id: nouvelId(), maj: new Date().toISOString() }
    await sauverProjet(np)
    onOpen(np.id)
  }

  /** Ouvre un projet du compte : la copie de l'appareil si elle est à jour, sinon la version du compte. */
  const ouvrirCompte = async (r: ResumeCompte) => {
    const locaux = await listeProjets()
    const local = locaux.find((x) => x.compteId === r.id)
    if (local && local.compteMaj && local.compteMaj >= r.updated_at) { onOpen(local.id); return }
    if (local && nonEnregistre(local) && !confirm(t.cloudNewer)) { onOpen(local.id); return }
    try {
      const proj = await chargerCompte(r.id, local?.id)
      await sauverProjet(proj); onOpen(proj.id)
    } catch { setCompteErr(t.cloudErr) }
  }

  // ───────── Liste des projets ─────────
  if (!id) {
    return (
      <div className="space-y-6">
        <header className="card hero-glow p-5 sm:p-7 space-y-3 rise">
          <div className="flex items-center gap-3">
            <span aria-hidden="true" className="size-12 rounded-2xl grad grid place-items-center text-2xl shadow-md">🛠️</span>
            <h2 className="font-display text-3xl">{t.title}</h2>
          </div>
          <p className="text-ink/70">{t.sub}</p>
          <div className="flex flex-wrap gap-2">
            <button className="btn btn-primary" onClick={() => creer({ titre: t.untitled, lang: 'py', principal: 'main.py', fichiers: [{ chemin: 'main.py', contenu: "print('Bonjour !')\n" }] })}>{t.newPy}</button>
            <button className="btn" onClick={() => creer({ titre: t.untitled, lang: 'js', principal: 'main.js', fichiers: [{ chemin: 'main.js', contenu: "console.log('Bonjour !')\n" }] })}>{t.newJs}</button>
            <button className="btn" onClick={() => fichierRef.current?.click()}>⤒ {t.import}</button>
            <input ref={fichierRef} type="file" accept=".json,application/json" className="hidden" aria-label={t.import}
              onChange={async (e) => {
                const f = e.target.files?.[0]; e.target.value = ''
                if (!f) return
                const proj = importer(await f.text())
                if (!proj) { setNote(t.badImport); return }
                await sauverProjet(proj); onOpen(proj.id)
              }} />
          </div>
          {note && <p className="text-sm text-terracotta-dark" role="alert">{note}</p>}
        </header>
        <section>
          <h3 className="font-display text-xl mb-3">{t.templates}</h3>
          <ul className="grid gap-3 sm:grid-cols-3">
            {MODELES.map((m) => (
              <li key={m.fr}>
                <button className="card w-full p-4 text-left flex items-center gap-3 hover:-translate-y-0.5 transition"
                  onClick={() => creer({ titre: m[lang], lang: 'py', principal: 'main.py', fichiers: m.fichiers().map((f) => ({ ...f })) })}>
                  <span aria-hidden="true" className="size-11 rounded-xl bg-terracotta/12 grid place-items-center text-xl">{m.ico}</span>
                  <span className="font-bold">{m[lang]}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
        {supabase && (
          <section aria-labelledby="atelier-compte">
            <h3 id="atelier-compte" className="font-display text-xl mb-1">☁ {t.cloud}</h3>
            <p className="text-xs text-ink/55 mb-3">{t.limits}</p>
            {!signedIn ? (
              <div className="card p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <p className="flex-1 text-sm text-ink/75">{t.cloudLogin}</p>
                <button className="btn btn-primary" onClick={() => window.dispatchEvent(new Event('learn:login'))}>{t.login}</button>
              </div>
            ) : (
              <>
                {compteErr && <p className="text-sm text-terracotta-dark mb-2" role="alert">{compteErr}</p>}
                {compte === null && !compteErr && <p className="text-sm text-ink/60" role="status">…</p>}
                {compte && !compte.length && !compteErr && <p className="text-sm text-ink/60">{t.cloudNone}</p>}
                <ul className="grid gap-2">
                  {(compte ?? []).map((x) => (
                    <li key={x.id} className="card p-3 flex items-center gap-2 sm:gap-3 min-w-0">
                      <span aria-hidden="true" className="chip hidden sm:inline-flex">{x.langage === 'py' ? '🐍 Python' : '⚡ JS'}</span>
                      <span className="flex-1 min-w-0">
                        <span className="block font-semibold truncate">{x.titre}</span>
                        <span className="block text-xs text-ink/55">☁ {new Date(x.updated_at).toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-GB')}</span>
                      </span>
                      <button className="btn" onClick={() => ouvrirCompte(x)}>{t.open}</button>
                      <button className="icon-btn" aria-label={t.cloudDel + ' ' + x.titre} onClick={async () => {
                        if (!confirm(t.confirmCloudDel)) return
                        try {
                          await supprimerCompte(x.id)
                          const loc = (await listeProjets()).find((l) => l.compteId === x.id)
                          if (loc) await sauverProjet({ ...loc, compteId: undefined, compteSnap: undefined, compteMaj: undefined })
                          setCompte(await listeCompte()); setListe(await listeProjets())
                        } catch { setCompteErr(t.cloudErr) }
                      }}>🗑</button>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>
        )}
        <section>
          <h3 className="font-display text-xl mb-3">{t.mine}</h3>
          {liste && !liste.length && <p className="text-sm text-ink/60">{t.none}</p>}
          <ul className="grid gap-2">
            {(liste ?? []).map((x) => (
              <li key={x.id} className="card p-3 flex items-center gap-2 sm:gap-3 min-w-0">
                <span aria-hidden="true" className="chip hidden sm:inline-flex">{x.lang === 'py' ? '🐍 Python' : '⚡ JS'}</span>
                <span className="flex-1 min-w-0">
                  <span className="block font-semibold truncate">{x.titre}{x.compteId && <span className="ml-1 text-xs text-ink/55" title={t.cloud}>☁</span>}</span>
                  <span className="block text-xs text-ink/55">{x.fichiers.length} {lang === 'fr' ? (x.fichiers.length > 1 ? 'fichiers' : 'fichier') : 'file(s)'} · {new Date(x.maj).toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-GB')}</span>
                </span>
                <button className="btn" onClick={() => onOpen(x.id)}>{t.open}</button>
                <button className="icon-btn" aria-label={t.del + ' ' + x.titre} onClick={async () => { if (confirm(t.confirmDel)) { await supprimerProjet(x.id); setListe(await listeProjets()) } }}>🗑</button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    )
  }

  // ───────── Un projet ouvert : l'écran façon Atelier de Léo ─────────
  return (
    <Suspense fallback={<div className="fixed inset-0 z-50 bg-[#0B1120]" />}>
      <AtelierProjet lang={lang} id={id} ai={ai} signedIn={signedIn} onBack={onBack} />
    </Suspense>
  )
}
