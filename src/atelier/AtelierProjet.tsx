import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { runCode, runPython, pythonPret, type RunResult } from '../runner'
import { expliqueErreur } from '../explainError'
import Chart from '../Chart'
import AgentFace from '../AgentFace'
import { agents } from '../agents'
import { askTutor, askFix } from '../tutor'
import { lireProjet, sauverProjet, exporter, codePython, codeJs, type Projet } from '../atelierStore'
import { enregistrerCompte, nonEnregistre, ErreurCompte } from '../atelierCompte'
import { supabase } from '../supabase'
import { creerZip } from './zip'
import { pageDeDepart, assembler } from './apercu'
import type { Lang } from '../i18n'

// L'ÉCRAN D'UN PROJET OUVERT, sur le modèle de l'Atelier de code de Léo (Beau, 02/10) :
// plein écran sombre ; en haut le projet, les modes de l'agent, le modèle et « Lancer » ; une barre d'actions ;
// trois colonnes (fichiers · éditeur avec onglets, Code/Aperçu et console en direct · conversation avec l'agent) ;
// une barre d'état. Au téléphone : une colonne à la fois, onglets en bas.
// L'agent passe par la fonction learn-tutor existante (rien de nouveau côté serveur) ; le code tourne dans le navigateur.

const Editeur = lazy(() => import('./Editeur'))

type Mode = 'demander' | 'accepter' | 'auto' | 'reflechir'
type Vue = 'fichiers' | 'code' | 'agent' | 'console'
interface Evt { id: number; heure: string; qui: 'moi' | 'agent' | 'action' | 'systeme'; texte: string; fichier?: string; etat?: string; ok?: boolean }
interface Proposition { id: number; fichier: string; avant: string; apres: string; explication: string; statut: 'attente' | 'appliquee' | 'refusee' }

const T = {
  fr: {
    close: 'Fermer le projet', modes: { demander: 'Demander', accepter: 'Accepter les modifs', auto: 'Tout autoriser', reflechir: 'Réfléchir d’abord' },
    modesAide: {
      demander: 'L’agent répond et explique, il ne touche pas aux fichiers.',
      accepter: 'L’agent propose une modification du fichier ouvert ; tu l’acceptes ou la refuses.',
      auto: 'L’agent écrit directement dans le fichier ouvert (tu peux annuler dans « Modifications »).',
      reflechir: 'L’agent propose d’abord un plan, sans code.',
    },
    model: 'Modèle', auto: 'Auto', run: 'Lancer', running: 'En cours…',
    replay: 'Revoir la séance', palette: 'Palette de commandes (Ctrl+K)', changes: 'Modifications', journal: 'Journal', zip: 'Exporter en .zip',
    save: 'Enregistrer dans mon compte', saving: 'Envoi…', saved: 'Enregistré dans ton compte', newSession: 'Nouvelle session',
    files: 'Fichiers', addFile: '+ Fichier', rename: 'Renommer', delFile: 'Supprimer', main: 'principal', setMain: 'Fichier principal',
    code: 'Code', preview: 'Aperçu', noPreview: 'Pas de page web dans ce projet : ajoute un fichier index.html pour voir l’aperçu.',
    console: 'Console', live: 'en direct', grow: 'agrandir', shrink: 'réduire', fold: 'replier', nothing: '(rien affiché)', loadingPy: 'Chargement de Python… (une seule fois)',
    consoleHint: 'Lance le projet : la sortie et les erreurs s’affichent ici.', journalEmpty: 'Rien encore : écris une demande à l’agent.',
    agent: 'Agent', ask: 'Écris ta demande… (Ctrl + Entrée pour envoyer)', send: 'Envoyer', questions: 'Me guider par des questions (sans donner la réponse)',
    needLogin: 'Connecte-toi pour parler aux agents.', login: 'Se connecter', aiOff: 'L’IA est désactivée : active « Finia » en haut de Learn pour parler aux agents.',
    apply: 'Appliquer', refuse: 'Refuser', applied: 'Appliquée', refused: 'Refusée', undo: 'Annuler', noChanges: 'Aucune modification de l’agent pour l’instant.',
    status: (l: number, c: number) => `Ligne ${l}, col. ${c}`, confirmNew: 'Effacer la conversation et le journal de cette séance ?',
    fileName: 'Nom du fichier (ex. outils.py)', badName: 'Nom invalide ou déjà pris.', confirmDel: 'Supprimer ce fichier ?', notFound: 'Projet introuvable sur cet appareil.',
    hello: (nom: string, titre: string) => `Bonjour ! Je suis ${nom}. On travaille sur « ${titre} ». Dis-moi ce que tu veux construire ou ce qui bloque.`,
    paletteHint: 'Chercher un fichier ou une action…', paletteFile: 'fichier', paletteAction: 'action', paletteNone: 'Rien ne correspond.', exportJson: 'Exporter pour réimporter (.json)',
    aiError: 'L’agent est indisponible pour l’instant, réessaie plus tard.', quota: 'Limite de questions atteinte pour aujourd’hui.', unsaved: 'Modifications pas encore dans ton compte',
    tabs: { fichiers: 'Fichiers', code: 'Code', agent: 'Agent', console: 'Console' }, read: 'lecture', write: 'écriture', waiting: 'en attente', done: 'écrit', exec: 'exécution',
  },
  en: {
    close: 'Close the project', modes: { demander: 'Ask', accepter: 'Accept edits', auto: 'Allow all', reflechir: 'Think first' },
    modesAide: {
      demander: 'The agent answers and explains; it does not touch the files.',
      accepter: 'The agent proposes a change to the open file; you accept or refuse it.',
      auto: 'The agent writes directly in the open file (you can undo in “Changes”).',
      reflechir: 'The agent first proposes a plan, without code.',
    },
    model: 'Model', auto: 'Auto', run: 'Run', running: 'Running…',
    replay: 'Replay the session', palette: 'Command palette (Ctrl+K)', changes: 'Changes', journal: 'Log', zip: 'Export as .zip',
    save: 'Save to my account', saving: 'Sending…', saved: 'Saved to your account', newSession: 'New session',
    files: 'Files', addFile: '+ File', rename: 'Rename', delFile: 'Delete', main: 'main', setMain: 'Main file',
    code: 'Code', preview: 'Preview', noPreview: 'No web page in this project: add an index.html file to see the preview.',
    console: 'Console', live: 'live', grow: 'enlarge', shrink: 'shrink', fold: 'fold', nothing: '(nothing printed)', loadingPy: 'Loading Python… (only once)',
    consoleHint: 'Run the project: output and errors appear here.', journalEmpty: 'Nothing yet: write a request to the agent.',
    agent: 'Agent', ask: 'Write your request… (Ctrl + Enter to send)', send: 'Send', questions: 'Guide me with questions (no answer given)',
    needLogin: 'Sign in to talk to the agents.', login: 'Sign in', aiOff: 'AI is off: turn on “Finia” at the top of Learn to talk to the agents.',
    apply: 'Apply', refuse: 'Refuse', applied: 'Applied', refused: 'Refused', undo: 'Undo', noChanges: 'No change from the agent yet.',
    status: (l: number, c: number) => `Ln ${l}, Col ${c}`, confirmNew: 'Clear this session’s conversation and log?',
    fileName: 'File name (e.g. tools.py)', badName: 'Invalid or already used name.', confirmDel: 'Delete this file?', notFound: 'Project not found on this device.',
    hello: (nom: string, titre: string) => `Hi! I’m ${nom}. We’re working on “${titre}”. Tell me what you want to build or what’s blocking you.`,
    paletteHint: 'Search a file or an action…', paletteFile: 'file', paletteAction: 'action', paletteNone: 'Nothing matches.', exportJson: 'Export to re-import (.json)',
    aiError: 'The agent is unavailable right now, try again later.', quota: 'Question limit reached for today.', unsaved: 'Changes not yet in your account',
    tabs: { fichiers: 'Files', code: 'Code', agent: 'Agent', console: 'Console' }, read: 'read', write: 'write', waiting: 'pending', done: 'written', exec: 'run',
  },
} as const

const PY_PKGS = ['numpy', 'pandas']
const heure = () => new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
const lireLS = (k: string) => { try { return localStorage.getItem(k) } catch { return null } }
const ecrireLS = (k: string, v: string) => { try { localStorage.setItem(k, v) } catch { /* ignoré */ } }
const ETIQ: Record<string, [string, string]> = { py: ['PY', '#34d399'], js: ['JS', '#facc15'], html: ['<>', '#fb923c'], css: ['#', '#60a5fa'], json: ['{}', '#fde047'], md: ['MD', '#a3a3a3'], txt: ['TXT', '#a3a3a3'] }
const etiquette = (c: string) => ETIQ[c.split('.').pop()?.toLowerCase() ?? ''] ?? ['·', '#a3a3a3']

export default function AtelierProjet({ lang, id, ai, signedIn, onBack }: { lang: Lang; id: string; ai: boolean; signedIn: boolean; onBack: () => void }) {
  const t = T[lang]
  const [p, setP] = useState<Projet | null>(null)
  const [introuvable, setIntrouvable] = useState(false)
  const [onglets, setOnglets] = useState<string[]>([])
  const [courant, setCourant] = useState('')
  const [pos, setPos] = useState<[number, number]>([1, 1])
  const [res, setRes] = useState<RunResult | null>(null)
  const [running, setRunning] = useState<'' | 'run' | 'py'>('')
  const [mode, setModeState] = useState<Mode>(() => (lireLS('learn:atelier:mode') as Mode) || 'accepter')
  const [questions, setQuestions] = useState(() => lireLS('learn:socratique') === '1')
  const [agentId, setAgentId] = useState('finia')
  const [evts, setEvts] = useState<Evt[]>([])
  const [props, setProps] = useState<Proposition[]>([])
  const [demande, setDemande] = useState('')
  const [busy, setBusy] = useState(false)
  const [vue, setVue] = useState<Vue>('code')
  const [apercu, setApercu] = useState(false)
  const [bas, setBas] = useState<'console' | 'journal'>('console')
  const [basTaille, setBasTaille] = useState<'normal' | 'grand' | 'replie'>('normal')
  const [panneau, setPanneau] = useState<'' | 'revoir' | 'modifs' | 'palette'>('')
  const [envoi, setEnvoi] = useState<'' | 'envoi'>('')
  const [note, setNote] = useState('')
  const compteur = useRef(0)
  // Grand écran (≥ 1024 px) : trois colonnes ; sinon une vue à la fois. La console n'existe qu'à un seul endroit.
  const [large, setLarge] = useState(() => window.matchMedia('(min-width: 1024px)').matches)
  useEffect(() => {
    const m = window.matchMedia('(min-width: 1024px)')
    const h = () => setLarge(m.matches)
    m.addEventListener('change', h)
    return () => m.removeEventListener('change', h)
  }, [])
  const fil = useRef<HTMLDivElement>(null)

  const prets = agents.filter((a) => a.ready)
  const agent = prets.find((a) => a.id === agentId) ?? prets[0]
  const nomAgent = agent.name

  const ajouter = useCallback((e: Omit<Evt, 'id' | 'heure'>) => setEvts((l) => [...l, { ...e, id: ++compteur.current, heure: heure() }]), [])

  // Chargement du projet ; la séance (conversation, journal) est gardée sur l'appareil, par projet.
  useEffect(() => {
    setP(null); setIntrouvable(false); setRes(null)
    lireProjet(id).then((x) => {
      if (!x) { setIntrouvable(true); return }
      setP(x); setCourant(x.principal); setOnglets([x.principal])
      try {
        const s = JSON.parse(lireLS('learn:atelier:seance:' + id) ?? 'null')
        if (s?.evts) { setEvts(s.evts); setProps(s.props ?? []); compteur.current = Math.max(0, ...s.evts.map((e: Evt) => e.id), ...(s.props ?? []).map((q: Proposition) => q.id)) }
      } catch { /* séance illisible : on repart de zéro */ }
    }).catch(() => setIntrouvable(true))
  }, [id])
  useEffect(() => { if (p) ecrireLS('learn:atelier:seance:' + id, JSON.stringify({ evts: evts.slice(-200), props: props.slice(-50) })) }, [evts, props, id, p])
  // Enregistrement automatique sur l'appareil.
  useEffect(() => {
    if (!p) return
    const h = setTimeout(() => { void sauverProjet(p) }, 400)
    return () => clearTimeout(h)
  }, [p])
  useEffect(() => { fil.current?.scrollTo({ top: fil.current.scrollHeight }) }, [evts, props, busy])

  const setMode = (m: Mode) => { setModeState(m); ecrireLS('learn:atelier:mode', m) }

  const lancer = useCallback(async () => {
    if (!p || running) return
    const pkgs = p.lang === 'py' ? PY_PKGS.filter((k) => p.fichiers.some((x) => new RegExp(`(^|\\n)\\s*(import|from)\\s+${k}\\b`).test(x.contenu))) : []
    setRunning(p.lang === 'py' && !pythonPret(pkgs) ? 'py' : 'run')
    setBas('console'); if (basTaille === 'replie') setBasTaille('normal')
    if (!large) setVue('console')
    ajouter({ qui: 'action', texte: `lancer ${p.principal}`, etat: t.exec })
    const r = await (p.lang === 'py' ? runPython(codePython(p), [], pkgs) : runCode(codeJs(p), [])).finally(() => setRunning(''))
    setRes(r)
  }, [p, running, basTaille, ajouter, t.exec, large])

  // Raccourcis : Ctrl+K palette, Ctrl+Entrée lancer (hors de l'éditeur, qui le gère lui-même).
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPanneau('palette') }
      if (e.key === 'Escape') setPanneau('')
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])

  const docApercu = useMemo(() => {
    if (!p) return null
    const page = pageDeDepart(p.fichiers.map((f) => f.chemin))
    if (!page) return null
    const contenus = Object.fromEntries(p.fichiers.map((f) => [f.chemin, f.contenu]))
    return assembler(page, contenus[page], contenus)
  }, [p])

  if (introuvable) return (
    <div className="fixed inset-0 z-50 bg-[#0B1120] text-[#EDF1F8] grid place-items-center p-6">
      <div className="text-center space-y-3"><p>{t.notFound}</p><button className="btn" onClick={onBack}>← {t.close}</button></div>
    </div>
  )
  if (!p) return <div className="fixed inset-0 z-50 bg-[#0B1120]" role="status" aria-label="…" />

  const f = p.fichiers.find((x) => x.chemin === courant) ?? p.fichiers[0]
  const majFichier = (chemin: string, contenu: string) => setP((cur) => cur && ({ ...cur, fichiers: cur.fichiers.map((x) => (x.chemin === chemin ? { ...x, contenu } : x)) }))
  const nomValide = (n: string) => /^[\p{L}\p{N}_./-]{1,80}$/u.test(n) && !n.includes('..') && !p.fichiers.some((x) => x.chemin === n)
  const ouvrir = (c: string) => { setCourant(c); setOnglets((o) => (o.includes(c) ? o : [...o, c].slice(-8))); setApercu(false); if (!large) setVue('code') }
  const fermerOnglet = (c: string) => {
    const reste = onglets.filter((x) => x !== c)
    setOnglets(reste)
    if (c === courant) setCourant(reste[reste.length - 1] ?? p.principal)
  }
  const ajouterFichier = () => {
    const n = prompt(t.fileName, p.lang === 'py' ? 'outils.py' : 'outils.js')?.trim()
    if (!n) return
    if (!nomValide(n)) { alert(t.badName); return }
    setP({ ...p, fichiers: [...p.fichiers, { chemin: n, contenu: '' }] }); ouvrir(n)
  }
  const renommer = () => {
    const n = prompt(t.rename, f.chemin)?.trim()
    if (!n || n === f.chemin) return
    if (!nomValide(n)) { alert(t.badName); return }
    setP({ ...p, principal: p.principal === f.chemin ? n : p.principal, fichiers: p.fichiers.map((x) => (x.chemin === f.chemin ? { ...x, chemin: n } : x)) })
    setOnglets((o) => o.map((x) => (x === f.chemin ? n : x))); setCourant(n)
  }
  const supprimer = () => {
    if (f.chemin === p.principal || !confirm(t.confirmDel)) return
    setP({ ...p, fichiers: p.fichiers.filter((x) => x.chemin !== f.chemin) }); fermerOnglet(f.chemin)
  }

  const enregistrer = async () => {
    if (envoi) return
    if (!signedIn) { window.dispatchEvent(new Event('learn:login')); return }
    setEnvoi('envoi'); setNote('')
    try {
      const np = await enregistrerCompte(p, lang)
      setP((cur) => (cur ? { ...cur, compteId: np.compteId, compteSnap: np.compteSnap, compteMaj: np.compteMaj } : cur))
      ajouter({ qui: 'systeme', texte: '☁ ' + t.saved, ok: true })
    } catch (e) {
      setNote(e instanceof ErreurCompte ? e.message : t.aiError)
    } finally { setEnvoi('') }
  }
  const zip = () => {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(creerZip(p.fichiers))
    a.download = (p.titre.replace(/[^\p{L}\p{N}_-]+/gu, '-').replace(/^-+|-+$/g, '') || 'projet') + '.zip'
    a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000)
  }
  const nouvelleSession = () => { if (confirm(t.confirmNew)) { setEvts([]); setProps([]) } }

  // ───────── L'agent ─────────
  const contexte = `[Atelier · ${p.lang === 'py' ? 'Python' : 'JavaScript'}] ${p.titre} — ${f.chemin}`
  const envoyer = async () => {
    const q = demande.trim()
    if (!q || busy) return
    if (!signedIn) { window.dispatchEvent(new Event('learn:login')); return }
    setDemande(''); setBusy(true)
    ajouter({ qui: 'moi', texte: q })
    ajouter({ qui: 'action', texte: `lire_fichier ${f.chemin}`, fichier: f.chemin, etat: t.read })
    const sortie = res ? res.output.join('\n') + (res.error ? '\n' + res.error : '') : ''
    const ecrit = (mode === 'accepter' || mode === 'auto') && !questions
    if (ecrit) {
      const r = await askFix({ code: f.contenu, lesson: `${contexte}\nDemande : ${q}`, output: sortie, lang })
      setBusy(false)
      if (!r.fix) { ajouter({ qui: 'systeme', texte: r.error === 'quota' ? t.quota : t.aiError }); return }
      ajouter({ qui: 'agent', texte: r.fix.explanation })
      const prop: Proposition = { id: ++compteur.current, fichier: f.chemin, avant: f.contenu, apres: r.fix.fixed_code, explication: r.fix.explanation, statut: mode === 'auto' ? 'appliquee' : 'attente' }
      setProps((l) => [...l, prop])
      ajouter({ qui: 'action', texte: `ecrire_fichier ${f.chemin}`, fichier: f.chemin, etat: mode === 'auto' ? t.done : t.waiting })
      if (mode === 'auto') majFichier(f.chemin, r.fix.fixed_code)
      return
    }
    const question = mode === 'reflechir'
      ? (lang === 'fr' ? 'Avant tout code, propose un plan court en 3 étapes, puis demande-moi si on y va. ' : 'Before any code, propose a short 3-step plan, then ask me whether to go ahead. ') + q
      : q
    const r = await askTutor({ question, code: f.contenu, lesson: contexte, output: sortie, lang, agentId: agent.id, socratique: questions })
    setBusy(false)
    ajouter({ qui: r.answer ? 'agent' : 'systeme', texte: r.answer ?? (r.error === 'quota' ? t.quota : t.aiError) })
  }
  const decider = (prop: Proposition, ok: boolean) => {
    setProps((l) => l.map((x) => (x.id === prop.id ? { ...x, statut: ok ? 'appliquee' : 'refusee' } : x)))
    if (ok) majFichier(prop.fichier, prop.apres)
    ajouter({ qui: 'action', texte: `ecrire_fichier ${prop.fichier}`, fichier: prop.fichier, etat: ok ? t.done : t.refused })
  }
  const annuler = (prop: Proposition) => {
    majFichier(prop.fichier, prop.avant)
    setProps((l) => l.map((x) => (x.id === prop.id ? { ...x, statut: 'refusee' } : x)))
    ajouter({ qui: 'action', texte: `annuler ${prop.fichier}`, fichier: prop.fichier, etat: t.undo })
  }

  const simple = res?.error ? expliqueErreur(res.error, lang) : null
  const dirty = nonEnregistre(p)
  const langageNom = (c: string) => ({ py: 'Python', js: 'JavaScript', html: 'HTML', css: 'CSS', json: 'JSON', md: 'Markdown' } as Record<string, string>)[c.split('.').pop() ?? ''] ?? (lang === 'fr' ? 'Texte' : 'Text')
  const btnBarre = 'shrink-0 inline-flex items-center gap-1.5 rounded-full border border-white/12 px-3 min-h-9 text-[12px] font-semibold text-[#C9D4E5] hover:border-[#FF8A3D] hover:text-white'

  // ───────── Colonnes ─────────
  const colonneFichiers = (
    <div className="h-full flex flex-col min-h-0">
      <div className="flex items-center justify-between px-3 h-9 text-[11px] font-bold uppercase tracking-wider text-[#93A1B8]"><span>{t.files}</span><span>{p.fichiers.length}</span></div>
      <ul className="flex-1 min-h-0 overflow-y-auto">
        {p.fichiers.map((x) => {
          const [e, c] = etiquette(x.chemin)
          return (
            <li key={x.chemin}>
              <button onClick={() => ouvrir(x.chemin)} aria-current={x.chemin === courant ? 'true' : undefined}
                className={`w-full min-h-10 flex items-center gap-2 px-3 text-left text-[13px] ${x.chemin === courant ? 'bg-white/8 text-white' : 'text-[#C9D4E5] hover:bg-white/5'}`}>
                <span className="w-7 shrink-0 font-mono text-[10px] font-bold" style={{ color: c }}>{e}</span>
                <span className="truncate flex-1 font-mono">{x.chemin}</span>
                {x.chemin === p.principal && <span className="text-[10px] text-[#FF8A3D] font-bold">★</span>}
              </button>
            </li>
          )
        })}
      </ul>
      <div className="flex flex-wrap gap-1.5 p-2 border-t border-white/10">
        <button className={btnBarre} onClick={ajouterFichier}>{t.addFile}</button>
        <button className={btnBarre} onClick={renommer}>{t.rename}</button>
        {f.chemin !== p.principal && <button className={btnBarre} onClick={() => setP({ ...p, principal: f.chemin })}>★ {t.setMain}</button>}
        {f.chemin !== p.principal && <button className={btnBarre} onClick={supprimer}>🗑 {t.delFile}</button>}
      </div>
    </div>
  )

  const lignesJournal = evts.filter((e) => e.qui !== 'moi')
  const panneauBas = (
    <div className="h-full flex flex-col min-h-0 border-t border-white/10 bg-[#0A0F1C]">
      <div className="flex items-center gap-1 h-9 shrink-0 px-2 text-[12px]" role="tablist">
        {(['console', 'journal'] as const).map((k) => (
          <button key={k} role="tab" aria-selected={bas === k} onClick={() => { setBas(k); if (basTaille === 'replie') setBasTaille('normal') }}
            className={`rounded px-2.5 min-h-8 font-semibold ${bas === k ? 'bg-[#FF8A3D]/15 text-[#FF8A3D]' : 'text-[#93A1B8] hover:text-white'}`}>
            {k === 'console' ? t.console : `${nomAgent} ${t.live}`}
          </button>
        ))}
        <span className="flex-1" />
        <button className="hidden lg:block text-[#93A1B8] hover:text-white px-2 min-h-8" onClick={() => setBasTaille(basTaille === 'grand' ? 'normal' : 'grand')}>{basTaille === 'grand' ? t.shrink : t.grow}</button>
        <button className="hidden lg:block text-[#93A1B8] hover:text-white px-2 min-h-8" aria-label={t.fold} onClick={() => setBasTaille(basTaille === 'replie' ? 'normal' : 'replie')}>{basTaille === 'replie' ? '▴' : '▾'}</button>
      </div>
      {basTaille !== 'replie' && (
        <div id="console-atelier" className="flex-1 min-h-0 overflow-y-auto px-3 pb-3 font-mono text-[12.5px] leading-relaxed text-[#EDF1F8]" aria-live="polite">
          {bas === 'console' ? (
            running === 'py' ? <p role="status">⏳ {t.loadingPy}</p>
              : res ? (
                <div className="space-y-2">
                  <pre className="whitespace-pre-wrap">{res.output.length ? res.output.join('\n') : t.nothing}</pre>
                  {res.figures?.map((fig, i) => <div key={i} className="rounded-lg bg-white p-2"><Chart fig={fig} /></div>)}
                  {res.error && (
                    <div className="rounded-lg border border-[#FB7185]/50 bg-[#FB7185]/10 p-2 font-sans" role="alert">
                      <p className="font-semibold text-[#FDA4AF]">⚠️ {simple ?? res.error}</p>
                      {simple && <details><summary className="cursor-pointer text-xs text-[#93A1B8]">{lang === 'fr' ? 'Détail technique' : 'Technical detail'}</summary><pre className="mt-1 text-xs whitespace-pre-wrap">{res.error}</pre></details>}
                    </div>
                  )}
                </div>
              ) : <p className="text-[#93A1B8] font-sans">{t.consoleHint}</p>
          ) : (
            lignesJournal.length ? lignesJournal.map((e) => (
              <p key={e.id} className="truncate"><span className="text-[#64748B]">{e.heure} </span>
                {e.qui === 'action' ? <><span className="text-[#5FC8C0]">{e.texte}</span><span className="text-[#93A1B8]"> · {e.etat}</span></>
                  : <><span className="text-[#FF8A3D]">{e.qui === 'agent' ? nomAgent : '•'} </span>{e.texte}</>}
              </p>
            )) : <p className="text-[#93A1B8] font-sans">{t.journalEmpty}</p>
          )}
        </div>
      )}
    </div>
  )

  const colonneCentre = (
    <div className="h-full flex flex-col min-h-0">
      <div className="flex items-center gap-1 h-10 shrink-0 px-2 border-b border-white/10" role="tablist">
        {([[false, '‹/› ' + t.code], [true, '◉ ' + t.preview]] as const).map(([v, label]) => (
          <button key={String(v)} role="tab" aria-selected={apercu === v} onClick={() => setApercu(v)}
            className={`rounded-full px-3 min-h-8 text-[12px] font-semibold ${apercu === v ? 'bg-[#FF8A3D] text-[#0B1120]' : 'text-[#93A1B8] hover:text-white'}`}>{label}</button>
        ))}
      </div>
      {!apercu && (
        <div className="flex h-9 shrink-0 overflow-x-auto border-b border-white/10 bg-[#0A0F1C] [scrollbar-width:none]" role="tablist" aria-label={t.files}>
          {onglets.filter((c) => p.fichiers.some((x) => x.chemin === c)).map((c) => {
            const [e, col] = etiquette(c)
            const est = c === courant
            return (
              <div key={c} role="tab" aria-selected={est} onClick={() => setCourant(c)}
                className={`group flex shrink-0 max-w-[200px] cursor-pointer items-center gap-1.5 border-r border-white/10 px-3 text-[12px] border-t-2 ${est ? 'border-t-[#FF8A3D] bg-[#0B1120] text-white' : 'border-t-transparent text-[#93A1B8] hover:text-white'}`}>
                <span className="font-mono text-[10px] font-bold" style={{ color: col }}>{e}</span>
                <span className="truncate">{c.split('/').pop()}</span>
                <button onClick={(ev) => { ev.stopPropagation(); fermerOnglet(c) }} aria-label={(lang === 'fr' ? 'Fermer ' : 'Close ') + c} className="ml-0.5 grid place-items-center size-5 rounded hover:bg-white/10">×</button>
              </div>
            )
          })}
        </div>
      )}
      <div className="flex-1 min-h-0 relative">
        {apercu ? (
          docApercu ? <iframe title={t.preview} sandbox="allow-scripts allow-modals" srcDoc={docApercu} className="absolute inset-0 size-full bg-white" />
            : <p className="p-6 text-sm text-[#93A1B8]">{t.noPreview}</p>
        ) : (
          <Suspense fallback={<div className="p-4 text-[#93A1B8] text-sm">…</div>}>
            <Editeur chemin={f.chemin} valeur={f.contenu} label={f.chemin} onChange={(v) => majFichier(f.chemin, v)} onCurseur={(l, c) => setPos([l, c])} onLancer={() => void lancer()} />
          </Suspense>
        )}
      </div>
      {large && <div className="flex flex-col min-h-0 shrink-0" style={{ height: basTaille === 'grand' ? '60%' : basTaille === 'replie' ? '2.25rem' : '34%' }}>{panneauBas}</div>}
    </div>
  )

  const prof = (a: typeof agent, size: 'sm' | 'md' = 'sm') => <AgentFace src={a.face} initial={a.name[0]} size={size} />
  const colonneAgent = (
    <div className="h-full flex flex-col min-h-0">
      <div className="shrink-0 p-3 border-b border-white/10 space-y-2">
        <div className="flex gap-2 overflow-x-auto [scrollbar-width:none]" role="radiogroup" aria-label={t.agent}>
          {prets.map((a) => (
            <button key={a.id} role="radio" aria-checked={a.id === agent.id} onClick={() => setAgentId(a.id)}
              className={`shrink-0 flex items-center gap-2 rounded-full border pl-1 pr-3 py-1 text-[12px] font-semibold ${a.id === agent.id ? 'border-[#FF8A3D] bg-[#FF8A3D]/12 text-white' : 'border-white/12 text-[#C9D4E5]'}`}>
              <span className="scale-75 -m-1.5">{prof(a)}</span>{a.name}
            </button>
          ))}
        </div>
        <label className="flex items-start gap-2 text-[12px] text-[#C9D4E5] cursor-pointer">
          <input type="checkbox" checked={questions} onChange={(e) => { setQuestions(e.target.checked); ecrireLS('learn:socratique', e.target.checked ? '1' : '0') }} className="mt-0.5 size-4 accent-[#FF8A3D]" />
          <span>{t.questions}</span>
        </label>
      </div>
      <div ref={fil} className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3 text-[13.5px] leading-relaxed">
        <div className="flex gap-2.5">{prof(agent)}<div className="min-w-0"><p className="text-[12px] font-bold text-[#FF8A3D]">{nomAgent}</p><p className="rounded-2xl rounded-tl-sm bg-white/6 px-3 py-2 text-[#EDF1F8]">{t.hello(nomAgent, p.titre)}</p></div></div>
        {evts.map((e) => e.qui === 'moi' ? (
          <div key={e.id} className="flex justify-end"><p className="max-w-[85%] rounded-2xl rounded-tr-sm bg-[#FF8A3D] text-[#0B1120] px-3 py-2 font-medium whitespace-pre-wrap">{e.texte}</p></div>
        ) : e.qui === 'action' ? (
          <p key={e.id} className="font-mono text-[12px] text-[#93A1B8] pl-2"><span className="text-[#5FC8C0]">• {e.texte}</span> {e.etat}</p>
        ) : e.qui === 'systeme' ? (
          <p key={e.id} className={`text-[12px] pl-2 ${e.ok ? 'text-[#5FC8C0]' : 'text-[#FDA4AF]'}`}>{e.texte}</p>
        ) : (
          <div key={e.id} className="flex gap-2.5">{prof(agent)}<div className="min-w-0"><p className="text-[12px] font-bold text-[#FF8A3D]">{nomAgent}</p><p className="rounded-2xl rounded-tl-sm bg-white/6 px-3 py-2 text-[#EDF1F8] whitespace-pre-wrap">{e.texte}</p></div></div>
        ))}
        {props.filter((x) => x.statut === 'attente').map((x) => (
          <div key={x.id} className="rounded-xl border border-[#FF8A3D]/50 bg-[#FF8A3D]/8 p-3 space-y-2">
            <p className="font-mono text-[12px] text-[#FF8A3D]">ecrire_fichier {x.fichier}</p>
            <pre className="max-h-48 overflow-auto rounded-lg bg-[#0B1120] p-2 text-[11.5px] text-[#C9D4E5] whitespace-pre-wrap">{x.apres}</pre>
            <div className="flex gap-2"><button className="btn btn-primary min-h-9 py-1" onClick={() => decider(x, true)}>✓ {t.apply}</button><button className="btn min-h-9 py-1 bg-transparent text-white border-white/20" onClick={() => decider(x, false)}>{t.refuse}</button></div>
          </div>
        ))}
        {busy && <p className="text-[12px] text-[#93A1B8]" role="status">{nomAgent} … </p>}
      </div>
      <div className="shrink-0 border-t border-white/10 p-3 space-y-2">
        {!ai ? <p className="text-[12px] text-[#93A1B8]">{t.aiOff}</p>
          : !signedIn && supabase ? <div className="flex items-center gap-2 text-[12px] text-[#93A1B8]"><span className="flex-1">{t.needLogin}</span><button className="btn btn-primary min-h-9 py-1" onClick={() => window.dispatchEvent(new Event('learn:login'))}>{t.login}</button></div>
          : null}
        <div className="flex gap-2 items-end">
          <textarea value={demande} onChange={(e) => setDemande(e.target.value)} rows={2} placeholder={t.ask} aria-label={t.ask} disabled={!ai}
            onKeyDown={(e) => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); void envoyer() } }}
            className="flex-1 min-w-0 resize-none rounded-xl border border-white/12 bg-[#0B1120] px-3 py-2 text-[13px] text-white placeholder:text-[#64748B] disabled:opacity-50" />
          <button onClick={() => void envoyer()} disabled={!ai || !demande.trim() || busy} aria-label={t.send}
            className="size-11 shrink-0 grid place-items-center rounded-full bg-[#FF8A3D] text-[#0B1120] font-bold disabled:opacity-40">➤</button>
        </div>
      </div>
    </div>
  )

  // ───────── Palette (Ctrl+K) ─────────
  const actions: { label: string; faire: () => void }[] = [
    { label: t.run, faire: () => void lancer() }, { label: t.save, faire: () => void enregistrer() }, { label: t.zip, faire: zip },
    { label: t.exportJson, faire: () => exporter(p) }, { label: t.addFile, faire: ajouterFichier }, { label: t.journal, faire: () => { setBas('journal'); setVue('console') } },
    { label: t.changes, faire: () => setPanneau('modifs') }, { label: t.replay, faire: () => setPanneau('revoir') }, { label: t.newSession, faire: nouvelleSession },
    ...(['demander', 'accepter', 'auto', 'reflechir'] as const).map((m) => ({ label: `Mode : ${t.modes[m]}`, faire: () => setMode(m) })),
  ]

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0B1120] text-[#EDF1F8]" role="region" aria-label={p.titre}>
      {/* La barre : projet, modes, modèle, Lancer */}
      <div className="shrink-0 flex flex-wrap items-center gap-2 px-3 py-2 border-b border-white/10 bg-[#0F172A]">
        <button onClick={onBack} aria-label={t.close} className="size-10 grid place-items-center rounded-full text-xl text-[#C9D4E5] hover:bg-white/10">✕</button>
        <input value={p.titre} onChange={(e) => setP({ ...p, titre: e.target.value.slice(0, 80) })} aria-label={lang === 'fr' ? 'Titre du projet' : 'Project title'}
          className="min-w-0 flex-1 sm:flex-none sm:w-56 min-h-10 rounded-lg border border-white/12 bg-[#0B1120] px-3 font-semibold text-white" />
        <div className="order-3 lg:order-none w-full lg:w-auto flex overflow-x-auto rounded-full border border-white/12 text-[12px] [scrollbar-width:none]" role="radiogroup" aria-label={lang === 'fr' ? 'Mode de l’agent' : 'Agent mode'}>
          {(['demander', 'accepter', 'auto', 'reflechir'] as const).map((m) => (
            <button key={m} role="radio" aria-checked={mode === m} title={t.modesAide[m]} onClick={() => setMode(m)}
              className={`shrink-0 px-3 min-h-9 font-semibold ${mode === m ? 'bg-[#FF8A3D] text-[#0B1120]' : 'text-[#93A1B8] hover:text-white'}`}>{t.modes[m]}</button>
          ))}
        </div>
        <label className="hidden md:flex items-center gap-1.5 text-[12px] text-[#93A1B8]">{t.model}
          <select className="min-h-9 rounded-lg border border-white/12 bg-[#0B1120] px-2 text-white" defaultValue="auto" title={lang === 'fr' ? 'Le modèle est choisi automatiquement' : 'The model is chosen automatically'}><option value="auto">{t.auto}</option></select>
        </label>
        <span className="hidden lg:block flex-1" />
        <button onClick={() => void lancer()} disabled={!!running} className="ml-auto lg:ml-0 inline-flex items-center gap-1.5 rounded-full bg-[#FF8A3D] px-4 min-h-10 font-bold text-[#0B1120] disabled:opacity-60">
          {running ? '⏳ ' + t.running : '▶ ' + t.run}
        </button>
      </div>
      <p className="sr-only" aria-live="polite">{t.modesAide[mode]}</p>
      {/* Barre d'actions */}
      <div className="shrink-0 flex gap-2 overflow-x-auto px-3 py-2 border-b border-white/10 [scrollbar-width:none]">
        <button className={btnBarre} onClick={() => setPanneau('revoir')}>▶ {t.replay}</button>
        <button className={btnBarre} onClick={() => setPanneau('palette')}>⌕ {t.palette}</button>
        <button className={btnBarre} onClick={() => setPanneau('modifs')}>⇄ {t.changes}{props.length ? ` (${props.length})` : ''}</button>
        <button className={btnBarre} onClick={() => { setBas('journal'); if (basTaille === 'replie') setBasTaille('normal'); if (!large) setVue('console') }}>↺ {t.journal}</button>
        <button className={btnBarre} onClick={zip}>⤓ {t.zip}</button>
        {supabase && <button className={btnBarre} onClick={() => void enregistrer()} disabled={!!envoi}>☁ {envoi ? t.saving : t.save}</button>}
        <button className={btnBarre} onClick={nouvelleSession}>＋ {t.newSession}</button>
      </div>
      {note && <p className="shrink-0 px-3 py-2 text-[13px] bg-[#FB7185]/15 text-[#FDA4AF]" role="alert">{note}</p>}

      {/* Ordinateur : trois colonnes. Téléphone : une vue à la fois. */}
      <div className="flex-1 min-h-0 lg:grid lg:grid-cols-[220px_minmax(0,1fr)_380px] 2xl:grid-cols-[240px_minmax(0,1fr)_420px]">
        <div className={`${vue === 'fichiers' ? 'block' : 'hidden'} lg:block h-full min-h-0 bg-[#0F172A] lg:border-r border-white/10`}>{colonneFichiers}</div>
        <div className={`${vue === 'code' ? 'flex' : 'hidden'} lg:flex h-full min-h-0 flex-col`}>{colonneCentre}</div>
        {!large && vue === 'console' && <div className="flex h-full min-h-0 flex-col">{panneauBas}</div>}
        <div className={`${vue === 'agent' ? 'block' : 'hidden'} lg:block h-full min-h-0 bg-[#0F172A] lg:border-l border-white/10`}>{colonneAgent}</div>
      </div>

      {/* Barre d'état */}
      <footer className="shrink-0 flex items-center gap-3 h-7 px-3 bg-[#C2410C] text-white text-[11px] overflow-hidden">
        <span className="tabular-nums">{t.status(pos[0], pos[1])}</span>
        <span className="hidden sm:inline">{langageNom(f.chemin)}</span>
        <span className="hidden sm:inline">{t.auto}</span>
        <span className="flex-1" />
        {p.compteId && <span className="truncate">☁ {dirty ? t.unsaved : t.saved}</span>}
        <span className="font-semibold">{t.modes[mode]}</span>
      </footer>

      {/* Téléphone : onglets en bas */}
      <nav className="lg:hidden shrink-0 grid grid-cols-4 border-t border-white/10 bg-[#0F172A]" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }} role="tablist" aria-label={lang === 'fr' ? 'Vues du projet' : 'Project views'}>
        {(['fichiers', 'code', 'agent', 'console'] as const).map((k) => (
          <button key={k} role="tab" aria-selected={vue === k} onClick={() => setVue(k)}
            className={`min-h-12 flex flex-col items-center justify-center gap-0.5 text-[11px] font-semibold ${vue === k ? 'text-[#FF8A3D]' : 'text-[#93A1B8]'}`}>
            <span aria-hidden="true" className="text-base">{k === 'fichiers' ? '🗂' : k === 'code' ? '‹/›' : k === 'agent' ? '💬' : '›_'}</span>{t.tabs[k]}
          </button>
        ))}
      </nav>

      {panneau === 'palette' && <Palette t={t} fichiers={p.fichiers.map((x) => x.chemin)} actions={actions} onFichier={ouvrir} onFermer={() => setPanneau('')} />}
      {(panneau === 'modifs' || panneau === 'revoir') && (
        <div className="fixed inset-0 z-[60] bg-black/60 grid place-items-center p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) setPanneau('') }}>
          <div role="dialog" aria-label={panneau === 'modifs' ? t.changes : t.replay} className="w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-2xl border border-white/12 bg-[#0F172A] p-4 space-y-3">
            <div className="flex items-center justify-between"><p className="font-bold">{panneau === 'modifs' ? t.changes : t.replay}</p><button className="size-10 grid place-items-center rounded-full hover:bg-white/10" aria-label={lang === 'fr' ? 'Fermer' : 'Close'} onClick={() => setPanneau('')}>✕</button></div>
            {panneau === 'modifs' ? (
              props.length ? props.slice().reverse().map((x) => (
                <div key={x.id} className="rounded-xl border border-white/10 p-3 space-y-2 text-[13px]">
                  <p className="font-mono text-[#5FC8C0]">{x.fichier} · <span className="text-[#93A1B8]">{x.statut === 'appliquee' ? t.applied : x.statut === 'refusee' ? t.refused : t.waiting}</span></p>
                  <p className="text-[#C9D4E5]">{x.explication}</p>
                  {x.statut === 'appliquee' && <button className={btnBarre} onClick={() => annuler(x)}>↶ {t.undo}</button>}
                  {x.statut === 'attente' && <div className="flex gap-2"><button className="btn btn-primary min-h-9 py-1" onClick={() => decider(x, true)}>{t.apply}</button><button className={btnBarre} onClick={() => decider(x, false)}>{t.refuse}</button></div>}
                </div>
              )) : <p className="text-[13px] text-[#93A1B8]">{t.noChanges}</p>
            ) : (
              evts.length ? <ol className="space-y-1.5 font-mono text-[12.5px]">{evts.map((e) => (
                <li key={e.id}><span className="text-[#64748B]">{e.heure} </span><span className={e.qui === 'moi' ? 'text-white' : e.qui === 'action' ? 'text-[#5FC8C0]' : 'text-[#FF8A3D]'}>{e.qui === 'moi' ? (lang === 'fr' ? 'Toi' : 'You') : e.qui === 'agent' ? nomAgent : '•'}</span> <span className="whitespace-pre-wrap text-[#C9D4E5]">{e.texte}{e.etat ? ' · ' + e.etat : ''}</span></li>
              ))}</ol> : <p className="text-[13px] text-[#93A1B8]">{t.journalEmpty}</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function Palette({ t, fichiers, actions, onFichier, onFermer }: {
  t: (typeof T)[Lang]; fichiers: string[]; actions: { label: string; faire: () => void }[]; onFichier: (c: string) => void; onFermer: () => void
}) {
  const [q, setQ] = useState('')
  const [sel, setSel] = useState(0)
  const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  const liste = [
    ...fichiers.map((c) => ({ type: 'f' as const, label: c, faire: () => onFichier(c) })),
    ...actions.map((a) => ({ type: 'a' as const, ...a })),
  ].filter((x) => norm(x.label).includes(norm(q.trim())))
  const choisir = (i: number) => { const x = liste[i]; if (!x) return; onFermer(); x.faire() }
  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center bg-black/55 px-4 pt-[12vh]" onMouseDown={(e) => { if (e.target === e.currentTarget) onFermer() }}>
      <div role="dialog" aria-label={t.palette} className="w-full max-w-xl overflow-hidden rounded-2xl border border-white/12 bg-[#0F172A] shadow-2xl">
        <input autoFocus value={q} onChange={(e) => { setQ(e.target.value); setSel(0) }} placeholder={t.paletteHint} aria-label={t.paletteHint}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => Math.min(s + 1, liste.length - 1)) }
            else if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => Math.max(s - 1, 0)) }
            else if (e.key === 'Enter') { e.preventDefault(); choisir(sel) }
            else if (e.key === 'Escape') onFermer()
          }}
          className="w-full border-b border-white/10 bg-transparent px-4 py-3 text-white outline-none placeholder:text-[#64748B]" />
        <ul className="max-h-[50vh] overflow-y-auto py-1">
          {liste.map((x, i) => (
            <li key={x.type + x.label}>
              <button onMouseEnter={() => setSel(i)} onClick={() => choisir(i)} className={`flex w-full items-center gap-2.5 px-4 min-h-10 text-left text-[13px] ${i === sel ? 'bg-[#FF8A3D]/15 text-white' : 'text-[#C9D4E5]'}`}>
                <span className={`flex-1 truncate ${x.type === 'f' ? 'font-mono' : ''}`}>{x.label}</span>
                <span className="text-[10px] uppercase tracking-wider text-[#64748B]">{x.type === 'f' ? t.paletteFile : t.paletteAction}</span>
              </button>
            </li>
          ))}
          {!liste.length && <li className="px-4 py-3 text-[13px] text-[#93A1B8]">{t.paletteNone}</li>}
        </ul>
      </div>
    </div>
  )
}
