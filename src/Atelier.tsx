import { useEffect, useRef, useState } from 'react'
import { lessons } from './lessons'
import { runCode, runPython, pythonPret, type RunResult } from './runner'
import { expliqueErreur } from './explainError'
import Chart from './Chart'
import AgentPanel from './AgentPanel'
import { listeProjets, lireProjet, sauverProjet, supprimerProjet, nouvelId, exporter, importer, codePython, codeJs, type Projet } from './atelierStore'
import type { Lang } from './i18n'

const T = {
  fr: {
    title: 'Atelier', sub: 'Tes projets de code, avec plusieurs fichiers. Ils restent sur cet appareil : pense à les exporter pour les garder ailleurs.',
    newPy: '+ Projet Python', newJs: '+ Projet JavaScript', import: 'Importer un projet', templates: 'Partir d’un modèle', mine: 'Mes projets', none: 'Aucun projet pour l’instant.',
    open: 'Ouvrir', del: 'Supprimer', confirmDel: 'Supprimer ce projet de l’appareil ? (exporte-le d’abord si tu veux le garder)', back: 'Atelier', run: 'Lancer', export: 'Exporter',
    files: 'Fichiers', addFile: '+ Fichier', rename: 'Renommer', delFile: 'Supprimer le fichier', main: 'principal', setMain: 'En faire le fichier principal', output: 'Console',
    nothing: '(rien affiché)', loadingPy: 'Chargement de Python… (une seule fois)', badImport: 'Ce fichier n’est pas un projet de l’Atelier.', fileName: 'Nom du fichier (ex. outils.py)',
    badName: 'Nom invalide ou déjà pris.', notFound: 'Projet introuvable sur cet appareil.', untitled: 'Mon projet', lastSave: 'Enregistré sur l’appareil', hint: 'Lance le projet : la console affiche ici le résultat du fichier principal.',
  },
  en: {
    title: 'Workshop', sub: 'Your code projects, with several files. They stay on this device: export them to keep them elsewhere.',
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

const PY_PKGS = ['numpy', 'pandas']

export default function Atelier({ lang, id, ai, signedIn, onOpen, onBack }: { lang: Lang; id: string | null; ai: boolean; signedIn: boolean; onOpen: (id: string) => void; onBack: () => void }) {
  const t = T[lang]
  const [liste, setListe] = useState<Projet[] | null>(null)
  const [p, setP] = useState<Projet | null>(null)
  const [introuvable, setIntrouvable] = useState(false)
  const [courant, setCourant] = useState('')
  const [res, setRes] = useState<RunResult | null>(null)
  const [running, setRunning] = useState<'' | 'run' | 'py'>('')
  const [note, setNote] = useState('')
  const fichierRef = useRef<HTMLInputElement>(null)

  useEffect(() => { if (!id) listeProjets().then(setListe).catch(() => setListe([])) }, [id])
  useEffect(() => {
    setP(null); setRes(null); setIntrouvable(false)
    if (!id) return
    lireProjet(id).then((x) => { if (x) { setP(x); setCourant(x.principal) } else setIntrouvable(true) }).catch(() => setIntrouvable(true))
  }, [id])
  // Enregistrement automatique sur l'appareil.
  useEffect(() => {
    if (!p) return
    const h = setTimeout(() => { void sauverProjet(p) }, 400)
    return () => clearTimeout(h)
  }, [p])

  const creer = async (proj: Omit<Projet, 'id' | 'maj'>) => {
    const np: Projet = { ...proj, id: nouvelId(), maj: new Date().toISOString() }
    await sauverProjet(np)
    onOpen(np.id)
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
        <section>
          <h3 className="font-display text-xl mb-3">{t.mine}</h3>
          {liste && !liste.length && <p className="text-sm text-ink/60">{t.none}</p>}
          <ul className="grid gap-2">
            {(liste ?? []).map((x) => (
              <li key={x.id} className="card p-3 flex items-center gap-3">
                <span aria-hidden="true" className="chip">{x.lang === 'py' ? '🐍 Python' : '⚡ JS'}</span>
                <span className="flex-1 min-w-0">
                  <span className="block font-semibold truncate">{x.titre}</span>
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

  // ───────── Un projet ─────────
  if (introuvable) return <div className="space-y-3"><button className="btn" onClick={onBack}>← {t.back}</button><p className="card p-4">{t.notFound}</p></div>
  if (!p) return <p className="text-sm text-ink/60" role="status">…</p>
  const f = p.fichiers.find((x) => x.chemin === courant) ?? p.fichiers[0]
  const maj = (contenu: string) => setP({ ...p, fichiers: p.fichiers.map((x) => (x.chemin === f.chemin ? { ...x, contenu } : x)) })
  const nomValide = (n: string) => /^[\p{L}\p{N}_./-]{1,80}$/u.test(n) && !n.includes('..') && !p.fichiers.some((x) => x.chemin === n)

  const lancer = async () => {
    if (running) return
    const pkgs = p.lang === 'py' ? PY_PKGS.filter((k) => p.fichiers.some((x) => new RegExp(`(^|\\n)\\s*(import|from)\\s+${k}\\b`).test(x.contenu))) : []
    setRunning(p.lang === 'py' && !pythonPret(pkgs) ? 'py' : 'run')
    const r = await (p.lang === 'py' ? runPython(codePython(p), [], pkgs) : runCode(codeJs(p), [])).finally(() => setRunning(''))
    setRes(r)
    setTimeout(() => {
      const el = document.getElementById('console-atelier'); if (!el) return
      const b = el.getBoundingClientRect(); if (b.bottom > window.innerHeight - (window.innerWidth < 1280 ? 96 : 16)) el.scrollIntoView({ block: 'end', behavior: 'smooth' })
    }, 60)
  }
  const simple = res?.error ? expliqueErreur(res.error, lang) : null

  return (
    <div className="space-y-4">
      <div className="sticky top-16 z-20 -mx-4 px-4 py-2 bg-[color-mix(in_srgb,var(--color-cream)_88%,transparent)] backdrop-blur-xl border-b border-brass flex items-center gap-2">
        <button className="btn px-3" onClick={onBack} aria-label={(lang === 'fr' ? 'Retour à l’' : 'Back to ') + t.back}>← <span className="hidden sm:inline">{t.back}</span></button>
        <input value={p.titre} onChange={(e) => setP({ ...p, titre: e.target.value.slice(0, 80) })} aria-label="titre"
          className="flex-1 min-w-0 min-h-11 rounded-xl border border-transparent hover:border-brass focus:border-brass bg-transparent px-2 font-display text-lg font-bold" />
        <button className="btn hidden sm:inline-flex" onClick={() => exporter(p)}>⤓ {t.export}</button>
        <button className="icon-btn sm:hidden" onClick={() => exporter(p)} aria-label={t.export}>⤓</button>
        <button className="btn btn-primary" onClick={lancer} disabled={!!running}>{running ? '⏳' : '▶'} {t.run}</button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
        <nav aria-label={t.files} className="card p-2 h-fit">
          <p className="text-xs uppercase tracking-wide text-ink/55 font-bold px-2 py-1">{t.files}</p>
          <ul className="flex lg:flex-col gap-1 overflow-x-auto">
            {p.fichiers.map((x) => (
              <li key={x.chemin} className="shrink-0">
                <button onClick={() => setCourant(x.chemin)} aria-current={x.chemin === f.chemin ? 'true' : undefined}
                  className={`w-full min-h-11 text-left rounded-xl px-3 py-2 text-sm font-mono flex items-center gap-2 ${x.chemin === f.chemin ? 'bg-terracotta/12 font-semibold' : 'hover:bg-ink/5'}`}>
                  <span className="truncate">{x.chemin}</span>{x.chemin === p.principal && <span className="text-[10px] text-terracotta-dark font-sans font-bold">★ {t.main}</span>}
                </button>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-1 pt-2 border-t border-brass mt-2">
            <button className="btn text-xs px-2" onClick={() => {
              const n = prompt(t.fileName, p.lang === 'py' ? 'outils.py' : 'outils.js')?.trim()
              if (!n) return
              if (!nomValide(n)) { alert(t.badName); return }
              setP({ ...p, fichiers: [...p.fichiers, { chemin: n, contenu: '' }] }); setCourant(n)
            }}>{t.addFile}</button>
            <button className="btn text-xs px-2" onClick={() => {
              const n = prompt(t.rename, f.chemin)?.trim()
              if (!n || n === f.chemin) return
              if (!nomValide(n)) { alert(t.badName); return }
              setP({ ...p, principal: p.principal === f.chemin ? n : p.principal, fichiers: p.fichiers.map((x) => (x.chemin === f.chemin ? { ...x, chemin: n } : x)) }); setCourant(n)
            }}>{t.rename}</button>
            {f.chemin !== p.principal && <button className="btn text-xs px-2" onClick={() => setP({ ...p, principal: f.chemin })}>★ {t.setMain}</button>}
            {p.fichiers.length > 1 && f.chemin !== p.principal && (
              <button className="btn text-xs px-2" onClick={() => { setP({ ...p, fichiers: p.fichiers.filter((x) => x.chemin !== f.chemin) }); setCourant(p.principal) }}>🗑 {t.delFile}</button>
            )}
          </div>
        </nav>

        <div className="space-y-3 min-w-0">
          {ai && <AgentPanel lang={lang} signedIn={signedIn} ctx={{ title: `[Atelier · ${p.lang === 'py' ? 'Python' : 'JavaScript'}] ${p.titre} — ${f.chemin}`, code: f.contenu, output: res ? res.output.join('\n') + (res.error ? '\n' + res.error : '') : '' }} />}
          <div className="ide">
            <div className="ide-bar"><span className="ide-dot bg-[#ff5f57]" /><span className="ide-dot bg-[#febc2e]" /><span className="ide-dot bg-[#28c840]" /><span className="ml-2 font-mono">{f.chemin}</span></div>
            <textarea value={f.contenu} onChange={(e) => maj(e.target.value)} spellCheck={false} autoCapitalize="off" autoCorrect="off" rows={16}
              aria-label={f.chemin} className="p-4 font-mono text-sm leading-6"
              onKeyDown={(e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); void lancer() }
                if (e.key === 'Tab' && !e.shiftKey) {
                  e.preventDefault()
                  const el = e.currentTarget, a = el.selectionStart, b = el.selectionEnd
                  maj(f.contenu.slice(0, a) + '    ' + f.contenu.slice(b))
                  requestAnimationFrame(() => { el.selectionStart = el.selectionEnd = a + 4 })
                }
              }} />
          </div>
          <div id="console-atelier" className="ide scroll-mb-28 xl:scroll-mb-4" aria-live="polite">
            <div className="ide-bar"><span>›_ {t.output}</span></div>
            {running === 'py' ? <p className="p-4 text-sm" role="status">⏳ {t.loadingPy}</p>
              : res ? <pre className="p-4 text-sm whitespace-pre-wrap font-mono overflow-x-auto">{res.output.length ? res.output.join('\n') : t.nothing}</pre>
                : <p className="p-4 text-sm opacity-60">{t.hint}</p>}
          </div>
          {res?.figures?.map((fig, i) => <Chart key={i} fig={fig} />)}
          {res?.error && (
            <div className="rounded-xl bg-terracotta/10 border border-terracotta/40 p-3 text-sm space-y-1" role="alert">
              <p className="font-semibold text-terracotta-dark">⚠️ {simple ?? res.error}</p>
              {simple && <details><summary className="cursor-pointer text-xs text-ink/65">{lang === 'fr' ? 'Détail technique' : 'Technical detail'}</summary><pre className="mt-1 text-xs font-mono whitespace-pre-wrap">{res.error}</pre></details>}
            </div>
          )}
          <p className="text-xs text-ink/50">✓ {t.lastSave}</p>
        </div>
      </div>
    </div>
  )
}
