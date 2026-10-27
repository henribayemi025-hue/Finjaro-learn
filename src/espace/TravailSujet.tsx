import { lazy, Suspense, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { agents } from '../agents'
import { askTutor } from '../tutor'
import { profDe } from '../Classe'
import { Md } from '../Md'
import DiffModal from '../DiffModal'
import { Gl, Ico } from '../Icones'
import type { Lesson } from '../lessons'
import { chargerPaquets, definirFichiers, lireBase, paquetsCharges, pipInstaller, redemarrerTerminal, runPython, type RunResult, type TableVue } from '../runner'
import { contexteSql, tablesDe } from '../sqlBase'
import { expliqueErreur } from '../explainError'
import { contexteCours } from '../contexteCours'
import { controlerPython, constatsEnTexte } from '../lint'
import type { Lang } from '../i18n'
import type { Diag } from '../atelier/Editeur'
import { lireFichiers, ecrireFichiers, estNotebook, gabarit, nomLibre, lireInstantanes, ajouterInstantane, type Fichier, type Instantane } from './ide/fichiers'
import Explorateur, { lireFichierImporte, iconeFichier } from './ide/Explorateur'
import Recherche from './ide/Recherche'
import PaquetsVue from './ide/Paquets'
import Terminal, { type LigneTerm } from './ide/Terminal'
import Palette, { type Commande } from './ide/Palette'
import { BarreActivite, BarreEtat, type VueLaterale } from './ide/Barres'
import { TX } from './ide/textes'
import { CATALOGUE, nomPyodide } from './ide/paquets'

const Editeur = lazy(() => import('../atelier/Editeur'))
const Notebook = lazy(() => import('./ide/Notebook'))

// TRAVAILLER UN SUJET AVEC LES AGENTS IA, dans le même cadre que l'Atelier de code (Beau, 14/10 : « quand je choisis de faire avec
// les agents IA, ça ouvre une page comme l'atelier de code ; si c'est neurosciences, c'est ça »). Plein écran sombre :
// à gauche la leçon · au milieu ce que demande le sujet (code et console, bac à prompts, notes) · à droite l'agent du sujet,
// discussion de hauteur fixe, saisie toujours en bas. Au téléphone : une vue à la fois, onglets en bas.
// La discussion est la même que celle de la classe (même clé locale) : on la retrouve en revenant à la leçon.

type Centre = 'code' | 'prompts' | 'notes' | 'base' | 'fichier'
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
    projetQ: 'Propose-moi une étude de cas, comme dans une vraie entreprise (par exemple le genre de problème qu’on traite chez Google, BlackRock, Airbnb ou une banque : une situation réaliste, sans chiffres inventés présentés comme vrais). Elle doit regrouper TOUT ce que j’ai déjà réussi depuis le début du cours (la liste est dans le contexte), à ma portée, avec plusieurs fonctions qui travaillent ensemble. Donne : un titre, la situation en 2 phrases (qui est le client, quel est son problème), la mission en 3 à 6 lignes avec les noms exacts des fonctions à écrire, deux exemples entrée → sortie à tester, la liste des leçons du cours que ça utilise, et 3 étapes pour avancer. Ne donne jamais la solution. Termine en me disant de coder dans l’onglet Projet puis d’appuyer sur « Corriger mon projet ».',
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
    projetQ: 'Suggest a case study, like in a real company (for example the kind of problem handled at Google, BlackRock, Airbnb or a bank: a realistic situation, with no invented figures presented as true). It must pull together EVERYTHING I have already passed since the start of the course (the list is in the context), within my reach, with several functions working together. Give: a title, the situation in 2 sentences (who the client is, what their problem is), the mission in 3 to 6 lines with the exact names of the functions to write, two input → output examples to test, the list of course lessons it uses, and 3 steps to move forward. Never give the solution. End by telling me to code in the Project tab then press “Check my project”.',
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
  const [cle, setCle] = useState<string>(aCode ? 'code' : 'notes')
  const [ouverts, setOuverts] = useState<string[]>([aCode ? 'code' : 'notes'])
  const centre: Centre = cle.startsWith('f:') ? 'fichier' : (cle as Centre)
  const setCentre = (c: Centre) => { setOuverts((o) => (o.includes(c) ? o : [...o, c])); setCle(c) }
  const [vue, setVue] = useState<Vue>('travail')
  const [voirIndice, setVoirIndice] = useState(false)
  const prets = agents.filter((a) => a.ready)
  const [profId, setProfId] = useState(() => lire('learn:prof:' + track) || profDe(track, lesson.lang ?? 'js'))
  const prof = prets.find((a) => a.id === profId) ?? prets[0]
  const choisirProf = (id: string) => { setProfId(id); ecrire('learn:prof:' + track, id) }
  const [diff, setDiff] = useState<string | null>(null)
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

  useEffect(() => {
    const avant = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    // Échap ne ferme plus l'espace (comme dans VS Code : il sert à fermer une suggestion, la recherche, la palette).
    return () => { document.body.style.overflow = avant }
  }, [])

  useEffect(() => { const el = boite.current; if (el && enBas.current) el.scrollTop = el.scrollHeight }, [fil, busy, vue])

  const poser = async (texte?: string) => {
    const q = (texte ?? question).trim()
    if (!q || busy || !ai || !signedIn) return
    enBas.current = true; setBusy(true); setQuestion('')
    setFil((f) => [...f, { q, a: '', prof: prof.id }])
    const history = fil.filter((e) => e.prof === prof.id && e.ok !== false && e.a).slice(-3).flatMap((e) => [{ role: 'user' as const, text: e.q }, { role: 'model' as const, text: e.a }])
    const r = await askTutor({ question: q + (res?.passed ? (lang === 'fr' ? '\n\nFAIT CERTAIN (vérifié par un programme) : tous les tests passent' + (res.tests ? ' (' + res.tests.ok + ' sur ' + res.tests.total + ')' : '') + ', le code est CORRECT. Ne cherche pas d’erreur et n’en invente pas : dis-lui que c’est réussi, et propose au plus une amélioration de style.' : '\n\nCERTAIN FACT (checked by a program): all tests pass' + (res.tests ? ' (' + res.tests.ok + ' of ' + res.tests.total + ')' : '') + ', the code is CORRECT. Do not look for or invent an error: tell them it is done, and suggest at most one style improvement.') : ''), code: aCode ? code : notes, lesson: contexteCours(lesson, lang, (() => { try { return JSON.parse(localStorage.getItem('learn:done') ?? '[]') as string[] } catch { return [] } })(), (estSql ? contexteSql(titre, setupSql, lang) : '') + '\n' + (lang === 'fr' ? 'Où il en est : ' : 'Where he is: ') + (!res ? (lang === 'fr' ? 'il n’a pas encore lancé son code' : 'he has not run his code yet') : res.passed ? (lang === 'fr' ? 'exercice réussi' : 'exercise passed') : res.error ? (lang === 'fr' ? 'son code a une erreur : ' : 'his code has an error: ') + res.error.slice(0, 200) : (lang === 'fr' ? 'il a lancé son code, le résultat n’est pas bon' : 'he ran his code, the result is wrong'))), output: res?.output.join('\n') ?? '', lang, agentId: prof.id, history })
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
  // ───────── Éditeur professionnel : fichiers, onglets, panneaux, terminal, historique, palette ─────────
  const X = TX[lang]
  const [fichiers, setFichiers] = useState<Fichier[]>(() => lireFichiers(lesson.id))
  useEffect(() => {
    ecrireFichiers(lesson.id, fichiers)
    definirFichiers(Object.fromEntries(fichiers.filter((f) => !estNotebook(f.nom)).map((f) => [f.nom, f.contenu])))
  }, [fichiers, lesson.id])
  useEffect(() => () => definirFichiers({}), [])
  const nomsPris = [nomFichier, ...fichiers.map((f) => f.nom)]
  const [vueLat, setVueLat] = useState<VueLaterale>(() => (lire('learn:ide:vue') as VueLaterale) || 'lecon')
  const [latOuverte, setLatOuverte] = useState(() => lire('learn:ide:lat') !== '0')
  const [agentOuvert, setAgentOuvert] = useState(() => lire('learn:ide:agent') !== '0')
  const [panneau, setPanneau] = useState<'sortie' | 'problemes' | 'tests' | 'terminal' | 'graphiques'>('sortie')
  const [panneauOuvert, setPanneauOuvert] = useState(true)
  const [hautPanneau, setHautPanneau] = useState(() => { const v = Number(lire('learn:ide:haut')); return v >= 120 ? v : 260 })
  const [largLat, setLargLat] = useState(() => { const v = Number(lire('learn:ide:larg')); return v >= 200 ? v : 280 })
  const [taille, setTaille] = useState(() => { const v = Number(lire('learn:ide:taille')); return v >= 10 && v <= 22 ? v : 13 })
  const [palette, setPalette] = useState(false)
  const [reglages, setReglages] = useState(false)
  const [curseur, setCurseur] = useState({ l: 1, c: 1 })
  const [selection, setSelection] = useState('')
  const [reveler, setReveler] = useState<{ ligne: number; cle: number } | undefined>(undefined)
  const [termLignes, setTermLignes] = useState<LigneTerm[]>([])
  const [charges, setCharges] = useState<string[]>([])
  const [instantanes, setInstantanes] = useState<Instantane[]>(() => lireInstantanes(lesson.id))
  const [sortieFichier, setSortieFichier] = useState<{ nom: string; res: RunResult } | null>(null)
  const [occupeFichier, setOccupeFichier] = useState(false)
  const [joints, setJoints] = useState<string[]>([])
  const [menuJoindre, setMenuJoindre] = useState(false)
  const [menuSessions, setMenuSessions] = useState(false)
  const [rechSession, setRechSession] = useState('')
  const [notif, setNotif] = useState('')

  const fichierActif = cle.startsWith('f:') ? cle.slice(2) : null
  const contenuActif = fichierActif ? (fichiers.find((f) => f.nom === fichierActif)?.contenu ?? '') : centre === 'code' ? code : ''
  const nomActif = fichierActif ?? (centre === 'code' ? nomFichier : centre)
  const modifierFichier = (nom: string, contenu: string) => setFichiers((l) => l.map((f) => (f.nom === nom ? { ...f, contenu } : f)))
  const ouvrir = (k: string) => { setOuverts((o) => (o.includes(k) ? o : [...o, k])); setCle(k) }
  const ouvrirFichier = (nom: string) => { if (nom === nomFichier) ouvrir('code'); else if (['base', 'prompts', 'notes'].includes(nom)) ouvrir(nom); else ouvrir('f:' + nom) }
  const fermerOnglet = (k: string) => {
    setOuverts((o) => { const n = o.filter((x) => x !== k); if (cle === k) setCle(n[n.length - 1] ?? (aCode ? 'code' : 'notes')); return n.length ? n : [aCode ? 'code' : 'notes'] })
  }
  const creerFichier = (nom: string, contenu?: string) => { setFichiers((l) => [...l, { nom, contenu: contenu ?? gabarit(nom) }]); ouvrir('f:' + nom) }
  const supprimerFichier = (nom: string) => { setFichiers((l) => l.filter((f) => f.nom !== nom)); fermerOnglet('f:' + nom) }
  const renommerFichier = (a: string, n: string) => { setFichiers((l) => l.map((f) => (f.nom === a ? { ...f, nom: n } : f))); setOuverts((o) => o.map((k) => (k === 'f:' + a ? 'f:' + n : k))); if (cle === 'f:' + a) setCle('f:' + n) }
  const importer = (liste: FileList) => {
    let avis = ''
    void (async () => {
      let pris = [...nomsPris]
      for (const f of Array.from(liste)) {
        const r = await lireFichierImporte(f, pris)
        if ('erreur' in r) { setNotif(r.erreur === 'trop' ? (lang === 'fr' ? 'Fichier trop gros (1 Mo au plus)' : 'File too large (1 MB max)') : (lang === 'fr' ? 'Seuls les fichiers texte sont acceptés' : 'Only text files are accepted')); continue }
        pris = [...pris, r.nom]; setFichiers((l) => [...l, { nom: r.nom, contenu: r.contenu }]); ouvrir('f:' + r.nom)
      }
    })()
    return avis
  }
  const basculerLat = (v?: VueLaterale) => {
    if (v && (!latOuverte || vueLat !== v)) { setVueLat(v); ecrire('learn:ide:vue', v); setLatOuverte(true); ecrire('learn:ide:lat', '1'); return }
    setLatOuverte((o) => { ecrire('learn:ide:lat', o ? '0' : '1'); return !o })
  }
  const basculerAgent = () => setAgentOuvert((o) => { ecrire('learn:ide:agent', o ? '0' : '1'); return !o })
  const afficherPanneau = (p: typeof panneau) => { setPanneau(p); setPanneauOuvert(true) }
  const changerTaille = (d: number) => setTaille((t0) => { const v = Math.min(22, Math.max(10, t0 + d)); ecrire('learn:ide:taille', String(v)); return v })
  const actualiserCharges = () => { void paquetsCharges().then(setCharges) }
  useEffect(() => { actualiserCharges() }, [res, termLignes.length])

  // Diagnostics : les erreurs sûres, trouvées par un programme (noms jamais définis, variables inutiles, ligne de l'erreur d'exécution).
  const constats = useMemo(() => (lesson.lang === 'py' && centre === 'code' ? controlerPython(code) : null), [code, lesson.lang, centre])
  const diags: Diag[] = useMemo(() => {
    const l: Diag[] = []
    constats?.indefinis.forEach((x) => l.push({ ligne: x.ligne, niveau: 'error', message: `« ${x.nom} » ${X.indefini}` }))
    constats?.inutilises.forEach((x) => l.push({ ligne: x.ligne, niveau: 'warning', message: `« ${x.nom} » ${X.inutilise}` }))
    if (res?.error && centre === 'code') {
      const m = [...res.error.matchAll(/File "<(?:exec|eleve)>", line (\d+)/g)].pop()
      const derniere = res.error.split('\n').filter(Boolean).pop() ?? ''
      if (m && !l.some((d) => d.ligne === Number(m[1]) && d.niveau === 'error')) l.push({ ligne: Number(m[1]), niveau: 'error', message: derniere.slice(0, 200) })
    }
    return l.sort((a, b) => a.ligne - b.ligne)
  }, [constats, res, centre, X])
  const nbErreurs = diags.filter((d) => d.niveau === 'error').length
  const nbAvert = diags.filter((d) => d.niveau === 'warning').length
  const allerLigne = (nom: string, ligne: number) => { ouvrirFichier(nom); setReveler({ ligne, cle: Date.now() }) }

  // Plan du fichier : fonctions et classes.
  const plan = useMemo(() => {
    const out: { nom: string; ligne: number; type: 'def' | 'class' }[] = []
    contenuActif.split('\n').forEach((l, i) => { const m = /^\s*(def|class)\s+([A-Za-z_][A-Za-z0-9_]*)/.exec(l); if (m) out.push({ nom: m[2], ligne: i + 1, type: m[1] as 'def' | 'class' }) })
    return out
  }, [contenuActif])

  // Historique local : un instantané à chaque réussite, ou à la demande.
  const instantane = (etiquette: string) => { setInstantanes(ajouterInstantane(lesson.id, code, etiquette)); setNotif(X.fichierOk) }
  useEffect(() => { if (res?.passed === true) setInstantanes(ajouterInstantane(lesson.id, code, 'tests')) }, [res]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (!notif) return; const id = setTimeout(() => setNotif(''), 2200); return () => clearTimeout(id) }, [notif])

  // Exécuter un autre fichier Python du projet (script libre : pas de tests).
  const lancerFichier = async () => {
    if (!fichierActif || occupeFichier || !/\.py$/i.test(fichierActif)) return
    setOccupeFichier(true)
    const r = await runPython(contenuActif, [], lesson.packages ?? [])
    setSortieFichier({ nom: fichierActif, res: r }); setOccupeFichier(false); afficherPanneau('sortie')
  }
  const executer = () => { if (fichierActif && /\.py$/i.test(fichierActif)) void lancerFichier(); else { afficherPanneau('sortie'); void onRun() } }

  // Sessions de conversation (comme le chat de VS Code) : plusieurs fils par projet, gardés sur l'appareil.
  type Session = { id: string; nom: string; fil: Echange[] }
  const cleSessions = 'learn:sess:' + lesson.id
  const [sessions, setSessions] = useState<Session[]>(() => {
    try { const v = JSON.parse(lire(cleSessions) || '[]'); if (Array.isArray(v) && v.length) return v as Session[] } catch { /* ignoré */ }
    return [{ id: 's1', nom: '', fil: lireFil(cleFil) }]
  })
  const [sessionId, setSessionId] = useState(() => lire(cleSessions + ':actif') || 's1')
  const session = sessions.find((s) => s.id === sessionId) ?? sessions[0]
  useEffect(() => {
    setSessions((l) => l.map((s) => (s.id === session.id ? { ...s, fil, nom: s.nom || (fil[0]?.q ?? '').slice(0, 40) } : s)))
  }, [fil]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { ecrire(cleSessions, JSON.stringify(sessions.map((s) => ({ ...s, fil: s.fil.filter((e) => e.ok !== false).slice(-20) })))); ecrire(cleSessions + ':actif', session.id) }, [sessions, session.id]) // eslint-disable-line react-hooks/exhaustive-deps
  const nouvelleSession = () => { const id = 's' + Date.now().toString(36); setSessions((l) => [{ id, nom: '', fil: [] }, ...l]); setSessionId(id); setFil([]); setMenuSessions(false) }
  const ouvrirSession = (id: string) => { const s = sessions.find((x) => x.id === id); if (!s) return; setSessionId(id); setFil(s.fil); setMenuSessions(false) }
  const supprimerSession = (id: string) => {
    const reste = sessions.filter((s) => s.id !== id)
    if (!reste.length) { setSessions([{ id: 's' + Date.now().toString(36), nom: '', fil: [] }]); setFil([]); return }
    setSessions(reste); if (id === session.id) { setSessionId(reste[0].id); setFil(reste[0].fil) }
  }

  // Contexte joint à la question (fichier ouvert, sélection, sortie, problèmes, terminal).
  const contexteJoint = () => {
    const parties: string[] = []
    if (joints.includes('selection') && selection) parties.push('[' + X.jSelection + ']\n' + selection.slice(0, 1500))
    if (joints.includes('fichier') && fichierActif) parties.push('[' + fichierActif + ']\n' + contenuActif.slice(0, 2500))
    if (joints.includes('problemes') && diags.length) parties.push('[' + X.jProblemes + ']\n' + diags.slice(0, 12).map((d) => `${X.ligne} ${d.ligne}: ${d.message}`).join('\n'))
    if (joints.includes('terminal') && termLignes.length) parties.push('[' + X.jTerminal + ']\n' + termLignes.slice(-12).map((l) => (l.k === 'img' ? '' : l.t)).join('\n').slice(0, 1200))
    return parties.length ? '\n\n' + parties.join('\n\n') : ''
  }
  const poserAvecContexte = (texte?: string) => {
    const base = (texte ?? question).trim()
    if (!base) return
    void poser(base + contexteJoint())
    setJoints([])
  }

  // Raccourcis clavier (comme VS Code).
  useEffect(() => {
    const kd = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey
      if (mod && (e.key.toLowerCase() === 'k' || (e.shiftKey && e.key.toLowerCase() === 'p'))) { e.preventDefault(); setPalette((p) => !p) }
      else if (mod && e.key.toLowerCase() === 'b') { e.preventDefault(); basculerLat() }
      else if (mod && e.key.toLowerCase() === 'j') { e.preventDefault(); setPanneauOuvert((o) => !o) }
      else if (mod && e.key === '`') { e.preventDefault(); afficherPanneau('terminal'); setTimeout(() => document.getElementById('ide-term-input')?.focus(), 50) }
      else if (mod && e.shiftKey && e.key.toLowerCase() === 'f') { e.preventDefault(); basculerLat('recherche') }
      else if (mod && e.shiftKey && e.key.toLowerCase() === 'e') { e.preventDefault(); basculerLat('fichiers') }
      else if (mod && e.key.toLowerCase() === 's') { e.preventDefault(); instantane('manuel') }
    }
    window.addEventListener('keydown', kd)
    return () => window.removeEventListener('keydown', kd)
  })

  const glisserV = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault()
    const y0 = e.clientY, h0 = hautPanneau, el = e.currentTarget
    el.setPointerCapture(e.pointerId)
    const mv = (ev: PointerEvent) => { const v = Math.round(Math.min(window.innerHeight * 0.75, Math.max(120, h0 + (y0 - ev.clientY)))); setHautPanneau(v); ecrire('learn:ide:haut', String(v)) }
    const fin = () => { el.removeEventListener('pointermove', mv); el.removeEventListener('pointerup', fin); el.removeEventListener('pointercancel', fin) }
    el.addEventListener('pointermove', mv); el.addEventListener('pointerup', fin); el.addEventListener('pointercancel', fin)
  }
  const glisserLat = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault()
    const x0 = e.clientX, w0 = largLat, el = e.currentTarget
    el.setPointerCapture(e.pointerId)
    const mv = (ev: PointerEvent) => { const v = Math.round(Math.min(560, Math.max(200, w0 + (ev.clientX - x0)))); setLargLat(v); ecrire('learn:ide:larg', String(v)) }
    const fin = () => { el.removeEventListener('pointermove', mv); el.removeEventListener('pointerup', fin); el.removeEventListener('pointercancel', fin) }
    el.addEventListener('pointermove', mv); el.addEventListener('pointerup', fin); el.addEventListener('pointercancel', fin)
  }

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



  // ───────── Centre : onglets de fichiers, éditeur, panneau du bas ─────────
  const etiquetteOnglet = (k: string) => (k === 'code' ? nomFichier : k === 'base' ? t.base : k === 'prompts' ? t.prompts : k === 'notes' ? 'notes.md' : k.slice(2))
  const iconeOnglet = (k: string) => (k === 'code' ? iconeFichier(nomFichier) : k === 'base' ? { n: 'db' as const, c: 'text-[#d19a66]' } : k === 'prompts' ? { n: 'sparkles' as const, c: 'text-[#c586c0]' } : k === 'notes' ? { n: 'book' as const, c: 'text-[#3794ff]' } : iconeFichier(k.slice(2)))
  const estCodeActif = centre === 'code' || (centre === 'fichier' && !estNotebook(fichierActif ?? ''))
  const afficherBas = (centre === 'code' || centre === 'fichier' || centre === 'base') && panneauOuvert
  const resAffiche = fichierActif && /\.py$/i.test(fichierActif) ? (sortieFichier?.nom === fichierActif ? sortieFichier.res : null) : res
  const images = resAffiche?.images ?? []
  const enCours = running || occupeFichier
  const brique = 'h-7 px-2.5 rounded flex items-center gap-1.5 text-[12.5px] font-medium whitespace-nowrap disabled:opacity-50'

  const sortieJSX = (
    <div className="h-full overflow-y-auto px-3 py-2 font-mono text-[12.5px] leading-relaxed" aria-live="polite">
      {projet?.valide && centre === 'code' && (
        <div className="mb-2 rounded-md border border-[#2ea04366] bg-[#2ea04318] p-2.5 font-sans text-[13px] text-emerald-100">
          <p className="font-semibold">{t.pj.ok}</p>
          <button onClick={projet.onSuite} className="mt-2 rounded bg-[var(--ac)] hover:bg-[#1a8ae6] px-3 min-h-8 text-[12.5px] font-semibold text-white">{t.pj.suite}</button>
        </div>
      )}
      {!resAffiche ? <p className="text-[var(--tx3)] font-sans">{X.pasLance}</p> : <>
        {fichierActif && sortieFichier && <p className="mb-1 font-sans text-[11px] text-[var(--tx3)]">{X.fichierLibre} : {sortieFichier.nom}</p>}
        <pre className="whitespace-pre-wrap text-[var(--tx)]">{resAffiche.output.length ? resAffiche.output.join('\n') : X.sansSortie}</pre>
        {images.map((src, i) => <img key={i} src={src} alt={'Plot ' + (i + 1)} className="mt-2 max-w-full max-h-[380px] rounded border border-[var(--bd)] bg-white" />)}
        {resAffiche.error && (() => {
          const lignes = resAffiche.error.split('\n').filter(Boolean)
          return (<>
            <pre className="mt-1 whitespace-pre-wrap text-[var(--er)]">{lignes[lignes.length - 1]}</pre>
            {lignes.length > 1 && <details className="mt-1 text-[var(--tx3)]"><summary className="cursor-pointer text-[11.5px] font-sans">{t.detail}</summary><pre className="mt-1 whitespace-pre-wrap text-[11.5px]">{resAffiche.error}</pre></details>}
          </>)
        })()}
        {centre === 'code' && explication && (
          <div className="mt-2 rounded-md border border-[#3794ff55] bg-[#3794ff14] p-2.5 font-sans text-[13px] text-slate-100">
            <p>{explication}</p>
            {ai && signedIn && <button onClick={demanderErreur} disabled={busy} className="mt-2 rounded border border-[var(--bd)] bg-[var(--b2)] hover:bg-[var(--b3)] px-3 min-h-8 text-[12px] font-medium text-[var(--ac2)] disabled:opacity-50">{t.askErr(prof.name).replace('✨ ', '')}</button>}
          </div>
        )}
        {centre === 'code' && res?.tests && res.tests.total > 0 && <p className={`mt-1 font-sans font-semibold ${res.tests.ok === res.tests.total ? 'text-[var(--ok)]' : 'text-[var(--wa)]'}`}>Tests : {res.tests.ok} / {res.tests.total}</p>}
        {centre === 'code' && res?.passed === true && <p className="mt-1 font-sans font-semibold text-[var(--ok)]">{t.ok}</p>}
        {centre === 'code' && projet && !projet.valide && projet.essai > 0 && <p className="mt-2 font-sans text-[13px] text-[var(--wa)]">{t.pj.echec(projet.essai, projet.max)}</p>}
        {centre === 'code' && projet && !projet.valide && projet.essai >= projet.max && projet.onAutre && (
          <div className="mt-2 rounded-md border border-[#cca70066] bg-[#cca70014] p-2.5 font-sans text-[13px] text-slate-100">
            <p>{t.pj.autreTexte}</p>
            <button onClick={projet.onAutre} className="mt-2 rounded bg-[var(--ac)] hover:bg-[#1a8ae6] px-3 min-h-8 text-[12.5px] font-semibold text-white">{t.pj.autre}</button>
          </div>
        )}
        {centre === 'code' && res?.passed === false && !res.error && <p className="mt-1 font-sans text-[var(--wa)]">{t.ko}</p>}
      </>}
    </div>
  )
  const problemesJSX = (
    <div className="h-full overflow-y-auto py-1 text-[12.5px]">
      {diags.length === 0 ? <p className="px-3 py-3 text-[var(--tx3)]">{X.aucunProbleme}</p> : diags.map((d, i) => (
        <button key={i} onClick={() => allerLigne(nomFichier, d.ligne)} className="w-full flex items-center gap-2 px-3 h-7 text-left hover:bg-[#2a2d2e]">
          <Ico n={d.niveau === 'error' ? 'x' : 'warn'} className={`size-3.5 ${d.niveau === 'error' ? 'text-[var(--er)]' : 'text-[var(--wa)]'}`} />
          <span className="truncate text-[var(--tx)]">{d.message}</span><span className="ml-auto shrink-0 text-[var(--tx3)]">{nomFichier} · {X.ligne} {d.ligne}</span>
        </button>
      ))}
    </div>
  )
  const testsJSX = (
    <div className="h-full overflow-y-auto py-2 px-3 text-[12.5px]">
      {!res?.tests ? <p className="text-[var(--tx3)]">{X.testsVide}</p> : <>
        <p className={`mb-2 font-semibold ${res.tests.ok === res.tests.total ? 'text-[var(--ok)]' : 'text-[var(--wa)]'}`}>{X.testsEntete(res.tests.ok, res.tests.total)}</p>
        <ul className="space-y-1">
          {lesson.checks.map((c, i) => {
            const ok = res.tests?.detail?.[i]
            return (
              <li key={i} className="flex items-start gap-2 font-mono">
                <Ico n={ok === undefined ? 'info' : ok ? 'ok' : 'x'} className={`size-3.5 mt-0.5 ${ok === undefined ? 'text-[var(--tx3)]' : ok ? 'text-[var(--ok)]' : 'text-[var(--er)]'}`} />
                <span className="min-w-0 break-words text-[var(--tx)]" title={c}>{c.length > 160 ? c.slice(0, 160) + '…' : c}</span>
              </li>
            )
          })}
        </ul>
      </>}
    </div>
  )
  const graphiquesJSX = (
    <div className="h-full overflow-y-auto p-3 flex flex-wrap gap-3 content-start">
      {images.length === 0 ? <p className="text-[12.5px] text-[var(--tx3)]">{lang === 'fr' ? 'Les graphiques matplotlib apparaissent ici (plt.plot, plt.show).' : 'matplotlib charts appear here (plt.plot, plt.show).'}</p>
        : images.map((src, i) => <img key={i} src={src} alt={'Plot ' + (i + 1)} className="max-h-full max-w-full rounded border border-[var(--bd)] bg-white" />)}
    </div>
  )
  const panneauJSX = afficherBas && (
    <div style={{ height: hautPanneau }} className="shrink-0 flex flex-col min-h-0 border-t border-[var(--bd)] bg-[var(--b1)] relative">
      <div role="separator" aria-orientation="horizontal" aria-label={X.agrandir} onPointerDown={glisserV} className="absolute -top-1 inset-x-0 h-2 cursor-row-resize touch-none z-10 hover:bg-[var(--ac)]/40" />
      <div className="shrink-0 flex items-center h-9 px-2 gap-1 border-b border-[var(--bd)] bg-[var(--b1)]" role="tablist">
        {([['sortie', X.sortie, null], ['problemes', X.problemes, diags.length || null], ['tests', X.tests, res?.tests ? `${res.tests.ok}/${res.tests.total}` : null], ['terminal', X.terminal, null], ...(images.length ? [['graphiques', X.graphiques, images.length]] : [])] as [typeof panneau, string, string | number | null][]).map(([k, nom, n]) => (
          <button key={k} role="tab" aria-selected={panneau === k} onClick={() => setPanneau(k)} className={`h-full px-2.5 flex items-center gap-1.5 text-[11.5px] uppercase tracking-wide border-b ${panneau === k ? 'border-[var(--ac2)] text-white' : 'border-transparent text-[var(--tx2)] hover:text-white'}`}>
            {nom}{n !== null && <span className={`rounded-full px-1.5 text-[10px] ${k === 'problemes' && nbErreurs ? 'bg-[var(--er)] text-white' : 'bg-[#4d4d4d] text-white'}`}>{n}</span>}
          </button>
        ))}
        <span className="flex-1" />
        <button onClick={sauveMoi} disabled={busy} className="h-6 px-2 rounded flex items-center gap-1.5 text-[11.5px] text-[var(--tx)] hover:bg-[#ffffff14] disabled:opacity-50">{avatar(prof, 'size-4')}<span className="hidden sm:inline whitespace-nowrap">{X.sauve}</span></button>
        <button onClick={() => setPanneauOuvert(false)} title={X.fermerPanneau} aria-label={X.fermerPanneau} className="size-6 grid place-items-center rounded hover:bg-[#ffffff14] text-[var(--tx2)]"><Ico n="x" className="size-3.5" /></button>
      </div>
      <div className="flex-1 min-h-0">
        {panneau === 'sortie' && sortieJSX}
        {panneau === 'problemes' && problemesJSX}
        {panneau === 'tests' && testsJSX}
        {panneau === 'terminal' && <Terminal lang={lang} lignes={termLignes} setLignes={setTermLignes} fichiers={nomsPris} onAgent={(e) => { setVue('agent'); void poser(t.errQ(e.split('\n').filter(Boolean).pop()?.slice(0, 300) ?? e)) }} />}
        {panneau === 'graphiques' && graphiquesJSX}
      </div>
    </div>
  )

  const colonneCentre = (
    <div className="h-full flex flex-col min-h-0 bg-[var(--b1)]">
      <div className="shrink-0 flex items-stretch h-9 bg-[var(--b0)] border-b border-[var(--bd)]">
        <div className="flex items-stretch min-w-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="tablist" aria-label={titre}>
          {ouverts.map((k) => {
            const actif = cle === k, ic = iconeOnglet(k)
            return (
              <div key={k} className={`group relative shrink-0 flex items-center h-full border-r border-[var(--bd)] ${actif ? 'bg-[var(--b1)] text-white' : 'text-[var(--tx2)] hover:bg-[#ffffff08]'}`}>
                {actif && <span className="absolute top-0 inset-x-0 h-px bg-[var(--ac2)]" />}
                <button role="tab" aria-selected={actif} onClick={() => setCle(k)} className="h-full pl-3 pr-1.5 flex items-center gap-1.5 text-[13px]">
                  <Ico n={ic.n} className={`size-3.5 ${ic.c}`} /><span className="max-w-[160px] truncate">{etiquetteOnglet(k)}</span>
                </button>
                {(k !== 'code' || ouverts.length > 1) && <button onClick={() => fermerOnglet(k)} aria-label={lang === 'fr' ? 'Fermer ' + etiquetteOnglet(k) : 'Close ' + etiquetteOnglet(k)} className={`mr-1.5 size-5 grid place-items-center rounded hover:bg-[#ffffff1f] ${actif ? '' : 'opacity-0 group-hover:opacity-100'}`}><Ico n="x" className="size-3" /></button>}
              </div>
            )
          })}
          <button onClick={() => { const nom = nomLibre(lesson.lang === 'py' ? 'script.py' : 'notes-2.md', nomsPris); creerFichier(nom) }} title={X.nouveauFichier} aria-label={X.nouveauFichier} className="shrink-0 size-9 grid place-items-center text-[var(--tx2)] hover:text-white hover:bg-[#ffffff14]"><Ico n="plus" className="size-4" /></button>
        </div>
        <span className="flex-1" />
        {estCodeActif && (
          <div className="flex items-center gap-1 pr-2 shrink-0">
            <button onClick={() => void parcourir()} disabled={revue?.etat === 'cours'} className={brique + ' text-[var(--tx)] hover:bg-[#ffffff14]'} title={X.cmdScan}><Ico n={revue?.etat === 'cours' ? 'spin' : 'sparkles'} className="size-3.5 text-[#c586c0]" /><span className="hidden xl:inline">{X.scanner}</span></button>
            <button onClick={() => instantane('manuel')} className={brique + ' text-[var(--tx)] hover:bg-[#ffffff14]'} title={X.instantane + ' (Ctrl+S)'} aria-label={X.instantane}><Ico n="save" className="size-3.5" /></button>
            {projet && centre === 'code' && <button onClick={projet.onValider} disabled={running || projet.validation || projet.valide} className={brique + ' border border-[#2ea04388] text-emerald-200 hover:bg-[#2ea04326]'}><Ico n={projet.validation ? 'spin' : 'check'} className="size-3.5" />{projet.validation ? t.pj.validant.replace('⏳ ', '') : t.pj.valider.replace('✅ ', '')}</button>}
            <button onClick={executer} disabled={enCours} title={(fichierActif ? X.executerFichier : X.cmdRun) + ' (Ctrl+Entrée)'} className={brique + ' bg-[var(--ac)] hover:bg-[#1a8ae6] text-white'}>
              <Ico n={enCours ? 'spin' : 'play'} className="size-3.5" />{enCours ? t.running : X.executer}
            </button>
          </div>
        )}
      </div>
      <div className="shrink-0 h-6 px-3 flex items-center gap-1 text-[12px] text-[var(--tx2)] bg-[var(--b1)] overflow-hidden whitespace-nowrap">
        <span className="truncate">{titre}</span><Ico n="right" className="size-3 shrink-0" /><span className="text-[var(--tx)] truncate">{etiquetteOnglet(cle)}</span>
      </div>
      {centre === 'code' && revue && (
        <div className="shrink-0 max-h-[42%] overflow-y-auto border-y border-[var(--bd)] bg-[var(--b2)] p-3" aria-live="polite">
          <div className="flex items-center mb-2"><p className={titreMini}>{t.parcoursTitre}</p><span className="flex-1" />
            <button onClick={() => setRevue(null)} aria-label={t.parcoursFerme} className="size-7 grid place-items-center rounded text-slate-400 hover:bg-slate-800 hover:text-white"><Ico n="x" className="size-4" /></button></div>
          {revue.etat === 'cours' ? <p className="text-[13px] text-sky-300 animate-pulse">{t.parcoursEnCours}</p>
            : revue.etat === 'erreur' ? <p className="text-[13px] text-rose-300">{revue.brut}</p>
            : (revue.blocs.bugs || revue.blocs.style || revue.blocs.idees)
              ? <div className="grid gap-3 xl:grid-cols-3">
                {(['bugs', 'style', 'idees'] as const).map((k, i) => (
                  <section key={k} className="min-w-0 rounded-md border border-[var(--bd)] bg-[var(--b1)] p-2.5">
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
      <div className="flex-1 min-h-0 flex flex-col">
        {(centre === 'code' || (centre === 'fichier' && !estNotebook(fichierActif ?? ''))) && (
          <>
            {estSql && centre === 'code' && tables.length > 0 && (
              <div className="shrink-0 flex flex-wrap items-center gap-x-4 gap-y-1 px-3 py-2 border-b border-[var(--bd)] bg-[var(--b2)] text-[12px] font-mono text-slate-300">
                <span className={'font-sans ' + titreMini}>{t.tables}</span>
                {tables.map((x) => <span key={x.nom}><span className="text-sky-300">{x.nom}</span>({x.colonnes.join(', ')})</span>)}
                <button onClick={() => setCentre('base')} className="ml-auto font-sans text-[12px] font-semibold text-sky-300 underline min-h-8">{t.viewRows}</button>
              </div>
            )}
            <div className="flex-1 min-h-24">
              <Suspense fallback={<div className="p-4 text-slate-500 text-[13px]">…</div>}>
                {centre === 'code' ? (
                  <Editeur ide chemin={nomFichier} valeur={code} onChange={onCode} onCurseur={(l, c) => setCurseur({ l, c })} onLancer={() => void onRun()} label={t.code}
                    diagnostics={diags} reveler={reveler} onSelection={setSelection}
                    compagnon={
                      <button onClick={sauveMoi} disabled={busy} title={t.sosTip(prof.name)} aria-label={t.sosTip(prof.name)}
                        className={`rounded-full p-0.5 bg-[var(--b0)]/90 border shadow-lg transition hover:scale-110 disabled:opacity-60 ${statut === 'err' || statut === 'ko' ? 'border-amber-400 shadow-amber-400/30 animate-pulse' : 'border-[var(--bd)]'}`}>
                        {avatar(prof, 'size-8')}
                      </button>}
                    assistants={([['bugs', '09'], ['style', '10'], ['idees', '11']] as const).map(([k, f]) => {
                      const note = revue?.etat === 'ok' ? revue.blocs[k] : ''
                      const alerte = k === 'bugs' && !!note && !/rien à signaler|nothing to report/i.test(note)
                      return (
                        <button key={k} onClick={() => void parcourir()} title={`${t.sous[k][0]} · ${t.sous[k][1]}`} aria-label={`${t.sous[k][0]} · ${t.sous[k][1]}`}
                          className="relative rounded-full bg-[var(--b0)]/90 border border-[var(--bd)] p-0.5 shadow hover:scale-110 transition">
                          <img src={import.meta.env.BASE_URL + 'visages/' + f + '.jpg'} alt="" className="size-6 rounded-full object-cover" />
                          {revue?.etat === 'cours' && <span className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full bg-sky-400 animate-pulse" />}
                          {note && <span className={`absolute -top-0.5 -right-0.5 size-2.5 rounded-full ${alerte ? 'bg-rose-400' : 'bg-emerald-400'}`} />}
                        </button>
                      )
                    })} />
                ) : (
                  <Editeur ide key={fichierActif!} chemin={fichierActif!} valeur={contenuActif} onChange={(v) => modifierFichier(fichierActif!, v)} onCurseur={(l, c) => setCurseur({ l, c })} onLancer={executer} label={fichierActif!} onSelection={setSelection} />
                )}
              </Suspense>
            </div>
          </>
        )}
        {centre === 'fichier' && estNotebook(fichierActif ?? '') && (
          <Suspense fallback={<div className="p-4 text-slate-500 text-[13px]">…</div>}>
            <Notebook key={fichierActif!} lang={lang} contenu={contenuActif} onChange={(json) => modifierFichier(fichierActif!, json)} />
          </Suspense>
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
      {panneauJSX}
      {!afficherBas && (centre === 'code' || centre === 'fichier') && !panneauOuvert && (
        <button onClick={() => setPanneauOuvert(true)} className="shrink-0 h-6 px-3 flex items-center gap-1.5 text-[11.5px] text-[var(--tx2)] border-t border-[var(--bd)] bg-[var(--b0)] hover:text-white"><Ico n="up" className="size-3" />{X.ouvrirPanneau}</button>
      )}
    </div>
  )

  // ───────── Barre latérale : leçon, explorateur, recherche, bibliothèques, plan, historique ─────────
  const sourcesRecherche = [{ nom: nomFichier, contenu: code }, ...fichiers.filter((f) => !estNotebook(f.nom)), { nom: 'notes.md', contenu: notes }]
  const inserer = (ligne: string) => {
    const cible = fichierActif && /\.py$/i.test(fichierActif) ? fichierActif : null
    if (cible) modifierFichier(cible, ligne + '\n' + contenuActif)
    else if (lesson.lang === 'py') onCode(ligne + '\n' + code)
    setNotif(ligne)
  }
  const lateralJSX = (
    <div className="h-full min-h-0 bg-[var(--b0)]">
      {vueLat === 'lecon' && colonneLecon}
      {vueLat === 'fichiers' && <Explorateur lang={lang} titre={titre} nomMain={nomFichier} fichiers={fichiers} actif={cle === 'code' ? nomFichier : fichierActif ?? cle} onOuvrir={ouvrirFichier} onCreer={(n) => creerFichier(n)} onSupprimer={supprimerFichier} onRenommer={renommerFichier} onImporter={importer}
        extras={[...(estSql ? [{ id: 'base', nom: t.base, icone: 'db' as const }] : []), ...(aPrompts ? [{ id: 'prompts', nom: t.prompts, icone: 'sparkles' as const }] : []), { id: 'notes', nom: 'notes.md', icone: 'book' as const }]} />}
      {vueLat === 'recherche' && <Recherche lang={lang} sources={sourcesRecherche} onAller={(n, l) => allerLigne(n === 'notes.md' ? 'notes' : n, l)} />}
      {vueLat === 'paquets' && <PaquetsVue lang={lang} charges={charges} onCharger={(n) => chargerPaquets([n])} onInserer={inserer} onPip={(n) => pipInstaller(n.split(/\s+/))} onActualiser={actualiserCharges} />}
      {vueLat === 'plan' && (
        <div className="h-full flex flex-col min-h-0 text-[var(--tx)]">
          <div className="shrink-0 h-9 px-3 flex items-center text-[11px] font-semibold uppercase tracking-wider text-[var(--tx2)]">{X.plan}</div>
          <div className="flex-1 min-h-0 overflow-y-auto">
            {plan.length === 0 ? <p className="px-3 text-[12px] text-[var(--tx3)]">{X.aucunSymbole}</p> : plan.map((s) => (
              <button key={s.ligne} onClick={() => allerLigne(nomActif === nomFichier || centre === 'code' ? nomFichier : (fichierActif ?? nomFichier), s.ligne)} className="w-full flex items-center gap-2 px-3 h-7 text-left text-[13px] hover:bg-[#2a2d2e]">
                <span className={`font-mono text-[11px] ${s.type === 'class' ? 'text-[#4ec9b0]' : 'text-[#dcdcaa]'}`}>{s.type === 'class' ? '◇' : 'ƒ'}</span><span className="truncate">{s.nom}</span><span className="ml-auto text-[11px] text-[var(--tx3)]">{s.ligne}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      {vueLat === 'historique' && (
        <div className="h-full flex flex-col min-h-0 text-[var(--tx)]">
          <div className="shrink-0 h-9 px-3 flex items-center text-[11px] font-semibold uppercase tracking-wider text-[var(--tx2)]"><span className="flex-1">{X.historique}</span>
            <button onClick={() => instantane('manuel')} title={X.instantane} aria-label={X.instantane} className="size-6 grid place-items-center rounded hover:bg-[#ffffff1a]"><Ico n="plus" className="size-3.5" /></button></div>
          <div className="flex-1 min-h-0 overflow-y-auto">
            {instantanes.length === 0 ? <p className="px-3 text-[12px] leading-relaxed text-[var(--tx3)]">{X.instantaneVide}</p> : instantanes.map((s) => (
              <div key={s.t} className="px-3 py-1.5 hover:bg-[#2a2d2e] group">
                <p className="text-[12.5px] flex items-center gap-1.5"><Ico n={s.etiquette === 'tests' ? 'ok' : 'save'} className={`size-3.5 ${s.etiquette === 'tests' ? 'text-[var(--ok)]' : 'text-[var(--tx2)]'}`} />{new Date(s.t).toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-GB', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}<span className="text-[var(--tx3)] text-[11px]">· {s.code.split('\n').length} {lang === 'fr' ? 'lignes' : 'lines'}</span></p>
                <div className="mt-1 flex gap-1.5">
                  <button onClick={() => setDiff(s.code)} className="h-6 px-2 rounded border border-[var(--bd)] text-[11.5px] hover:bg-[#ffffff14]">{X.comparer}</button>
                  <button onClick={() => { onCode(s.code); setCentre('code') }} className="h-6 px-2 rounded border border-[var(--bd)] text-[11.5px] hover:bg-[#ffffff14]">{X.restaurer}</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  // ───────── Droite : le chat (sessions, joindre du contexte, agents) ─────────
  const agentsProposes = [prof, ...prets.filter((a) => a.id !== prof.id && ['finia', 'ia', 'sql', 'js', 'maths', 'sys', 'sci'].includes(a.id))].slice(0, 5)
  const sessionsFiltrees = sessions.filter((s) => !rechSession || (s.nom + ' ' + s.fil.map((e) => e.q).join(' ')).toLowerCase().includes(rechSession.toLowerCase()))
  const optionsJoindre = [
    ...(fichierActif ? [['fichier', X.jFichier + ' : ' + fichierActif] as const] : []),
    ...(selection ? [['selection', X.jSelection] as const] : []),
    ...(diags.length ? [['problemes', X.jProblemes + ' (' + diags.length + ')'] as const] : []),
    ...(termLignes.length ? [['terminal', X.jTerminal] as const] : []),
  ]
  const colonneAgent = (
    <div className="h-full flex flex-col min-h-0 bg-[var(--b0)]">
      <div className="shrink-0 h-9 px-2 flex items-center gap-1 border-b border-[var(--bd)] relative">
        <button onClick={() => setMenuSessions((o) => !o)} aria-expanded={menuSessions} className="flex items-center gap-1.5 min-w-0 h-7 px-2 rounded hover:bg-[#ffffff14] text-[12.5px] text-[var(--tx)]">
          <Ico n="chat" className="size-3.5 text-[var(--tx2)]" /><span className="truncate max-w-[160px]">{session.nom || X.nouvelleSession}</span><Ico n="down" className="size-3 text-[var(--tx2)]" />
        </button>
        <span className="flex-1" />
        <button onClick={nouvelleSession} title={X.nouvelleSession} aria-label={X.nouvelleSession} className="size-7 grid place-items-center rounded hover:bg-[#ffffff14] text-[var(--tx2)] hover:text-white"><Ico n="plus" className="size-4" /></button>
        <button onClick={() => fixerLarg(large ? 380 : 640)} aria-label={large ? t.narrow : t.widen} title={large ? t.narrow : t.widen} className="hidden lg:grid size-7 place-items-center rounded hover:bg-[#ffffff14] text-[var(--tx2)] hover:text-white"><Ico n={large ? 'minimize' : 'maximize'} className="size-3.5" /></button>
        <button onClick={basculerAgent} title={X.agents} aria-label={X.agents} className="hidden lg:grid size-7 place-items-center rounded hover:bg-[#ffffff14] text-[var(--tx2)] hover:text-white"><Ico n="x" className="size-3.5" /></button>
        {menuSessions && (
          <div className="absolute left-2 right-2 top-9 z-30 rounded-md border border-[#454545] bg-[#252526] shadow-2xl shadow-black/50 max-h-[60vh] flex flex-col">
            <div className="p-2 border-b border-[var(--bd)]"><input value={rechSession} onChange={(e) => setRechSession(e.target.value)} placeholder={X.chercherSession} aria-label={X.chercherSession} className="w-full bg-[#3c3c3c] px-2 py-1 text-[13px] outline-none text-white placeholder:text-[var(--tx3)] border border-transparent focus:border-[var(--ac)]" /></div>
            <div className="overflow-y-auto py-1">
              {sessionsFiltrees.map((s) => (
                <div key={s.id} className={`group flex items-center gap-2 px-3 h-8 text-[13px] ${s.id === session.id ? 'bg-[#04395e] text-white' : 'hover:bg-[#2a2d2e] text-[var(--tx)]'}`}>
                  <button onClick={() => ouvrirSession(s.id)} className="flex-1 min-w-0 text-left truncate">{s.nom || X.nouvelleSession}</button>
                  <span className="text-[11px] text-[var(--tx3)]">{s.fil.length}</span>
                  <button onClick={() => supprimerSession(s.id)} title={X.supprimerSession} aria-label={X.supprimerSession} className="hidden group-hover:grid size-5 place-items-center rounded hover:bg-[#ffffff1f]"><Ico n="trash" className="size-3" /></button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="shrink-0 border-b border-[var(--bd)] bg-[var(--b0)] p-2">
        <div className={`flex items-center justify-between px-1 ${choixOuvert ? 'mb-1.5' : ''}`}>
          <button onClick={basculerChoix} aria-expanded={choixOuvert} className="flex items-center gap-1.5 min-h-7 text-[11px] font-semibold uppercase tracking-wider text-[var(--tx2)] hover:text-white">
            <Ico n={choixOuvert ? 'down' : 'right'} className="size-3.5" />{t.yourAgents}
          </button>
          <span className="flex items-center gap-2 text-[11.5px] text-[var(--tx2)]">{avatar(prof, 'size-5')}<span className="text-[var(--tx)] font-medium">{prof.name}</span><span className="hidden xl:inline truncate max-w-[140px]">{prof.role[lang]}</span></span>
        </div>
        {choixOuvert && (
          <div className="flex gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="tablist" aria-label={t.yourAgents}>
            {agentsProposes.map((a) => {
              const actif = a.id === prof.id
              return (
                <button key={a.id} role="tab" aria-selected={actif} onClick={() => choisirProf(a.id)}
                  className={`shrink-0 w-[4.4rem] flex flex-col items-center gap-1 p-1.5 rounded-md border ${actif ? 'bg-[#04395e] border-[var(--ac2)]/70' : 'bg-transparent border-[var(--bd)] hover:bg-[#ffffff0d]'}`}>
                  <span className={actif ? '' : 'opacity-70'}>{avatar(a, 'size-9')}</span>
                  <span className={`text-[11px] font-semibold truncate w-full text-center ${actif ? 'text-white' : 'text-[var(--tx2)]'}`}>{a.name}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>
      <div ref={boite} onScroll={(e) => { const el = e.currentTarget; enBas.current = el.scrollHeight - el.scrollTop - el.clientHeight < 48 }}
        className="flex-1 min-h-0 overflow-y-auto p-3 space-y-4 text-[13.5px] leading-relaxed" aria-live="polite">
        <div className="flex gap-2.5">
          <span className="shrink-0 pt-0.5">{avatar(prof, 'size-7')}</span>
          <div className="min-w-0 max-w-[92%] rounded-lg rounded-tl-none border border-[var(--bd)] bg-[var(--b1)] px-3 py-2 text-[var(--tx)]">
            <p className="text-[10.5px] font-medium text-[var(--ac2)] mb-1">{prof.name}</p>
            {t.hello(prof.name, titre)}{estSql && <span className="block mt-1.5">{t.baseHello}</span>}
          </div>
        </div>
        {fil.map((e, i) => (
          <div key={i} className="space-y-3">
            <div className="flex gap-2.5 flex-row-reverse">
              <span className="shrink-0 size-7 rounded-full bg-[#3c3c3c] text-slate-200 grid place-items-center" aria-hidden="true"><Ico n="user" className="size-4" /></span>
              <p className="max-w-[85%] rounded-lg rounded-tr-none bg-[#0e639c] text-white px-3 py-2 whitespace-pre-wrap break-words">{e.q.split('\n\n[')[0]}</p>
            </div>
            {e.a ? (
              <div className="flex gap-2.5">
                <span className="shrink-0 pt-0.5">{avatar(agents.find((x) => x.id === e.prof) ?? prof, 'size-7')}</span>
                <div className={`min-w-0 max-w-[94%] rounded-lg rounded-tl-none border px-3 py-2 ${e.ok === false ? 'border-[#f14c4c66] bg-[#f14c4c14] text-rose-200' : 'border-[var(--bd)] bg-[var(--b1)] text-[var(--tx)]'}`}>
                  <p className="text-[10.5px] font-medium text-[var(--ac2)] mb-1">{(agents.find((x) => x.id === e.prof) ?? prof).name}</p>
                  <Reponse texte={e.a} t={t} onAppliquer={(c) => (fichierActif ? modifierFichier(fichierActif, c) : onCode(c))} onComparer={(c) => setDiff(c)} />
                </div>
              </div>
            ) : <p className="text-[12px] text-[var(--ac2)] animate-pulse" role="status">{prof.name} {t.thinking}</p>}
          </div>
        ))}
      </div>
      <div className="shrink-0 px-3 py-1.5 border-t border-[var(--bd)] flex gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {t.chips.map(([label, q]) => (
          <button key={label} onClick={() => poserAvecContexte(q)} disabled={busy || !ai || !signedIn}
            className="shrink-0 text-[11.5px] px-2.5 py-1 rounded-full bg-[#2d2d30] hover:bg-[#37373d] text-[var(--tx)] border border-[var(--bd)] disabled:opacity-40">{label}</button>
        ))}
      </div>
      <div className="shrink-0 border-t border-[var(--bd)] bg-[var(--b0)] p-2.5 space-y-2 relative">
        {!ai ? <p className="text-[12px] text-[var(--tx2)]">{t.aiOff}</p>
          : !signedIn ? <div className="flex items-center gap-2 text-[12px] text-[var(--tx2)]"><span className="flex-1">{t.needLogin}</span>
            <button className="rounded bg-[var(--ac)] hover:bg-[#1a8ae6] px-3 min-h-9 font-semibold text-white" onClick={() => window.dispatchEvent(new Event('learn:login'))}>{t.login}</button></div>
          : null}
        {joints.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {joints.map((j) => (
              <span key={j} className="inline-flex items-center gap-1 rounded-full bg-[#2d2d30] border border-[var(--bd)] pl-2 pr-1 h-6 text-[11.5px] text-[var(--tx)]">
                <Ico n="clip" className="size-3 text-[var(--tx2)]" />{({ fichier: X.jFichier, selection: X.jSelection, problemes: X.jProblemes, terminal: X.jTerminal } as Record<string, string>)[j]}
                <button onClick={() => setJoints((l) => l.filter((x) => x !== j))} aria-label="x" className="size-4 grid place-items-center rounded-full hover:bg-[#ffffff1f]"><Ico n="x" className="size-2.5" /></button>
              </span>
            ))}
          </div>
        )}
        {menuJoindre && (
          <div className="absolute left-2.5 bottom-[3.6rem] z-30 w-56 rounded-md border border-[#454545] bg-[#252526] py-1 shadow-2xl shadow-black/50">
            {optionsJoindre.length === 0 && <p className="px-3 py-2 text-[12px] text-[var(--tx3)]">{lang === 'fr' ? 'Rien à joindre pour l’instant (ouvre un fichier ou sélectionne du code).' : 'Nothing to attach yet (open a file or select code).'}</p>}
            {optionsJoindre.map(([k, nom]) => (
              <button key={k} onClick={() => { setJoints((l) => (l.includes(k) ? l : [...l, k])); setMenuJoindre(false) }} className="w-full flex items-center gap-2 px-3 h-8 text-left text-[12.5px] text-[var(--tx)] hover:bg-[#04395e]"><Ico n="clip" className="size-3.5 text-[var(--tx2)]" /><span className="truncate">{nom}</span></button>
            ))}
          </div>
        )}
        <form onSubmit={(e) => { e.preventDefault(); poserAvecContexte() }} className="flex items-end gap-1.5 rounded-md border border-[var(--bd)] bg-[var(--b1)] p-1.5 focus-within:border-[var(--ac)]">
          <button type="button" onClick={() => setMenuJoindre((o) => !o)} title={X.joindre} aria-label={X.joindre} aria-expanded={menuJoindre} className="size-8 shrink-0 grid place-items-center rounded hover:bg-[#ffffff14] text-[var(--tx2)] hover:text-white"><Ico n="plus" className="size-4" /></button>
          <textarea value={question} rows={1} maxLength={2000} placeholder={t.ask} aria-label={t.ask} disabled={!ai || !signedIn}
            onChange={(e) => { setQuestion(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 140) + 'px' }}
            ref={(el) => { if (el) { el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 140) + 'px' } }}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); poserAvecContexte() } }}
            className="flex-1 min-w-0 resize-none bg-transparent px-1 py-1.5 text-[16px] lg:text-[13px] leading-snug text-white outline-none placeholder:text-[var(--tx3)] disabled:opacity-50" />
          <button disabled={!question.trim() || busy || !ai || !signedIn} aria-label={t.send}
            className="size-8 shrink-0 grid place-items-center rounded bg-[var(--ac)] hover:bg-[#1a8ae6] text-white disabled:opacity-40"><Ico n="send" className="size-4" /></button>
        </form>
      </div>

    </div>
  )

  // ───────── Réglages, palette ─────────
  const commandes: Commande[] = [
    { id: 'run', titre: X.cmdRun, section: X.commandes, icone: 'play', raccourci: 'Ctrl+↵', run: executer },
    { id: 'scan', titre: X.cmdScan, section: X.commandes, icone: 'sparkles', run: () => void parcourir() },
    { id: 'sos', titre: X.cmdSos, section: X.commandes, icone: 'sos', run: sauveMoi },
    { id: 'snap', titre: X.cmdSnap, section: X.commandes, icone: 'save', raccourci: 'Ctrl+S', run: () => instantane('manuel') },
    { id: 'newpy', titre: X.cmdNewFile, section: X.commandes, icone: 'file', run: () => creerFichier(nomLibre('script.py', nomsPris)) },
    { id: 'newnb', titre: X.cmdNewNb, section: X.commandes, icone: 'notebook', run: () => creerFichier(nomLibre('carnet.ipynb', nomsPris)) },
    { id: 'side', titre: X.cmdSide, section: X.commandes, icone: 'panelleft', raccourci: 'Ctrl+B', run: () => basculerLat() },
    { id: 'panel', titre: X.cmdPanel, section: X.commandes, icone: 'panelbottom', raccourci: 'Ctrl+J', run: () => setPanneauOuvert((o) => !o) },
    { id: 'agents', titre: X.cmdAgents, section: X.commandes, icone: 'panelright', run: basculerAgent },
    { id: 'term', titre: X.terminal, section: X.afficher, icone: 'terminal', raccourci: 'Ctrl+`', run: () => { afficherPanneau('terminal'); setTimeout(() => document.getElementById('ide-term-input')?.focus(), 80) } },
    { id: 'out', titre: X.sortie, section: X.afficher, icone: 'terminal', run: () => afficherPanneau('sortie') },
    { id: 'prob', titre: X.problemes, section: X.afficher, icone: 'warn', run: () => afficherPanneau('problemes') },
    { id: 'tests', titre: X.tests, section: X.afficher, icone: 'ok', run: () => afficherPanneau('tests') },
    { id: 'vl', titre: X.vueLecon, section: X.afficher, icone: 'book', run: () => basculerLat('lecon') },
    { id: 'vf', titre: X.vueFichiers, section: X.afficher, icone: 'files', raccourci: 'Ctrl+Maj+E', run: () => basculerLat('fichiers') },
    { id: 'vr', titre: X.vueRecherche, section: X.afficher, icone: 'search', raccourci: 'Ctrl+Maj+F', run: () => basculerLat('recherche') },
    { id: 'vp', titre: X.vuePaquets, section: X.afficher, icone: 'pkg', run: () => basculerLat('paquets') },
    { id: 'vo', titre: X.vuePlan, section: X.afficher, icone: 'tree', run: () => basculerLat('plan') },
    { id: 'vh', titre: X.vueHist, section: X.afficher, icone: 'history', run: () => basculerLat('historique') },
    { id: 'clear', titre: X.cmdClear, section: X.commandes, icone: 'eraser', run: () => setTermLignes([]) },
    { id: 'restart', titre: X.cmdRestart, section: X.commandes, icone: 'refresh', run: () => { void redemarrerTerminal(); setTermLignes([]) } },
    { id: 'fup', titre: X.cmdFontUp, section: X.commandes, icone: 'plus', run: () => changerTaille(1) },
    { id: 'fdown', titre: X.cmdFontDown, section: X.commandes, icone: 'plus', run: () => changerTaille(-1) },
    { id: 'exp', titre: X.cmdExplain, section: X.commandes, icone: 'chat', run: () => { setVue('agent'); if (!agentOuvert) basculerAgent(); void poser(t.chips[0][1]) } },
    { id: 'hint', titre: X.cmdHint, section: X.commandes, icone: 'bulb', run: () => { setVue('agent'); if (!agentOuvert) basculerAgent(); void poser(t.chips[1][1]) } },
    { id: 'find', titre: X.cmdFind, section: X.commandes, icone: 'bug', run: () => { setVue('agent'); if (!agentOuvert) basculerAgent(); void poser(t.chips[2][1]) } },
    ...(selection ? [{ id: 'sel', titre: X.cmdSelect, section: X.commandes, icone: 'chat' as const, run: () => { setVue('agent'); if (!agentOuvert) basculerAgent(); void poser(X.questionSel + '\n```\n' + selection.slice(0, 1500) + '\n```') } }] : []),
    ...(onNext ? [{ id: 'next', titre: X.cmdNext, section: X.commandes, icone: 'right' as const, run: onNext }] : []),
    ...(onPrev ? [{ id: 'prev', titre: X.cmdPrev, section: X.commandes, icone: 'left' as const, run: onPrev }] : []),
    { id: 'close', titre: X.cmdClose, section: X.commandes, icone: 'x', run: onClose },
    { id: 'f:main', titre: nomFichier, section: X.fichiers, icone: iconeFichier(nomFichier).n, run: () => ouvrir('code') },
    ...fichiers.map((f) => ({ id: 'f:' + f.nom, titre: f.nom, section: X.fichiers, icone: iconeFichier(f.nom).n, run: () => ouvrir('f:' + f.nom) })),
    ...CATALOGUE.map((p) => ({ id: 'pkg:' + p.id, titre: X.installer + ' ' + p.id, section: X.bibliotheques, icone: 'pkg' as const, mots: p.import, run: () => { void chargerPaquets([nomPyodide(p.id)]).then(actualiserCharges); inserer(p.import) } })),
  ]

  const avionTexte = largLat // largeur de la barre latérale
  void avionTexte
  const mobile = typeof window !== 'undefined' && window.innerWidth < 1024
  void mobile

  return (
    <div className="ws fixed inset-0 z-50 flex flex-col bg-[var(--b1)] text-[var(--tx)]" style={{ '--ide-fs': taille + 'px' } as CSSProperties} role="region" aria-label={titre}>
      <header className="shrink-0 h-9 flex items-center gap-2 px-2 bg-[var(--b0)] border-b border-[var(--bd)] text-[12px]" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <button onClick={onClose} aria-label={t.close} title={t.close} className="size-7 grid place-items-center rounded hover:bg-[#ffffff14] text-[var(--tx2)] hover:text-white"><Ico n="left" className="size-4" /></button>
        <p className="hidden sm:flex items-center gap-1 min-w-0 text-[var(--tx2)] truncate">{projet ? `${t.pj.titre} ${projet.numero} · ${projet.variante}` : t.lesson}<Ico n="right" className="size-3 shrink-0" /><span className="text-[var(--tx)] font-medium truncate">{titre}</span></p>
        <p className="sm:hidden flex-1 min-w-0 font-medium text-white truncate">{titre}</p>
        <span className="hidden sm:block flex-1" />
        <button onClick={() => setPalette(true)} className="hidden md:flex items-center gap-2 h-6 w-[min(420px,32vw)] px-2 rounded border border-[var(--bd)] bg-[var(--b1)] text-[var(--tx2)] hover:border-[#454545] hover:text-white"><Ico n="search" className="size-3" /><span className="flex-1 truncate text-left">{X.palette}</span><kbd className="text-[10px] border border-[#3c3c3c] rounded px-1">Ctrl K</kbd></button>
        <span className="hidden sm:block flex-1" />
        <div className="hidden lg:flex items-center gap-0.5">
          <button onClick={() => basculerLat()} aria-pressed={latOuverte} title={X.barreLat + ' (Ctrl+B)'} aria-label={X.barreLat} className={`size-7 grid place-items-center rounded hover:bg-[#ffffff14] ${latOuverte ? 'text-white' : 'text-[var(--tx3)]'}`}><Ico n="panelleft" className="size-4" /></button>
          <button onClick={() => setPanneauOuvert((o) => !o)} aria-pressed={panneauOuvert} title={X.cmdPanel + ' (Ctrl+J)'} aria-label={X.cmdPanel} className={`size-7 grid place-items-center rounded hover:bg-[#ffffff14] ${panneauOuvert ? 'text-white' : 'text-[var(--tx3)]'}`}><Ico n="panelbottom" className="size-4" /></button>
          <button onClick={basculerAgent} aria-pressed={agentOuvert} title={X.agents} aria-label={X.agents} className={`size-7 grid place-items-center rounded hover:bg-[#ffffff14] ${agentOuvert ? 'text-white' : 'text-[var(--tx3)]'}`}><Ico n="panelright" className="size-4" /></button>
        </div>
        <span className="hidden sm:inline rounded border border-[var(--bd)] bg-[var(--b1)] px-2 py-0.5 text-[11.5px] text-[var(--tx2)]">{langage}</span>
      </header>
      <div className="flex-1 min-h-0 flex">
        <BarreActivite lang={lang} vue={vueLat} ouverte={latOuverte} onVue={basculerLat} onPalette={() => setPalette(true)} onReglages={() => setReglages((o) => !o)} />
        {latOuverte && (
          <aside className="hidden lg:block relative shrink-0 min-h-0 border-r border-[var(--bd)] bg-[var(--b0)]" style={{ width: largLat }}>
            {lateralJSX}
            <div role="separator" aria-orientation="vertical" onPointerDown={glisserLat} className="absolute inset-y-0 -right-1 z-10 w-2 cursor-col-resize touch-none hover:bg-[var(--ac)]/50" />
          </aside>
        )}
        <div className={`${vue === 'lecon' ? 'block' : 'hidden'} lg:hidden flex-1 min-w-0 h-full min-h-0 bg-[var(--b0)]`}>{colonneLecon}</div>
        <main className={`${vue === 'travail' ? 'flex' : 'hidden'} lg:flex flex-1 min-w-0 h-full min-h-0 flex-col`}>{colonneCentre}</main>
        {agentOuvert && (
          <aside className={`${vue === 'agent' ? 'block' : 'hidden'} lg:block relative shrink-0 h-full min-h-0 bg-[var(--b0)] lg:border-l border-[var(--bd)] max-lg:flex-1 max-lg:min-w-0`} style={{ width: undefined }}>
            <div className="h-full lg:w-[var(--aw)]" style={{ '--aw': larg + 'px' } as CSSProperties}>
              <div role="separator" aria-orientation="vertical" tabIndex={0} aria-label={t.resize} aria-valuenow={larg} aria-valuemin={300} aria-valuemax={bornesLarg()[1]}
                onPointerDown={glisser}
                onKeyDown={(e) => { if (e.key === 'ArrowLeft') { e.preventDefault(); fixerLarg(larg + 32) } else if (e.key === 'ArrowRight') { e.preventDefault(); fixerLarg(larg - 32) } }}
                className="hidden lg:block absolute inset-y-0 -left-1 z-10 w-2 cursor-col-resize touch-none hover:bg-[var(--ac)]/50 focus-visible:bg-[var(--ac)] outline-none" />
              {colonneAgent}
            </div>
          </aside>
        )}
      </div>
      <BarreEtat lang={lang} erreurs={nbErreurs} avertissements={nbAvert} onProblemes={() => afficherPanneau('problemes')} ligne={curseur.l} colonne={curseur.c} langage={langage}
        bibliotheques={charges.length} onBibliotheques={() => basculerLat('paquets')} agent={{ nom: prof.name, face: prof.face }} agentEtat={!ai || !signedIn ? 'hors' : busy ? 'reflechit' : 'pret'}
        tests={res?.tests && res.tests.total > 0 ? { ok: res.tests.ok, total: res.tests.total } : null} onTests={() => afficherPanneau('tests')} instantanes={instantanes.length} onHistorique={() => basculerLat('historique')} />
      {notif && <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[70] rounded border border-[#454545] bg-[#252526] px-3 py-1.5 text-[12.5px] text-white shadow-xl" role="status">{notif}</div>}
      {reglages && (
        <div className="fixed left-12 bottom-6 z-[65] w-64 rounded-md border border-[#454545] bg-[#252526] p-3 shadow-2xl text-[12.5px]" role="dialog" aria-label={X.reglages}>
          <p className="mb-2 font-semibold text-white">{X.reglages}</p>
          <div className="flex items-center justify-between py-1"><span>{X.taille}</span><span className="flex items-center gap-1"><button onClick={() => changerTaille(-1)} className="size-6 rounded border border-[var(--bd)] hover:bg-[#ffffff14]" aria-label={X.cmdFontDown}>−</button><span className="w-8 text-center">{taille}</span><button onClick={() => changerTaille(1)} className="size-6 rounded border border-[var(--bd)] hover:bg-[#ffffff14]" aria-label={X.cmdFontUp}>+</button></span></div>
          <button onClick={() => { void redemarrerTerminal(); setTermLignes([]); setReglages(false) }} className="mt-1 w-full h-7 rounded border border-[var(--bd)] hover:bg-[#ffffff14] text-left px-2">{X.redemarrer}</button>
          <button onClick={() => { setTermLignes([]); setReglages(false) }} className="mt-1 w-full h-7 rounded border border-[var(--bd)] hover:bg-[#ffffff14] text-left px-2">{X.viderTerm}</button>
          <button onClick={() => setReglages(false)} className="mt-2 w-full h-7 rounded bg-[var(--ac)] hover:bg-[#1a8ae6] text-white">OK</button>
        </div>
      )}
      <nav className="lg:hidden shrink-0 grid grid-cols-3 border-t border-[var(--bd)] bg-[var(--b0)]" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }} role="tablist" aria-label={titre}>
        {(['lecon', 'travail', 'agent'] as const).map((k) => (
          <button key={k} role="tab" aria-selected={vue === k} onClick={() => { setVue(k); if (k === 'agent' && !agentOuvert) basculerAgent() }}
            className={`min-h-12 flex flex-col items-center justify-center gap-0.5 text-[11px] font-semibold ${vue === k ? 'text-[var(--ac2)]' : 'text-[var(--tx2)]'}`}>
            <Ico n={k === 'lecon' ? 'book' : k === 'travail' ? (aCode ? 'code' : 'pencil') : 'chat'} className="size-5" />{t.tabs[k]}
          </button>
        ))}
      </nav>
      <Palette lang={lang} ouverte={palette} onFermer={() => setPalette(false)} commandes={commandes} />
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
