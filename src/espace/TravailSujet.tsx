import { lazy, Suspense, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { agents } from '../agents'
import { askTutor } from '../tutor'
import { profDe } from '../Classe'
import { Md } from '../Md'
import DiffModal from '../DiffModal'
import { Gl, Ico } from '../Icones'
import type { Lesson } from '../lessons'
import { lireBase, runCode, runPython, type RunResult, type TableVue } from '../runner'
import { MODULES } from '../cursusData'
import { contexteSql, tablesDe } from '../sqlBase'
import { expliqueErreur } from '../explainError'
import { contexteCours } from '../contexteCours'
import { controlerPython, constatsEnTexte } from '../lint'
import type { Lang } from '../i18n'

const Editeur = lazy(() => import('../atelier/Editeur'))

// TRAVAILLER UN SUJET AVEC LES AGENTS IA, dans le même cadre que l'Atelier de code (Beau, 14/10 : « quand je choisis de faire avec
// les agents IA, ça ouvre une page comme l'atelier de code ; si c'est neurosciences, c'est ça »). Plein écran sombre :
// à gauche la leçon · au milieu ce que demande le sujet (code et console, bac à prompts, notes) · à droite l'agent du sujet,
// discussion de hauteur fixe, saisie toujours en bas. Au téléphone : une vue à la fois, onglets en bas.
// La discussion est la même que celle de la classe (même clé locale) : on la retrouve en revenant à la leçon.

type Centre = 'code' | 'prompts' | 'notes' | 'base' | 'projet'
type Vue = 'lecon' | 'travail' | 'agent'
type Echange = { q: string; a: string; prof: string; ok?: boolean }

const T = {
  fr: {
    close: 'Revenir à la leçon', lesson: 'Leçon', explain: 'Explication', example: 'Exemple', task: 'À faire', hint: 'Indice', showHint: 'Voir l’indice',
    code: 'Code', prompts: 'Bac à prompts', notes: 'Notes', run: 'Lancer', running: 'Exécution…', output: 'Console', noRun: 'Lance le code pour voir le résultat ici.',
    ok: 'Ça marche !', ko: 'Pas encore : regarde la console, ou demande à l’agent.', noOutput: '(aucune sortie)',
    prompt: 'Ton prompt', send: 'Envoyer', answer: (n: string) => `Réponse de ${n}`, promptHelp: 'Écris un prompt, envoie-le, compare la réponse, puis améliore-le.',
    notesHelp: 'Tes notes et schémas pour ce sujet (gardés sur cet appareil).', ask: 'Pose ta question…', hello: (n: string, s: string) => `Bonjour ! Je suis ${n}. On travaille « ${s} » ensemble : demande-moi une explication, un exemple ou un indice.`,
    thinking: 'réfléchit…', aiOff: 'Active l’IA dans les réglages de Learn pour parler à l’agent.', needLogin: 'Connecte-toi pour parler à l’agent.',
    quota: 'Limite de questions atteinte pour aujourd’hui.', down: (n: string) => `${n} est indisponible pour l’instant, réessaie plus tard.`,
    prev: 'Leçon précédente', next: 'Leçon suivante', login: 'Connexion', tabs: { lecon: 'Leçon', travail: 'Travail', agent: 'Agent' }, points: 'Les points de la page',
    base: 'Base de données', tables: 'Tables', viewRows: 'Voir les données', baseHelp: 'La base de l’exercice est déjà prête : voici ses tables et leurs lignes. Écris ta requête dans l’onglet Code.',
    baseLoading: 'Chargement de la base…', baseFail: 'La base n’a pas pu se charger : vérifie ta connexion puis rouvre cet onglet.',
    rows: (n: number) => `${n} ligne${n > 1 ? 's' : ''}`, tryIt: 'Essayer : SELECT *',
    baseHello: 'La base de l’exercice est déjà prête : ouvre l’onglet « Base de données » pour voir ses tables avant d’écrire ta requête.',
    widen: 'Agrandir le chat', narrow: 'Réduire le chat', resize: 'Glisse pour changer la taille du chat',
    chips: [
      ['Explique mon code', 'Explique-moi pas à pas ce que fait mon code actuel, simplement.'],
      ['Un indice', 'Donne-moi un indice sur l’exercice, sans me donner la solution.'],
      ['Cherche l’erreur', 'Y a-t-il une erreur ou un piège dans mon code ? Dis-moi où regarder, sans me donner la solution.'],
      ['Revue de mon code', 'Fais une revue bienveillante de mon code : ce qui est bien, et deux choses à améliorer.'],
    ] as const,
    askErr: (n: string) => `✨ Demander à ${n}`, errQ: (e: string) => `J’ai cette erreur : « ${e} ». Explique-la-moi très simplement et dis-moi où regarder, sans me donner la solution.`,
    copy: 'Copier', copied: 'Copié', apply: 'Appliquer', compare: 'Comparer', yourAgents: 'Ton agent', status: { none: 'pas lancé', ok: 'réussi', ko: 'à corriger', err: 'erreur' },
    fileHint: 'Ctrl + Entrée pour lancer',
    sos: '🆘 Sauve-moi', sosTip: (n: string) => `Clique pour demander de l’aide à ${n}`,
    parcourir: '🔍 Parcourir', parcoursTitre: 'Revue de ton code', parcoursEnCours: 'Mes assistants lisent ton code…', parcoursFerme: 'Fermer la revue',
    sous: { bugs: ['Traque', 'Cherche les erreurs'], style: ['Stylia', 'Lisibilité et bonnes habitudes'], idees: ['Boost', 'Pour aller plus loin'] },
    parcoursQ: 'Relis mon code (les lignes sont numérotées) comme trois relecteurs différents. Réponds EXACTEMENT en trois blocs, chacun commençant par son étiquette seule sur une ligne : [BUGS], [STYLE], [IDEES]. Chaque bloc : 1 à 3 puces très courtes (une ligne), avec le numéro de ligne. [BUGS] : seulement les vraies erreurs, celles qui font planter ou donnent un mauvais résultat (nom jamais défini, mauvaise variable, borne ou indice faux, mauvais opérateur, cas limite : zéro, liste vide, nombre négatif). Imagine l’exécution ligne par ligne AVANT d’écrire « Rien à signaler ». [STYLE] : noms de variables clairs, répétitions, petites habitudes à prendre (par exemple une f-string plutôt qu’une concaténation) ; ne propose JAMAIS de changer la langue du code ou des commentaires. [IDEES] : une idée concrète liée à CE code (en faire une fonction, ajouter un test, gérer un cas limite). Pas de conseil générique. Ne donne jamais la solution complète de l’exercice.',
    detail: 'Détail technique',
    pj: { titre: 'Projet du module', essai: 'Essai', rappels: 'Rappels', rappelsAide: 'Les leçons du module à garder sous la main', indices: 'Indices', indice: (n: number, m: number) => `Indice ${n} / ${m}`, aucun: 'Cherche d’abord seul. Un indice se dévoile quand tu en as besoin.', valider: '✅ Valider', validant: '⏳ Vérification…', ok: 'Projet réussi : niveau validé !', suite: 'Passer au niveau suivant ›', echec: (e: number, m: number) => `Pas encore (${e}/${m} essais ratés).`, autre: 'Essayer un autre projet', autreTexte: 'Deux essais : ton prof te propose un autre projet du même niveau. Tu reviendras à celui-ci plus tard si tu veux.', cursus: '‹ Retour au cursus' },
    projet: '🏁 Projet', projetPropose: '🏁 Proposer un projet', projetCorrige: '✅ Corriger mon projet', projetValide: 'Projet validé par ton prof', projetAFaire: 'Un projet qui reprend tout ce que tu as fait dans ce module : tu le codes, ton prof le corrige, et tu passes au niveau suivant.',
    projetEnonce: 'Énoncé', projetCorrection: 'Correction de ton prof', projetAttente: 'ton prof prépare…', projetCorr: 'ton prof corrige…', projetVide: 'Demande un projet pour commencer.',
    projetQ: 'Propose-moi un projet de synthèse qui reprend tout ce que j’ai déjà réussi dans ce module (la liste est dans le contexte), à ma portée. Donne : un titre, l’énoncé en 3 à 5 lignes, deux exemples d’entrée/sortie, et 3 étapes pour avancer. Ne donne jamais la solution. Finis en me disant de coder dans l’onglet Projet puis d’appuyer sur « Corriger mon projet ».',
    projetCQ: 'Corrige mon projet de synthèse (l’énoncé est ci-dessous). Réponds en français simple : une note sur 10, ce qui est bien (1 à 3 puces), ce qui manque ou est faux (1 à 3 puces, sans donner le code complet corrigé). Termine par une ligne seule, exactement « NIVEAU VALIDÉ » si la note est d’au moins 7/10 et que le projet fait ce que demande l’énoncé, sinon « À REPRENDRE ».',
    projetStarter: '# Mon projet de synthèse\n# Lis l’énoncé en haut, puis écris ton code ici.\n',
    sosQ: 'À l’aide, je suis bloqué ! Regarde mon code et ce que dit la console, dis-moi simplement ce qui ne va pas et où regarder, sans me donner la solution.',
  },
  en: {
    close: 'Back to the lesson', lesson: 'Lesson', explain: 'Explanation', example: 'Example', task: 'Your task', hint: 'Hint', showHint: 'Show the hint',
    code: 'Code', prompts: 'Prompt lab', notes: 'Notes', run: 'Run', running: 'Running…', output: 'Console', noRun: 'Run the code to see the result here.',
    ok: 'It works!', ko: 'Not yet: check the console, or ask the agent.', noOutput: '(no output)',
    prompt: 'Your prompt', send: 'Send', answer: (n: string) => `${n}’s answer`, promptHelp: 'Write a prompt, send it, compare the answer, then improve it.',
    notesHelp: 'Your notes and sketches for this topic (kept on this device).', ask: 'Ask your question…', hello: (n: string, s: string) => `Hi! I’m ${n}. Let’s work on “${s}” together: ask me for an explanation, an example or a hint.`,
    thinking: 'is thinking…', aiOff: 'Turn on AI in Learn’s settings to talk to the agent.', needLogin: 'Sign in to talk to the agent.',
    quota: 'Question limit reached for today.', down: (n: string) => `${n} is unavailable right now, try again later.`,
    prev: 'Previous lesson', next: 'Next lesson', login: 'Sign in', tabs: { lecon: 'Lesson', travail: 'Work', agent: 'Agent' }, points: 'The points on this page',
    base: 'Database', tables: 'Tables', viewRows: 'See the data', baseHelp: 'The exercise database is already set up: here are its tables and rows. Write your query in the Code tab.',
    baseLoading: 'Loading the database…', baseFail: 'The database could not load: check your connection, then reopen this tab.',
    rows: (n: number) => `${n} row${n === 1 ? '' : 's'}`, tryIt: 'Try: SELECT *',
    baseHello: 'The exercise database is already set up: open the “Database” tab to see its tables before writing your query.',
    widen: 'Make the chat wider', narrow: 'Make the chat narrower', resize: 'Drag to resize the chat',
    chips: [
      ['Explain my code', 'Explain step by step what my current code does, simply.'],
      ['A hint', 'Give me a hint about the exercise, without giving me the solution.'],
      ['Find the error', 'Is there an error or a trap in my code? Tell me where to look, without giving me the solution.'],
      ['Review my code', 'Give a kind review of my code: what is good, and two things to improve.'],
    ] as const,
    askErr: (n: string) => `✨ Ask ${n}`, errQ: (e: string) => `I get this error: “${e}”. Explain it very simply and tell me where to look, without giving me the solution.`,
    copy: 'Copy', copied: 'Copied', apply: 'Apply', compare: 'Compare', yourAgents: 'Your agent', status: { none: 'not run', ok: 'passed', ko: 'to fix', err: 'error' },
    fileHint: 'Ctrl + Enter to run',
    sos: '🆘 Save me', sosTip: (n: string) => `Click to ask ${n} for help`,
    parcourir: '🔍 Scan', parcoursTitre: 'Review of your code', parcoursEnCours: 'My assistants are reading your code…', parcoursFerme: 'Close the review',
    sous: { bugs: ['Traque', 'Hunts errors'], style: ['Stylia', 'Readability and good habits'], idees: ['Boost', 'To go further'] },
    parcoursQ: 'Review my code (lines are numbered) as three different reviewers. Answer EXACTLY in three blocks, each starting with its label alone on a line: [BUGS], [STYLE], [IDEES]. Each block: 1 to 3 very short bullets (one line), with the line number. [BUGS]: only real errors, those that crash or give a wrong result (a name never defined, wrong variable, wrong bound or index, wrong operator, edge cases: zero, empty list, negative number). Imagine the execution line by line BEFORE writing “Nothing to report”. [STYLE]: clear variable names, repetition, small habits to adopt (for example an f-string instead of concatenation); NEVER suggest changing the language of the code or comments. [IDEES]: one concrete idea tied to THIS code (turn it into a function, add a test, handle an edge case). No generic advice. Never give the full solution of the exercise.',
    detail: 'Technical detail',
    pj: { titre: 'Module project', essai: 'Attempt', rappels: 'Reminders', rappelsAide: 'The module lessons to keep at hand', indices: 'Hints', indice: (n: number, m: number) => `Hint ${n} / ${m}`, aucun: 'Look on your own first. A hint is revealed when you need it.', valider: '✅ Validate', validant: '⏳ Checking…', ok: 'Project passed: level validated!', suite: 'Move on to the next level ›', echec: (e: number, m: number) => `Not yet (${e}/${m} failed attempts).`, autre: 'Try another project', autreTexte: 'Two attempts: your teacher offers you another project of the same level. You can come back to this one later.', cursus: '‹ Back to the path' },
    projet: '🏁 Project', projetPropose: '🏁 Suggest a project', projetCorrige: '✅ Check my project', projetValide: 'Project validated by your teacher', projetAFaire: 'A project that pulls together everything you did in this module: you code it, your teacher marks it, and you move on to the next level.',
    projetEnonce: 'Brief', projetCorrection: 'Your teacher’s feedback', projetAttente: 'your teacher is preparing…', projetCorr: 'your teacher is marking…', projetVide: 'Ask for a project to begin.',
    projetQ: 'Suggest a synthesis project that pulls together everything I already passed in this module (the list is in the context), within my reach. Give: a title, the brief in 3 to 5 lines, two input/output examples, and 3 steps to move forward. Never give the solution. End by telling me to code in the Project tab then press “Check my project”.',
    projetCQ: 'Mark my synthesis project (the brief is below). Answer in simple English: a mark out of 10, what is good (1 to 3 bullets), what is missing or wrong (1 to 3 bullets, without giving the full corrected code). End with a line on its own, exactly “NIVEAU VALIDÉ” if the mark is at least 7/10 and the project does what the brief asks, otherwise “À REPRENDRE”.',
    projetStarter: '# My synthesis project\n# Read the brief above, then write your code here.\n',
    sosQ: 'Help, I am stuck! Look at my code and what the console says, tell me simply what is wrong and where to look, without giving me the solution.',
  },
} as const

/** Mode « projet de module » : l'espace de travail sert à faire le projet de fin de module (brief, rappels, indices, validation par tests). */
export interface ProjetProps {
  numero: number; variante: string; essai: number; max: number; valide: boolean; validation: boolean
  rappels: { id: string; titre: string; texte: string }[]
  indices: string[]; vus: number; onIndice: () => void
  onValider: () => void; onAutre?: () => void; onSuite: () => void
}

const lire = (k: string) => { try { return localStorage.getItem(k) ?? '' } catch { return '' } }
const ecrire = (k: string, v: string) => { try { localStorage.setItem(k, v) } catch { /* ignoré */ } }
const lireFil = (k: string): Echange[] => {
  try { const v = JSON.parse(lire(k) || '[]'); return Array.isArray(v) ? v.filter((e) => e && typeof e.q === 'string' && typeof e.a === 'string').slice(-20) : [] } catch { return [] }
}
/** Sujets où l'on travaille des prompts (le bac à prompts y est proposé). */
const PROMPTS = new Set(['prompt', 'nlp', 'eng', 'outils'])

export default function TravailSujet({ lang, lesson, track, code, onCode, onRun, res, running, ai, signedIn, onClose, onPrev, onNext, projet }: {
  lang: Lang; lesson: Lesson; track: string; code: string; onCode: (v: string) => void; onRun: () => unknown
  projet?: ProjetProps
  res: RunResult | null; running: boolean; ai: boolean; signedIn: boolean; onClose: () => void; onPrev?: () => void; onNext?: () => void
}) {
  const t = T[lang]
  const titre = lesson.title[lang]
  const aCode = !lesson.predict && !lesson.lecture
  const aPrompts = PROMPTS.has(track) || lesson.group === 'pe'
  // SQL : la base de l'exercice existe déjà ; on la montre (tables et lignes) et on la décrit au prof.
  const estSql = lesson.lang === 'sql' && !!lesson.sql
  const setupSql = lesson.sql?.setup ?? ''
  const tables = useMemo(() => (estSql ? tablesDe(setupSql) : []), [estSql, setupSql])
  const [baseLue, setBaseLue] = useState<{ setup: string; tables: TableVue[] } | null>(null)
  const base = baseLue && baseLue.setup === setupSql ? baseLue.tables : null // null = pas encore lue pour cette leçon
  useEffect(() => {
    if (!estSql) return
    let ok = true
    void lireBase(setupSql).then((b) => { if (ok) setBaseLue({ setup: setupSql, tables: b }) })
    return () => { ok = false }
  }, [estSql, setupSql])
  // Largeur du chat de l'agent, réglable (Beau, 26/10 : « je dois pouvoir augmenter la taille du chat ») et gardée sur l'appareil.
  const bornesLarg = () => [300, Math.max(320, Math.min(900, Math.round((typeof window !== 'undefined' ? window.innerWidth : 1400) * 0.65)))] as const
  const [largChoisie, setLargChoisie] = useState(() => { const v = Number(lire('learn:agentW')); return v >= 300 ? v : (typeof window !== 'undefined' && window.innerWidth >= 1536 ? 440 : 380) })
  const larg = Math.min(largChoisie, bornesLarg()[1])
  const fixerLarg = (w: number) => { const [a, b] = bornesLarg(); const v = Math.round(Math.min(b, Math.max(a, w))); setLargChoisie(v); ecrire('learn:agentW', String(v)) }
  const glisser = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault()
    const x0 = e.clientX, w0 = larg, el = e.currentTarget
    el.setPointerCapture(e.pointerId)
    const mv = (ev: PointerEvent) => fixerLarg(w0 + (x0 - ev.clientX))
    const fin = () => { el.removeEventListener('pointermove', mv); el.removeEventListener('pointerup', fin); el.removeEventListener('pointercancel', fin) }
    el.addEventListener('pointermove', mv); el.addEventListener('pointerup', fin); el.addEventListener('pointercancel', fin)
  }
  const large = larg >= 560
  const [centre, setCentre] = useState<Centre>(aCode ? 'code' : 'notes')
  const [vue, setVue] = useState<Vue>('travail')
  const [voirIndice, setVoirIndice] = useState(false)
  const prets = agents.filter((a) => a.ready)
  const [profId, setProfId] = useState(() => lire('learn:prof:' + track) || profDe(track, lesson.lang ?? 'js'))
  const prof = prets.find((a) => a.id === profId) ?? prets[0]
  const choisirProf = (id: string) => { setProfId(id); ecrire('learn:prof:' + track, id) }
  const [diff, setDiff] = useState<string | null>(null)
  const moduleId = MODULES.find((m) => m.groups.includes(lesson.group ?? 'js'))?.id ?? 'libre'
  const projetCle = 'learn:projet:' + moduleId + ':' + (lesson.lang ?? 'js')
  const [projetCode, setProjetCode] = useState(() => lire(projetCle) || '')
  const [projetRes, setProjetRes] = useState<RunResult | null>(null)
  const [projetBusy, setProjetBusy] = useState<'' | 'run' | 'enonce' | 'corrige'>('')
  const [enonce, setEnonce] = useState(() => lire('learn:projetEnonce:' + moduleId))
  const [correction, setCorrection] = useState('')
  const [valide, setValide] = useState(() => !!lire('learn:projetValide:' + moduleId))
  const [revue, setRevue] = useState<{ etat: 'cours' | 'ok' | 'erreur'; blocs: Record<'bugs' | 'style' | 'idees', string>; brut: string } | null>(null)
  // La rangée des agents se replie (Beau, 26/10 : « je dois pouvoir fermer cette partie, pour que ça ne prenne pas trop de place »), et le choix est gardé.
  const [choixOuvert, setChoixOuvert] = useState(() => lire('learn:agentsOuverts') !== '0')
  const basculerChoix = () => { setChoixOuvert((o) => { ecrire('learn:agentsOuverts', o ? '0' : '1'); return !o }) }
  const cleFil = `learn:fil:${track}:${titre}`
  const [fil, setFil] = useState<Echange[]>(() => lireFil(cleFil))
  const [question, setQuestion] = useState('')
  const [busy, setBusy] = useState(false)
  const [notes, setNotes] = useState(() => lire('learn:notes:' + lesson.id))
  const [prompt, setPrompt] = useState('')
  const [reponse, setReponse] = useState('')
  const [promptBusy, setPromptBusy] = useState(false)
  const boite = useRef<HTMLDivElement>(null)
  const enBas = useRef(true)
  const langage = lesson.langue === 'c' ? 'C' : lesson.langue === 'cpp' ? 'C++' : lesson.lang === 'py' ? 'Python' : lesson.lang === 'sql' ? 'SQL' : 'JavaScript'

  const fermer = useRef(onClose)
  useEffect(() => { fermer.current = onClose })
  useEffect(() => {
    const avant = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') fermer.current() }
    window.addEventListener('keydown', esc)
    return () => { document.body.style.overflow = avant; window.removeEventListener('keydown', esc) }
  }, [])

  useEffect(() => { const el = boite.current; if (el && enBas.current) el.scrollTop = el.scrollHeight }, [fil, busy, vue])

  const poser = async (texte?: string) => {
    const q = (texte ?? question).trim()
    if (!q || busy || !ai || !signedIn) return
    enBas.current = true; setBusy(true); setQuestion('')
    setFil((f) => [...f, { q, a: '', prof: prof.id }])
    const history = fil.filter((e) => e.prof === prof.id && e.ok !== false && e.a).slice(-3).flatMap((e) => [{ role: 'user' as const, text: e.q }, { role: 'model' as const, text: e.a }])
    const r = await askTutor({ question: q, code: aCode ? code : notes, lesson: contexteCours(lesson, lang, (() => { try { return JSON.parse(localStorage.getItem('learn:done') ?? '[]') as string[] } catch { return [] } })(), (estSql ? contexteSql(titre, setupSql, lang) : '') + '\n' + (lang === 'fr' ? 'Où il en est : ' : 'Where he is: ') + (!res ? (lang === 'fr' ? 'il n’a pas encore lancé son code' : 'he has not run his code yet') : res.passed ? (lang === 'fr' ? 'exercice réussi' : 'exercise passed') : res.error ? (lang === 'fr' ? 'son code a une erreur : ' : 'his code has an error: ') + res.error.slice(0, 200) : (lang === 'fr' ? 'il a lancé son code, le résultat n’est pas bon' : 'he ran his code, the result is wrong'))), output: res?.output.join('\n') ?? '', lang, agentId: prof.id, history })
    const a = r.answer ?? (r.error === 'quota' ? t.quota : t.down(prof.name))
    setFil((f) => {
      const suite = [...f.slice(0, -1), { q, a, prof: prof.id, ok: !!r.answer }].slice(-20)
      // Un refus (quota, panne) s'affiche mais ne se garde pas, comme dans la classe.
      ecrire(cleFil, JSON.stringify(suite.filter((e) => e.ok)))
      return suite
    })
    setBusy(false)
  }

  const envoyerPrompt = async () => {
    const p = prompt.trim()
    if (!p || promptBusy || !ai || !signedIn) return
    setPromptBusy(true); setReponse('')
    const r = await askTutor({ question: p, code: '', lesson: `[Prompt] ${titre}`, output: '', lang, agentId: prof.id })
    setReponse(r.answer ?? (r.error === 'quota' ? t.quota : t.down(prof.name)))
    setPromptBusy(false)
  }


  const avatar = (a: typeof prof, taille: string) => a.face
    ? <img src={a.face} alt="" className={`${taille} rounded-full object-cover border border-slate-700`} />
    : <span className={`${taille} rounded-full grid place-items-center bg-slate-700 text-slate-100 font-bold text-[12px]`}>{a.name[0]}</span>
  const nomFichier = lesson.lang === 'py' ? 'main.py' : lesson.lang === 'sql' ? 'requete.sql' : 'main.js'
  const statut: keyof typeof t.status = !res ? 'none' : res.passed ? 'ok' : res.error ? 'err' : 'ko'
  const couleurStatut = { none: 'text-slate-400 border-slate-700', ok: 'text-emerald-300 border-emerald-500/50 bg-emerald-500/10', ko: 'text-amber-300 border-amber-500/50 bg-amber-500/10', err: 'text-rose-300 border-rose-500/50 bg-rose-500/10' }[statut]
  const explication = res?.error ? expliqueErreur(res.error, lang, code) : null
  const parcourir = async () => {
    if (!ai || !signedIn) { window.dispatchEvent(new Event('learn:login')); return }
    if (revue?.etat === 'cours') return
    setRevue({ etat: 'cours', blocs: { bugs: '', style: '', idees: '' }, brut: '' })
    const faits = (() => { try { return JSON.parse(localStorage.getItem('learn:done') ?? '[]') as string[] } catch { return [] } })()
    // Les faits sûrs d'abord (noms jamais définis, variables inutilisées), trouvés par un programme : la revue ne peut pas les rater.
    const constats = lesson.lang === 'py' ? controlerPython(code) : null
    const faitsTxt = constats ? constatsEnTexte(constats, lang) : ''
    const numerote = code.split('\n').map((l, i) => `${i + 1} | ${l}`).join('\n')
    const question = t.parcoursQ + (faitsTxt ? (lang === 'fr' ? '\n\nFAITS CERTAINS (vérifiés par un programme, à ne jamais contredire) : ' : '\n\nCERTAIN FACTS (checked by a program, never contradict them): ') + faitsTxt : '')
    const r = await askTutor({ question, code: numerote, lesson: contexteCours(lesson, lang, faits, estSql ? contexteSql(titre, setupSql, lang) : ''), output: (res?.output.join('\n') ?? '') + (res?.error ? '\n' + res.error.split('\n').filter(Boolean).pop() : ''), lang, agentId: prof.id })
    if (!r.answer) { setRevue({ etat: 'erreur', blocs: { bugs: '', style: '', idees: '' }, brut: r.error === 'quota' ? t.quota : t.down(prof.name) }); return }
    const bloc = (nom: string) => new RegExp('\\[' + nom + '\\]\\s*([\\s\\S]*?)(?=\\[(?:BUGS|STYLE|IDEES)\\]|$)', 'i').exec(r.answer!)?.[1]?.trim() ?? ''
    const certain = (l: { nom: string; ligne: number }[], fr: (x: { nom: string; ligne: number }) => string, en: (x: { nom: string; ligne: number }) => string) => l.map((x) => '- ' + (lang === 'fr' ? fr(x) : en(x))).join('\n')
    const bugsCertains = constats ? certain(constats.indefinis, (x) => `**Ligne ${x.ligne}** : « ${x.nom} » n’existe pas encore (NameError). Crée-la avant de l’utiliser, par exemple « ${x.nom} = 0 ».`, (x) => `**Line ${x.ligne}**: “${x.nom}” does not exist yet (NameError). Create it before using it, for example “${x.nom} = 0”.`) : ''
    const stylesCertains = constats ? certain(constats.inutilises, (x) => `**Ligne ${x.ligne}** : « ${x.nom} » est créée mais jamais utilisée : supprime-la, ou sers-t’en.`, (x) => `**Line ${x.ligne}**: “${x.nom}” is created but never used: delete it, or use it.`) : ''
    const rien = /rien à signaler|nothing to report/i
    const fusion = (certains: string, ia: string) => (certains ? certains + (ia && !rien.test(ia) ? '\n' + ia : '') : ia)
    setRevue({ etat: 'ok', blocs: { bugs: fusion(bugsCertains, bloc('BUGS')), style: fusion(stylesCertains, bloc('STYLE')), idees: bloc('IDEES') }, brut: r.answer })
  }
  const faits = () => { try { return JSON.parse(localStorage.getItem('learn:done') ?? '[]') as string[] } catch { return [] as string[] } }
  const proposerProjet = async () => {
    if (!ai || !signedIn) { window.dispatchEvent(new Event('learn:login')); return }
    if (projetBusy) return
    setCentre('projet'); setVue('travail'); setProjetBusy('enonce')
    const r = await askTutor({ question: t.projetQ, code: '', lesson: contexteCours(lesson, lang, faits()), output: '', lang, agentId: prof.id })
    if (r.answer) { setEnonce(r.answer); ecrire('learn:projetEnonce:' + moduleId, r.answer); setCorrection(''); if (!projetCode.trim()) { setProjetCode(t.projetStarter) } }
    else setEnonce(r.error === 'quota' ? t.quota : t.down(prof.name))
    setProjetBusy('')
  }
  const changerProjetCode = (v: string) => { setProjetCode(v); ecrire(projetCle, v) }
  const lancerProjet = async () => {
    if (projetBusy) return
    setProjetBusy('run')
    const r = await (lesson.lang === 'py' ? runPython(projetCode, [], lesson.packages ?? []) : runCode(projetCode, []))
    setProjetRes(r); setProjetBusy('')
  }
  const corrigerProjet = async () => {
    if (!ai || !signedIn) { window.dispatchEvent(new Event('learn:login')); return }
    if (projetBusy || !enonce || !projetCode.trim()) return
    setProjetBusy('corrige'); setCorrection('')
    const r = await askTutor({ question: t.projetCQ + '\n\nÉNONCÉ :\n' + enonce.slice(0, 1500), code: projetCode, lesson: contexteCours(lesson, lang, faits()), output: projetRes?.output.join('\n') ?? (projetRes?.error ?? ''), lang, agentId: prof.id })
    if (r.answer) {
      setCorrection(r.answer)
      if (/NIVEAU\s+VALID[ÉE]/i.test(r.answer)) { ecrire('learn:projetValide:' + moduleId, new Date().toISOString().slice(0, 10)); setValide(true) }
    } else setCorrection(r.error === 'quota' ? t.quota : t.down(prof.name))
    setProjetBusy('')
  }
  const sauveMoi = () => {
    if (!ai || !signedIn) { window.dispatchEvent(new Event('learn:login')); return }
    setVue('agent')
    void poser(t.sosQ)
  }
  const demanderErreur = () => {
    if (!res?.error) return
    const derniere = res.error.split('\n').filter(Boolean).pop() ?? res.error
    setVue('agent')
    void poser(t.errQ(derniere.slice(0, 300)))
  }
  const btnTab = (actif: boolean) => `px-3 h-full flex items-center gap-1.5 whitespace-nowrap text-[13px] font-medium border-b-2 ${actif ? 'border-sky-400 text-white bg-slate-900' : 'border-transparent text-slate-400 hover:text-slate-200'}`
  const zoneTexte = 'w-full resize-none rounded-lg border border-slate-700 bg-slate-950 p-3 text-[16px] lg:text-[13.5px] text-slate-100 placeholder:text-slate-500 focus:border-sky-500 outline-none'
  const titreMini = 'text-[11px] font-semibold uppercase tracking-wider text-slate-400'

  // ───────── Gauche : le projet (énoncé, rappels, indices) ─────────
  const colonneProjet = projet && (
    <div className="h-full overflow-y-auto p-4 space-y-4 text-[13.5px] leading-relaxed">
      <div>
        <p className={titreMini}>{t.pj.titre} {projet.numero} · {projet.variante}</p>
        <h2 className="mt-1 text-[17px] font-bold text-white leading-snug">{titre}</h2>
        <p className="mt-1 text-[11.5px] text-slate-400">{t.pj.essai} {Math.min(projet.essai + 1, projet.max)} / {projet.max}</p>
      </div>
      <section><p className="text-slate-300 whitespace-pre-line">{lesson.explain[lang]}</p></section>
      <section className="rounded-xl border border-sky-500/40 bg-sky-500/10 p-3 space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-sky-300">{t.pj.indices}</p>
        {projet.vus === 0 && <p className="text-[12.5px] text-slate-300">{t.pj.aucun}</p>}
        {projet.indices.slice(0, projet.vus).map((x, i) => <p key={i} className="text-[13px] text-slate-100"><b className="text-sky-300">{i + 1}.</b> <Gl>{'💡 ' + x}</Gl></p>)}
        {projet.vus < projet.indices.length && <button onClick={projet.onIndice} className="rounded-md border border-sky-500/50 bg-slate-900 hover:bg-slate-800 px-3 min-h-8 text-[12.5px] font-medium text-sky-200">{t.pj.indice(projet.vus + 1, projet.indices.length)}</button>}
      </section>
      <section className="space-y-1.5">
        <p className={titreMini}>{t.pj.rappels}</p>
        <p className="text-[12px] text-slate-400">{t.pj.rappelsAide}</p>
        {projet.rappels.map((r) => (
          <details key={r.id} className="rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-1.5">
            <summary className="cursor-pointer text-[13px] font-medium text-slate-100">{r.titre}</summary>
            <p className="mt-1.5 text-[12.5px] text-slate-300 whitespace-pre-line">{r.texte}</p>
          </details>
        ))}
      </section>
      <button onClick={onClose} className="w-full rounded-lg border border-slate-700 min-h-10 text-[12.5px] text-slate-300 hover:bg-slate-800">{t.pj.cursus}</button>
    </div>
  )

  // ───────── Gauche : la leçon ─────────
  const colonneLecon = projet ? colonneProjet : (
    <div className="h-full overflow-y-auto p-4 space-y-4 text-[13.5px] leading-relaxed">
      <div>
        <p className={titreMini}>{t.lesson} · {langage}</p>
        <h2 className="mt-1 text-[17px] font-bold text-white leading-snug">{titre}</h2>
      </div>
      <section><p className={titreMini + ' mb-1'}>{t.explain}</p><p className="text-slate-300 whitespace-pre-line">{lesson.explain[lang]}</p></section>
      {lesson.example && <section><p className={titreMini + ' mb-1'}>{t.example}</p>
        <pre className="rounded-lg bg-slate-950 border border-slate-800 p-3 text-[12px] text-slate-100 overflow-x-auto whitespace-pre font-mono">{lesson.example}</pre></section>}
      {lesson.lecture && <section><p className={titreMini + ' mb-1'}>{t.points}</p>
        <ul className="list-disc pl-5 space-y-1 text-slate-300">{lesson.lecture[lang].map((x) => <li key={x}>{x}</li>)}</ul></section>}
      <section className="rounded-xl border border-sky-500/40 bg-sky-500/10 p-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-sky-300 mb-1">{t.task}</p>
        <p className="font-semibold text-white">{lesson.task[lang]}</p>
        {lesson.hint[lang] && (voirIndice
          ? <p className="mt-2 text-slate-300"><Gl>{'💡 ' + lesson.hint[lang]}</Gl></p>
          : <button onClick={() => setVoirIndice(true)} className="mt-2 text-[12px] font-semibold text-sky-300 underline">{t.showHint}</button>)}
      </section>
      {(onPrev || onNext) && (
        <div className="flex gap-2">
          {onPrev && <button onClick={onPrev} className="flex-1 rounded-lg border border-slate-700 min-h-10 text-[12px] text-slate-300 hover:bg-slate-800"><Gl>{'‹ ' + t.prev}</Gl></button>}
          {onNext && <button onClick={onNext} className="flex-1 rounded-lg border border-slate-700 min-h-10 text-[12px] text-slate-300 hover:bg-slate-800"><Gl>{t.next + ' ›'}</Gl></button>}
        </div>
      )}
    </div>
  )

  // ───────── Centre : éditeur (onglets de fichier) + console ─────────
  const onglets: Centre[] = [...(aCode ? ['code' as const] : []), ...(aCode && !estSql && !projet ? ['projet' as const] : []), ...(estSql ? ['base' as const] : []), ...(aPrompts ? ['prompts' as const] : []), 'notes']
  const colonneCentre = (
    <div className="h-full flex flex-col min-h-0 bg-slate-950">
      <div className="shrink-0 flex items-stretch h-10 border-b border-slate-800 bg-slate-950" role="tablist" aria-label={titre}>
        {onglets.map((k) => (
          <button key={k} role="tab" aria-selected={centre === k} onClick={() => setCentre(k)} className={btnTab(centre === k)}>
            <Gl>{k === 'code' ? <span className="font-mono text-[12.5px]">{nomFichier}</span> : k === 'projet' ? t.projet + (valide ? ' ✓' : '') : k === 'base' ? '🗄️ ' + t.base : k === 'prompts' ? '✦ ' + t.prompts : '✎ ' + t.notes}</Gl>
          </button>
        ))}
        <span className="flex-1" />
        {centre === 'code' && (
          <div className="flex items-center gap-2 pr-2 shrink-0">
            <span className="hidden 2xl:inline text-[11px] text-slate-500">{t.fileHint}</span>
            <button onClick={() => void parcourir()} disabled={revue?.etat === 'cours'} className="h-8 px-3 rounded-md border border-slate-700 bg-slate-900 hover:bg-slate-800 whitespace-nowrap text-[13px] font-medium text-slate-200 disabled:opacity-60"><Gl>{(revue?.etat === 'cours' ? '⏳ ' : '') + t.parcourir}</Gl></button>
            {projet && <button onClick={projet.onValider} disabled={running || projet.validation || projet.valide}
              className="h-8 px-3 rounded-md border border-emerald-500/60 bg-emerald-500/15 hover:bg-emerald-500/25 whitespace-nowrap text-[13px] font-semibold text-emerald-200 disabled:opacity-50"><Gl>{projet.validation ? t.pj.validant : t.pj.valider}</Gl></button>}
            <button onClick={() => void onRun()} disabled={running}
              className="h-8 px-4 rounded-md bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 whitespace-nowrap text-[13px] font-semibold text-white shadow shadow-sky-500/20 disabled:opacity-60">
              <Gl>{running ? '⏳ ' + t.running : '▶ ' + t.run}</Gl>
            </button>
          </div>
        )}
      </div>
      {centre === 'code' && revue && (
        <div className="shrink-0 max-h-[42%] overflow-y-auto border-b border-slate-800 bg-slate-900 p-3" aria-live="polite">
          <div className="flex items-center mb-2"><p className={titreMini}>{t.parcoursTitre}</p><span className="flex-1" />
            <button onClick={() => setRevue(null)} aria-label={t.parcoursFerme} className="size-7 grid place-items-center rounded text-slate-400 hover:bg-slate-800 hover:text-white"><Ico n="x" className="size-4" /></button></div>
          {revue.etat === 'cours' ? <p className="text-[13px] text-sky-300 animate-pulse">{t.parcoursEnCours}</p>
            : revue.etat === 'erreur' ? <p className="text-[13px] text-rose-300">{revue.brut}</p>
            : (revue.blocs.bugs || revue.blocs.style || revue.blocs.idees)
              ? <div className="grid gap-3 xl:grid-cols-3">
                {(['bugs', 'style', 'idees'] as const).map((k, i) => (
                  <section key={k} className="min-w-0 rounded-lg border border-slate-800 bg-slate-950/70 p-2.5">
                    <div className="flex items-center gap-2 mb-1.5">
                      <img src={import.meta.env.BASE_URL + 'visages/' + ['09', '10', '11'][i] + '.jpg'} alt="" className="size-6 rounded-full object-cover border border-slate-700" />
                      <div className="min-w-0"><p className="text-[12px] font-semibold text-slate-100 leading-tight">{t.sous[k][0]}</p><p className="text-[10.5px] text-slate-400 leading-tight truncate">{t.sous[k][1]}</p></div>
                    </div>
                    {revue.blocs[k] ? <Md text={revue.blocs[k]} className="md-sombre text-[12.5px]" /> : <p className="text-[12px] text-slate-500">—</p>}
                  </section>
                ))}
              </div>
              : <Md text={revue.brut} className="md-sombre" />}
        </div>
      )}
      {centre === 'code' && (
        <div className="flex-1 min-h-0 flex flex-col">
          {estSql && tables.length > 0 && (
            <div className="shrink-0 flex flex-wrap items-center gap-x-4 gap-y-1 px-3 py-2 border-b border-slate-800 bg-slate-900 text-[12px] font-mono text-slate-300">
              <span className={'font-sans ' + titreMini}>{t.tables}</span>
              {tables.map((x) => <span key={x.nom}><span className="text-sky-300">{x.nom}</span>({x.colonnes.join(', ')})</span>)}
              <button onClick={() => setCentre('base')} className="ml-auto font-sans text-[12px] font-semibold text-sky-300 underline min-h-8">{t.viewRows}</button>
            </div>
          )}
          <div className="flex-1 min-h-40">
            <Suspense fallback={<div className="p-4 text-slate-500 text-[13px]">…</div>}>
              <Editeur chemin={nomFichier} valeur={code} onChange={onCode} onCurseur={() => {}} onLancer={() => void onRun()} label={t.code}
                compagnon={
                  <button onClick={sauveMoi} disabled={busy} title={t.sosTip(prof.name)} aria-label={t.sosTip(prof.name)}
                    className={`rounded-full p-0.5 bg-slate-900/90 border shadow-lg transition hover:scale-110 disabled:opacity-60 ${statut === 'err' || statut === 'ko' ? 'border-amber-400 shadow-amber-400/30 animate-pulse' : 'border-slate-700'}`}>
                    {avatar(prof, 'size-9')}
                  </button>}
                assistants={([['bugs', '09'], ['style', '10'], ['idees', '11']] as const).map(([k, f]) => {
                  const note = revue?.etat === 'ok' ? revue.blocs[k] : ''
                  const alerte = k === 'bugs' && !!note && !/rien à signaler|nothing to report/i.test(note)
                  return (
                    <button key={k} onClick={() => void parcourir()} title={`${t.sous[k][0]} · ${t.sous[k][1]}`} aria-label={`${t.sous[k][0]} · ${t.sous[k][1]}`}
                      className="relative rounded-full bg-slate-900/90 border border-slate-700 p-0.5 shadow hover:scale-110 transition">
                      <img src={import.meta.env.BASE_URL + 'visages/' + f + '.jpg'} alt="" className="size-7 rounded-full object-cover" />
                      {revue?.etat === 'cours' && <span className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full bg-sky-400 animate-pulse" />}
                      {note && <span className={`absolute -top-0.5 -right-0.5 size-2.5 rounded-full ${alerte ? 'bg-rose-400' : 'bg-emerald-400'}`} />}
                    </button>
                  )
                })} />
            </Suspense>
          </div>
          <div className="shrink-0 h-[38%] min-h-36 border-t border-slate-800 flex flex-col bg-slate-950">
            <div className="shrink-0 flex items-center gap-2 h-9 px-3 border-b border-slate-800/80">
              <p className={titreMini}><Gl>{'›_ ' + t.output}</Gl></p>
              <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${couleurStatut}`}>{t.status[statut]}</span>
              <span className="flex-1" />
              <button onClick={sauveMoi} disabled={busy} className="flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-900 hover:bg-slate-800 pl-1 pr-2.5 h-7 text-[12px] font-medium text-slate-200 disabled:opacity-50">{avatar(prof, 'size-5')}<Gl>{t.sos}</Gl></button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto px-3 py-2 font-mono text-[12.5px] leading-relaxed" aria-live="polite">
              {projet?.valide && (
                <div className="mb-2 rounded-lg border border-emerald-500/50 bg-emerald-500/10 p-2.5 font-sans text-[13px] text-emerald-100">
                  <p className="font-semibold"><Gl>{'🏁 ' + t.pj.ok}</Gl></p>
                  <button onClick={projet.onSuite} className="mt-2 rounded-md bg-gradient-to-r from-emerald-500 to-teal-600 px-3 min-h-8 text-[12.5px] font-semibold text-white">{t.pj.suite}</button>
                </div>
              )}
              {!res ? <p className="text-slate-500">{t.noRun}</p> : <>
                <pre className="whitespace-pre-wrap text-slate-100">{res.output.length ? res.output.join('\n') : t.noOutput}</pre>
                {res.error && (() => {
                  const lignes = res.error.split('\n').filter(Boolean)
                  const derniere = lignes[lignes.length - 1]
                  return (<>
                    <pre className="mt-1 whitespace-pre-wrap text-rose-300">{derniere}</pre>
                    {lignes.length > 1 && <details className="mt-1 text-slate-500"><summary className="cursor-pointer text-[11.5px] font-sans">{t.detail}</summary><pre className="mt-1 whitespace-pre-wrap text-[11.5px]">{res.error}</pre></details>}
                  </>)
                })()}
                {explication && (
                  <div className="mt-2 rounded-lg border border-sky-500/40 bg-sky-500/10 p-2.5 font-sans text-[13px] text-slate-100">
                    <p><Gl>{'💡 ' + explication}</Gl></p>
                    {ai && signedIn && <button onClick={demanderErreur} disabled={busy} className="mt-2 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 min-h-8 text-[12px] font-medium text-sky-300 disabled:opacity-50">{t.askErr(prof.name)}</button>}
                  </div>
                )}
                {res.tests && res.tests.total > 0 && <p className={`mt-1 font-sans font-semibold ${res.tests.ok === res.tests.total ? 'text-emerald-300' : 'text-amber-300'}`}>Tests : {res.tests.ok} / {res.tests.total}</p>}
                {res.passed === true && <p className="mt-1 font-sans font-semibold text-emerald-300"><Gl>{'✅ ' + t.ok}</Gl></p>}
                {projet && !projet.valide && projet.essai > 0 && <p className="mt-2 font-sans text-[13px] text-amber-300">{t.pj.echec(projet.essai, projet.max)}</p>}
                {projet && !projet.valide && projet.essai >= projet.max && projet.onAutre && (
                  <div className="mt-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-2.5 font-sans text-[13px] text-slate-100">
                    <p>{t.pj.autreTexte}</p>
                    <button onClick={projet.onAutre} className="mt-2 rounded-md bg-gradient-to-r from-sky-500 to-blue-600 px-3 min-h-8 text-[12.5px] font-semibold text-white">{t.pj.autre}</button>
                  </div>
                )}
                {res.passed === false && <p className="mt-1 font-sans text-amber-300">{t.ko}</p>}
              </>}
            </div>
          </div>
        </div>
      )}
      {centre === 'projet' && (
        <div className="flex-1 min-h-0 flex flex-col">
          <div className="shrink-0 flex flex-wrap items-center gap-2 px-3 py-2 border-b border-slate-800 bg-slate-900">
            <button onClick={() => void proposerProjet()} disabled={!!projetBusy} className="h-8 px-3 rounded-md border border-slate-700 bg-slate-800 hover:bg-slate-700 text-[12.5px] font-medium text-slate-100 disabled:opacity-50"><Gl>{projetBusy === 'enonce' ? '⏳ ' + t.projetAttente : t.projetPropose}</Gl></button>
            <button onClick={() => void lancerProjet()} disabled={!!projetBusy || !projetCode.trim()} className="h-8 px-3 rounded-md border border-slate-700 bg-slate-800 hover:bg-slate-700 text-[12.5px] font-medium text-slate-100 disabled:opacity-50"><Gl>{projetBusy === 'run' ? '⏳' : '▶ ' + t.run}</Gl></button>
            <button onClick={() => void corrigerProjet()} disabled={!!projetBusy || !enonce || !projetCode.trim()} className="h-8 px-3 rounded-md bg-gradient-to-r from-sky-500 to-blue-600 text-[12.5px] font-semibold text-white disabled:opacity-40"><Gl>{projetBusy === 'corrige' ? '⏳ ' + t.projetCorr : t.projetCorrige}</Gl></button>
            {valide && <span className="rounded-full border border-emerald-500/50 bg-emerald-500/10 px-2.5 py-0.5 text-[11.5px] font-medium text-emerald-300"><Gl>{'🏁 ' + t.projetValide}</Gl></span>}
          </div>
          <div className="shrink-0 max-h-[34%] overflow-y-auto px-3 py-2 border-b border-slate-800 bg-slate-900/60">
            <p className={titreMini + ' mb-1'}>{t.projetEnonce}</p>
            {enonce ? <Md text={enonce} className="md-sombre text-[13px]" /> : <p className="text-[12.5px] text-slate-400">{t.projetAFaire} {t.projetVide}</p>}
          </div>
          <div className="flex-1 min-h-32">
            <Suspense fallback={<div className="p-4 text-slate-500 text-[13px]">…</div>}>
              <Editeur chemin={lesson.lang === 'py' ? 'projet.py' : 'projet.js'} valeur={projetCode} onChange={changerProjetCode} onCurseur={() => {}} onLancer={() => void lancerProjet()} label={t.projet} />
            </Suspense>
          </div>
          {(projetRes || correction) && (
            <div className="shrink-0 max-h-[40%] overflow-y-auto border-t border-slate-800 bg-slate-950 px-3 py-2 font-mono text-[12.5px]" aria-live="polite">
              {projetRes && <>
                <pre className="whitespace-pre-wrap text-slate-100">{projetRes.output.length ? projetRes.output.join('\n') : t.noOutput}</pre>
                {projetRes.error && <pre className="whitespace-pre-wrap text-rose-300">{projetRes.error.split('\n').filter(Boolean).pop()}</pre>}
              </>}
              {correction && <div className="mt-2 rounded-lg border border-sky-500/40 bg-sky-500/10 p-2.5 font-sans text-[13px] text-slate-100"><p className={titreMini + ' mb-1'}>{t.projetCorrection}</p><Md text={correction} className="md-sombre" /></div>}
            </div>
          )}
        </div>
      )}
      {centre === 'base' && (
        <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-4">
          <p className="text-[12px] text-slate-400">{t.baseHelp}</p>
          {base === null ? <p className="text-[13px] text-slate-400" role="status">{t.baseLoading}</p>
            : base.length === 0 ? <p className="text-[13px] text-rose-300" role="alert">{t.baseFail}</p>
            : base.map((tb) => (
              <section key={tb.nom} className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <h3 className="font-mono text-[14px] font-bold text-sky-300">{tb.nom}</h3>
                  <span className="text-[11px] text-slate-400">{t.rows(tb.total)}</span>
                  <button onClick={() => { onCode(`SELECT * FROM ${tb.nom};`); setCentre('code') }}
                    className="ml-auto rounded-md border border-slate-700 px-3 min-h-9 text-[12px] font-semibold text-slate-300 hover:bg-slate-800">{t.tryIt}</button>
                </div>
                <div className="overflow-x-auto rounded-lg border border-slate-800">
                  <table className="w-full text-left text-[12.5px] font-mono">
                    <thead><tr className="bg-slate-900 text-slate-400">{tb.colonnes.map((c) => <th key={c} className="px-2.5 py-1.5 font-semibold whitespace-nowrap">{c}</th>)}</tr></thead>
                    <tbody>{tb.lignes.map((l, i) => (
                      <tr key={i} className="border-t border-slate-800">{l.map((v, j) => <td key={j} className="px-2.5 py-1.5 whitespace-nowrap text-slate-100">{v === null ? <span className="text-slate-500">NULL</span> : String(v)}</td>)}</tr>
                    ))}</tbody>
                  </table>
                </div>
              </section>
            ))}
        </div>
      )}
      {centre === 'prompts' && (
        <div className="flex-1 min-h-0 overflow-y-auto p-3 grid gap-3 xl:grid-cols-2 content-start">
          <p className="xl:col-span-2 text-[12px] text-slate-400">{t.promptHelp}</p>
          <label className="space-y-1.5 min-w-0"><span className={titreMini}>{t.prompt}</span>
            <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={12} maxLength={4000} className={zoneTexte + ' font-mono'} />
            <button onClick={() => void envoyerPrompt()} disabled={!prompt.trim() || promptBusy || !ai || !signedIn}
              className="rounded-md bg-gradient-to-r from-sky-500 to-blue-600 px-4 min-h-10 text-[13px] font-semibold text-white disabled:opacity-40"><Gl>{promptBusy ? '⏳' : '➤ ' + t.send}</Gl></button>
          </label>
          <div className="space-y-1.5 min-w-0"><p className={titreMini}>{t.answer(prof.name)}</p>
            <div className="min-h-48 rounded-lg border border-slate-700 bg-slate-900 p-3 text-[13.5px] text-slate-100" aria-live="polite">
              {promptBusy ? <span className="text-slate-400">{prof.name} {t.thinking}</span> : reponse ? <Md text={reponse} className="md-sombre" /> : null}
            </div>
          </div>
        </div>
      )}
      {centre === 'notes' && (
        <div className="flex-1 min-h-0 flex flex-col p-3 gap-2">
          <p className="text-[12px] text-slate-400">{t.notesHelp}</p>
          <textarea value={notes} onChange={(e) => { setNotes(e.target.value); ecrire('learn:notes:' + lesson.id, e.target.value) }} aria-label={t.notes}
            className={zoneTexte + ' flex-1 min-h-40 leading-6'} />
        </div>
      )}
    </div>
  )

  // ───────── Droite : l'agent du sujet ─────────
  const agentsProposes = [prof, ...prets.filter((a) => a.id !== prof.id && ['finia', 'ia', 'sql', 'js', 'maths', 'sys', 'sci'].includes(a.id))].slice(0, 5)
  const colonneAgent = (
    <div className="h-full flex flex-col min-h-0">
      <div className="shrink-0 border-b border-slate-800 bg-slate-950 p-2">
        <div className={`flex items-center justify-between px-1 ${choixOuvert ? 'mb-1.5' : ''}`}>
          <button onClick={basculerChoix} aria-expanded={choixOuvert} className={'flex items-center gap-1.5 min-h-8 ' + titreMini + ' hover:text-white'}>
            <Ico n={choixOuvert ? 'down' : 'right'} className="size-3.5" />{t.yourAgents}
          </button>
          <button onClick={() => fixerLarg(large ? 380 : 640)} aria-label={large ? t.narrow : t.widen} title={large ? t.narrow : t.widen}
            className="hidden lg:grid size-7 place-items-center rounded text-[14px] text-slate-400 hover:bg-slate-800 hover:text-white"><Ico n={large ? 'minimize' : 'maximize'} className="size-4" /></button>
        </div>
        {choixOuvert && (
          <div className="flex gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="tablist" aria-label={t.yourAgents}>
            {agentsProposes.map((a) => {
              const actif = a.id === prof.id
              return (
                <button key={a.id} role="tab" aria-selected={actif} onClick={() => choisirProf(a.id)}
                  className={`shrink-0 w-[4.4rem] flex flex-col items-center gap-1 p-1.5 rounded-lg border ${actif ? 'bg-slate-800 border-sky-500/80 shadow shadow-sky-500/10' : 'bg-slate-900/40 border-slate-800 hover:bg-slate-800/50'}`}>
                  <span className={actif ? '' : 'opacity-70'}>{avatar(a, 'size-9')}</span>
                  <span className={`text-[11px] font-semibold truncate w-full text-center ${actif ? 'text-white' : 'text-slate-400'}`}>{a.name}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>
      <div className="shrink-0 flex items-center gap-2.5 px-3 py-2 bg-slate-950/60 border-b border-slate-800/80">
        {avatar(prof, 'size-7')}
        <div className="min-w-0 flex-1"><p className="text-[12.5px] font-semibold text-slate-100">{prof.name}</p><p className="text-[11px] text-slate-400 truncate">{prof.role[lang]}</p></div>
      </div>
      <div ref={boite} onScroll={(e) => { const el = e.currentTarget; enBas.current = el.scrollHeight - el.scrollTop - el.clientHeight < 48 }}
        className="flex-1 min-h-0 overflow-y-auto p-3 space-y-4 text-[13.5px] leading-relaxed" aria-live="polite">
        <div className="flex gap-2.5">
          <span className="shrink-0 pt-0.5">{avatar(prof, 'size-7')}</span>
          <div className="min-w-0 max-w-[88%] rounded-xl rounded-tl-none border border-slate-800 bg-slate-950/90 px-3 py-2 text-slate-200">
            <p className="text-[10.5px] font-medium text-sky-300 mb-1">{prof.name}</p>
            {t.hello(prof.name, titre)}{estSql && <span className="block mt-1.5">{t.baseHello}</span>}
          </div>
        </div>
        {fil.map((e, i) => (
          <div key={i} className="space-y-3">
            <div className="flex gap-2.5 flex-row-reverse">
              <span className="shrink-0 size-7 rounded-full bg-slate-700 text-slate-200 grid place-items-center" aria-hidden="true"><Ico n="user" className="size-4" /></span>
              <p className="max-w-[85%] rounded-xl rounded-tr-none bg-sky-600 text-white px-3 py-2 whitespace-pre-wrap break-words">{e.q}</p>
            </div>
            {e.a ? (
              <div className="flex gap-2.5">
                <span className="shrink-0 pt-0.5">{avatar(agents.find((x) => x.id === e.prof) ?? prof, 'size-7')}</span>
                <div className={`min-w-0 max-w-[92%] rounded-xl rounded-tl-none border px-3 py-2 ${e.ok === false ? 'border-rose-500/40 bg-rose-500/10 text-rose-200' : 'border-slate-800 bg-slate-950/90 text-slate-200'}`}>
                  <p className="text-[10.5px] font-medium text-sky-300 mb-1">{(agents.find((x) => x.id === e.prof) ?? prof).name}</p>
                  <Reponse texte={e.a} t={t} onAppliquer={(c) => onCode(c)} onComparer={(c) => setDiff(c)} />
                </div>
              </div>
            ) : <p className="text-[12px] text-sky-300 animate-pulse" role="status">{prof.name} {t.thinking}</p>}
          </div>
        ))}
      </div>
      <div className="shrink-0 px-3 py-1.5 border-t border-slate-800/70 bg-slate-950/40 flex gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {aCode && !estSql && !projet && <button onClick={() => void proposerProjet()} disabled={!!projetBusy || busy} className="shrink-0 text-[11.5px] px-2.5 py-1 rounded-full bg-sky-500/15 hover:bg-sky-500/25 text-sky-200 border border-sky-500/40 disabled:opacity-40">{t.projetPropose}</button>}
        {aCode && !estSql && !projet && enonce && <button onClick={() => { setCentre('projet'); setVue('travail'); void corrigerProjet() }} disabled={!!projetBusy || busy} className="shrink-0 text-[11.5px] px-2.5 py-1 rounded-full bg-sky-500/15 hover:bg-sky-500/25 text-sky-200 border border-sky-500/40 disabled:opacity-40">{t.projetCorrige}</button>}
        {t.chips.map(([label, q]) => (
          <button key={label} onClick={() => void poser(q)} disabled={busy || !ai || !signedIn}
            className="shrink-0 text-[11.5px] px-2.5 py-1 rounded-full bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 disabled:opacity-40">{label}</button>
        ))}
      </div>
      <div className="shrink-0 border-t border-slate-800 bg-slate-950 p-2.5 space-y-2">
        {!ai ? <p className="text-[12px] text-slate-400">{t.aiOff}</p>
          : !signedIn ? <div className="flex items-center gap-2 text-[12px] text-slate-400"><span className="flex-1">{t.needLogin}</span>
            <button className="rounded-md bg-gradient-to-r from-sky-500 to-blue-600 px-3 min-h-9 font-semibold text-white" onClick={() => window.dispatchEvent(new Event('learn:login'))}>{t.login}</button></div>
          : null}
        <form onSubmit={(e) => { e.preventDefault(); void poser() }} className="flex items-end gap-2 rounded-lg border border-slate-800 bg-slate-900 p-1.5 focus-within:border-sky-500">
          <textarea value={question} rows={1} maxLength={2000} placeholder={t.ask} aria-label={t.ask} disabled={!ai || !signedIn}
            onChange={(e) => { setQuestion(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 140) + 'px' }}
            ref={(el) => { if (el) { el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 140) + 'px' } }}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); void poser() } }}
            className="flex-1 min-w-0 resize-none bg-transparent px-2 py-1 text-[16px] lg:text-[13px] leading-snug text-slate-100 outline-none placeholder:text-slate-500 disabled:opacity-50" />
          <button disabled={!question.trim() || busy || !ai || !signedIn} aria-label={t.send}
            className="size-9 shrink-0 grid place-items-center rounded-md bg-sky-500 hover:bg-sky-400 text-white font-bold disabled:opacity-40"><Ico n="send" className="size-4" /></button>
        </form>
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-slate-100" role="region" aria-label={titre}>
      <div className="shrink-0 flex items-center gap-2 px-3 py-2 border-b border-slate-800 bg-slate-950" style={{ paddingTop: 'max(0.5rem, env(safe-area-inset-top))' }}>
        <button onClick={onClose} aria-label={t.close} className="size-9 grid place-items-center rounded-md text-lg text-slate-300 hover:bg-slate-800"><Ico n="x" className="size-5" /></button>
        <span className="hidden sm:inline-flex items-center gap-0.5 text-[12px] text-slate-500">{t.lesson}<Ico n="right" className="size-3.5" /></span>
        <p className="min-w-0 flex-1 font-semibold text-white truncate">{projet ? `${t.pj.titre} ${projet.numero} · ${projet.variante} — ` : ''}{titre}</p>
        <span className="hidden sm:inline rounded-md border border-slate-700 bg-slate-900 px-2.5 py-0.5 text-[12px] text-slate-300">{langage}</span>
      </div>
      <div className="flex-1 min-h-0 lg:grid lg:grid-cols-[300px_minmax(0,1fr)_var(--aw)] 2xl:grid-cols-[340px_minmax(0,1fr)_var(--aw)]" style={{ '--aw': larg + 'px' } as CSSProperties}>
        <div className={`${vue === 'lecon' ? 'block' : 'hidden'} lg:block h-full min-h-0 bg-slate-900 lg:border-r border-slate-800`}>{colonneLecon}</div>
        <div className={`${vue === 'travail' ? 'flex' : 'hidden'} lg:flex h-full min-h-0 flex-col`}>{colonneCentre}</div>
        <div className={`${vue === 'agent' ? 'block' : 'hidden'} lg:block relative h-full min-h-0 bg-slate-900 lg:border-l border-slate-800`}>
          <div role="separator" aria-orientation="vertical" tabIndex={0} aria-label={t.resize} aria-valuenow={larg} aria-valuemin={300} aria-valuemax={bornesLarg()[1]}
            onPointerDown={glisser}
            onKeyDown={(e) => { if (e.key === 'ArrowLeft') { e.preventDefault(); fixerLarg(larg + 32) } else if (e.key === 'ArrowRight') { e.preventDefault(); fixerLarg(larg - 32) } }}
            className="hidden lg:block absolute inset-y-0 -left-1 z-10 w-2 cursor-col-resize touch-none hover:bg-sky-500/40 focus-visible:bg-sky-500/60 outline-none" />
          {colonneAgent}
        </div>
      </div>
      <nav className="lg:hidden shrink-0 grid grid-cols-3 border-t border-slate-800 bg-slate-950" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }} role="tablist" aria-label={titre}>
        {(['lecon', 'travail', 'agent'] as const).map((k) => (
          <button key={k} role="tab" aria-selected={vue === k} onClick={() => setVue(k)}
            className={`min-h-12 flex flex-col items-center justify-center gap-0.5 text-[11px] font-semibold ${vue === k ? 'text-sky-300' : 'text-slate-400'}`}>
            <Ico n={k === 'lecon' ? 'book' : k === 'travail' ? (aCode ? 'code' : 'pencil') : 'chat'} className="size-5" />{t.tabs[k]}
          </button>
        ))}
      </nav>
      {diff !== null && <DiffModal lang={lang} original={code} fix={{ explanation: '', fixed_code: diff }} onAccept={() => { onCode(diff); setDiff(null) }} onClose={() => setDiff(null)} />}
    </div>
  )
}

/** Réponse de l'agent : le texte en Markdown, et chaque bloc de code avec ses actions (copier, comparer avec mon code, appliquer). */
function Reponse({ texte, t, onAppliquer, onComparer }: { texte: string; t: { copy: string; copied: string; apply: string; compare: string }; onAppliquer: (c: string) => void; onComparer: (c: string) => void }) {
  const [copie, setCopie] = useState(-1)
  const parts: { code: boolean; texte: string; lang: string }[] = []
  const re = /```([\w+-]*)\n([\s\S]*?)```/g
  let dernier = 0, m: RegExpExecArray | null
  while ((m = re.exec(texte))) {
    if (m.index > dernier) parts.push({ code: false, texte: texte.slice(dernier, m.index), lang: '' })
    parts.push({ code: true, texte: m[2].replace(/\n$/, ''), lang: m[1] })
    dernier = m.index + m[0].length
  }
  if (dernier < texte.length) parts.push({ code: false, texte: texte.slice(dernier), lang: '' })
  return (
    <div className="space-y-2">
      {parts.map((p, i) => p.code ? (
        <div key={i} className="rounded-lg border border-slate-800 bg-slate-900 overflow-hidden">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-950 border-b border-slate-800 text-[10.5px] text-slate-400">
            <span className="font-mono text-sky-400 uppercase">{p.lang || 'code'}</span>
            <span className="flex-1" />
            <button onClick={() => { void navigator.clipboard?.writeText(p.texte).then(() => setCopie(i)).catch(() => {}) }} className="px-1.5 py-0.5 rounded hover:bg-slate-800 hover:text-white inline-flex items-center gap-1"><Gl>{copie === i ? '✓ ' + t.copied : t.copy}</Gl></button>
            <button onClick={() => onComparer(p.texte)} className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white">{t.compare}</button>
            <button onClick={() => onAppliquer(p.texte)} className="px-2 py-0.5 rounded bg-sky-500 hover:bg-sky-400 text-white font-medium">{t.apply}</button>
          </div>
          <pre className="p-2.5 text-[12px] font-mono text-slate-100 overflow-x-auto leading-5">{p.texte}</pre>
        </div>
      ) : <Md key={i} text={p.texte} className="md-sombre" />)}
    </div>
  )
}
