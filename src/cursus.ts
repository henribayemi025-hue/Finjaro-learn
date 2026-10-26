import { lessons, type Group, type Lesson } from './lessons'
import type { Lang } from './i18n'

type T = Record<Lang, string>

/** Un module du cursus : des leçons déjà dans Learn, rangées dans l'ordre où on les apprend. Aucune leçon n'est copiée : la réussite d'une leçon compte partout. */
export interface Module {
  id: string
  titre: T
  /** Ce que la personne saura faire en sortant : une phrase. */
  sauras: T
  groups: Group[]
  /** Le prof qui accompagne ce module (id dans agents.ts). */
  prof: string
}

export const MODULES: Module[] = [
  { id: 'm1', prof: 'ia', groups: ['py-bases'],
    titre: { fr: 'Ta première ligne de code (Python)', en: 'Your first line of code (Python)' },
    sauras: { fr: 'Écrire de petits programmes qui lisent, trient et calculent. On part de zéro : la première leçon, c’est une seule ligne.', en: 'Write small programs that read, sort and compute. We start from zero: the first lesson is a single line.' } },
  { id: 'm2', prof: 'maths', groups: ['py-algo'],
    titre: { fr: 'Algorithmes et structures', en: 'Algorithms and structures' },
    sauras: { fr: 'Choisir la bonne structure et écrire une recherche, un tri, un graphe.', en: 'Pick the right structure and write a search, a sort, a graph.' } },
  { id: 'm3', prof: 'ia', groups: ['py-lecture', 'py-projets', 'git'],
    titre: { fr: 'Lire du code, versionner', en: 'Reading code, versioning' },
    sauras: { fr: 'Comprendre le code des autres (et des articles) et suivre tes versions avec Git.', en: 'Understand other people’s code (and papers) and track your versions with Git.' } },
  { id: 'm4', prof: 'sys', groups: ['archi'],
    titre: { fr: 'Comment marche un ordinateur', en: 'How a computer works' },
    sauras: { fr: 'Construire, des portes logiques jusqu’au mini-processeur, ce que ton code fait vraiment.', en: 'Build, from logic gates up to a tiny processor, what your code really does.' } },
  { id: 'm5', prof: 'sys', groups: ['c', 'cpp'],
    titre: { fr: 'C et C++', en: 'C and C++' },
    sauras: { fr: 'Écrire le code rapide et proche de la machine que l’on trouve dans les fusées, les robots et les moteurs d’IA.', en: 'Write the fast, close-to-the-machine code found in rockets, robots and AI engines.' } },
  { id: 'm6', prof: 'sys', groups: ['systemes'],
    titre: { fr: 'Systèmes et réseaux', en: 'Systems and networks' },
    sauras: { fr: 'Comprendre ordonnancement, cache, transmission fiable et consensus.', en: 'Understand scheduling, caches, reliable transmission and consensus.' } },
  { id: 'm7', prof: 'maths', groups: ['maths'],
    titre: { fr: 'Les maths de l’IA', en: 'The maths of AI' },
    sauras: { fr: 'Manier vecteurs, dérivées, gradient, probabilités et entropie.', en: 'Handle vectors, derivatives, gradients, probability and entropy.' } },
  { id: 'm8', prof: 'ia', groups: ['ds-numpy', 'ds-pandas', 'ds-ml', 'ds-viz'],
    titre: { fr: 'Données et apprentissage', en: 'Data and learning' },
    sauras: { fr: 'Nettoyer des données, les analyser, entraîner et évaluer un premier modèle.', en: 'Clean and analyse data, train and evaluate a first model.' } },
  { id: 'm9', prof: 'sql', groups: ['sql'],
    titre: { fr: 'Bases de données (SQL)', en: 'Databases (SQL)' },
    sauras: { fr: 'Interroger une vraie base : filtrer, grouper, joindre.', en: 'Query a real database: filter, group, join.' } },
  { id: 'm10', prof: 'ia', groups: ['dl', 'dl-reseaux'],
    titre: { fr: 'Réseaux de neurones', en: 'Neural networks' },
    sauras: { fr: 'Écrire et entraîner un réseau, comprendre la convolution et l’attention.', en: 'Write and train a network, understand convolution and attention.' } },
  { id: 'm11', prof: 'ia', groups: ['nlp'],
    titre: { fr: 'Langage et Transformers', en: 'Language and Transformers' },
    sauras: { fr: 'Suivre un texte jusqu’au Transformer : jetons, embeddings, attention.', en: 'Follow a text all the way to the Transformer: tokens, embeddings, attention.' } },
  { id: 'm12', prof: 'ia', groups: ['pe', 'ai-rag', 'ai-agents', 'ia-api'],
    titre: { fr: 'Construire avec les modèles', en: 'Building with models' },
    sauras: { fr: 'Écrire des prompts fiables, un assistant RAG et un agent, les évaluer.', en: 'Write reliable prompts, a RAG assistant and an agent, and evaluate them.' } },
  { id: 'm13', prof: 'sci', groups: ['signal', 'robo', 'robo-traces', 'robo-reel'],
    titre: { fr: 'Capteurs, signal et robots', en: 'Sensors, signals and robots' },
    sauras: { fr: 'Filtrer un signal de capteur et faire piloter un robot par une boucle de contrôle (PID).', en: 'Filter a sensor signal and drive a robot with a control loop (PID).' } },
  { id: 'm14', prof: 'sci', groups: ['ethique'],
    titre: { fr: 'Biais, vie privée, explicabilité', en: 'Bias, privacy, explainability' },
    sauras: { fr: 'Mesurer un biais et dire quand un modèle ne doit pas décider seul.', en: 'Measure a bias and say when a model must not decide alone.' } },
]

export interface ModuleVu { m: Module; ls: { l: Lesson; i: number }[]; fait: number; pct: number }

/** Les leçons de chaque module, dans l'ordre de Learn, avec l'avancement. */
export function modulesVus(done: string[]): ModuleVu[] {
  return MODULES.map((m) => {
    const ls = lessons.map((l, i) => ({ l, i })).filter(({ l }) => m.groups.includes(l.group ?? 'js'))
    const fait = ls.filter(({ l }) => done.includes(l.id)).length
    return { m, ls, fait, pct: ls.length ? Math.round((fait / ls.length) * 100) : 0 }
  })
}

export const cursusTotal = (vus: ModuleVu[]) => ({
  total: vus.reduce((s, v) => s + v.ls.length, 0),
  fait: vus.reduce((s, v) => s + v.fait, 0),
})

/** Le module en cours : le premier qui n'est pas terminé. */
export const moduleCourant = (vus: ModuleVu[]) => vus.find((v) => v.fait < v.ls.length) ?? null
