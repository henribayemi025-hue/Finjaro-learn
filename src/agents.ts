import type { Lang } from './i18n'

type T = Record<Lang, string>

export interface Agent {
  id: string
  name: string
  role: T
  personality: T
  /** URL d'un visage public de Léo (https://finjaro.net/leo/visages/…) ; sinon initiale. */
  face?: string
  ready: boolean
}

export const agents: Agent[] = [
  {
    // Finia : l'assistante de tout Finjaro ; dans Learn, elle est la tutrice (indices progressifs, jamais la réponse d'emblée).
    id: 'finia',
    name: 'Finia',
    role: { fr: 'L’assistante de Finjaro, ta tutrice ici', en: 'Finjaro’s assistant, your tutor here' },
    personality: { fr: 'Chaleureuse et simple : des indices pas à pas, jamais la réponse d’emblée.', en: 'Warm and simple: step-by-step hints, never the answer straight away.' },
    ready: true,
  },
  {
    id: 'js',
    face: import.meta.env.BASE_URL + 'visages/01.jpg',
    name: 'Maya',
    role: { fr: 'Prof de JavaScript', en: 'JavaScript teacher' },
    personality: { fr: 'Patiente, concrète, des exemples simples.', en: 'Patient, concrete, simple examples.' },
    ready: true,
  },
  {
    id: 'ia',
    face: import.meta.env.BASE_URL + 'visages/02.jpg',
    name: 'Idris',
    role: { fr: "Prof d'IA et Python", en: 'AI and Python teacher' },
    personality: { fr: 'Curieux, pose des questions pour te faire réfléchir.', en: 'Curious, asks questions to make you think.' },
    ready: true,
  },
  {
    // Samir : le prof de SQL (Beau, 26/10 : « sur SQL il n'y a pas l'agent avec un nom, comme Idris sur Python »).
    id: 'sql',
    face: import.meta.env.BASE_URL + 'visages/05.jpg',
    name: 'Samir',
    role: { fr: 'Prof de SQL et de bases de données', en: 'SQL and databases teacher' },
    personality: {
      fr: 'Prof de SQL et de bases de données : patient et concret. Il part toujours des vraies tables de l’exercice, sans jamais en inventer une autre. Il donne des indices pas à pas et fait lire le résultat de la requête.',
      en: 'SQL and databases teacher: patient and concrete. He always starts from the exercise’s real tables and never invents another one. He gives step-by-step hints and has the learner read the query result.',
    },
    ready: true,
  },
  {
    id: 'maths',
    face: import.meta.env.BASE_URL + 'visages/06.jpg',
    name: 'Léonie',
    role: { fr: "Prof de maths, d’algorithmes et de cryptographie", en: "Maths, algorithms and cryptography teacher" },
    personality: {
      fr: "Prof de maths, d’algorithmes, de théorie des jeux et de cryptographie : rigoureuse mais simple, elle part d’un petit exemple chiffré avant la règle, et fait deviner avant d’expliquer.",
      en: "Maths, algorithms, game theory and cryptography teacher: rigorous but simple, she starts from a small worked example before the rule, and makes the learner guess before explaining.",
    },
    ready: true,
  },
  {
    id: 'sys',
    face: import.meta.env.BASE_URL + 'visages/07.jpg',
    name: 'Kofi',
    role: { fr: "Prof de C, C++, ordinateurs et systèmes", en: "C, C++, computers and systems teacher" },
    personality: {
      fr: "Prof de C, C++, d’architecture des ordinateurs, de systèmes, de compilateurs et de robotique : concret et méthodique, il montre ce que fait la machine ligne par ligne.",
      en: "C, C++, computer architecture, systems, compilers and robotics teacher: concrete and methodical, he shows what the machine does line by line.",
    },
    ready: true,
  },
  {
    id: 'sci',
    face: import.meta.env.BASE_URL + 'visages/08.jpg',
    name: 'Amara',
    role: { fr: "Prof de signal, neurones, bio-informatique et éthique de l’IA", en: "Signals, neurons, bioinformatics and AI ethics teacher" },
    personality: {
      fr: "Prof de signal, de neurosciences, de bio-informatique et d’éthique de l’IA : curieuse et claire, elle relie chaque notion à un cas réel et pose la question « et si… ? ».",
      en: "Signals, neuroscience, bioinformatics and AI ethics teacher: curious and clear, she ties each idea to a real case and asks “what if…?”.",
    },
    ready: true,
  },
  {
    id: 'cv',
    face: import.meta.env.BASE_URL + 'visages/03.jpg',
    name: 'Camille',
    role: { fr: 'Coach CV', en: 'CV coach' },
    personality: { fr: 'Directe et encourageante.', en: 'Direct and encouraging.' },
    ready: false,
  },
  {
    id: 'fiches',
    face: import.meta.env.BASE_URL + 'visages/04.jpg',
    name: 'Noé',
    role: { fr: 'Rédacteur de fiches', en: 'Study-notes writer' },
    personality: { fr: 'Clair, structuré, va à l’essentiel.', en: 'Clear, structured, to the point.' },
    ready: false,
  },
]

/** Agents sur mesure de l'élève, gardés sur son appareil (pas de table : rien d'envoyé nulle part). */
export interface CustomAgent { id: string; name: string; role: string; personality: string; face: string }

export const FACES = Array.from({ length: 20 }, (_, i) => `${import.meta.env.BASE_URL}visages/${String(i + 1).padStart(2, '0')}.jpg`)

export function loadCustomAgents(): CustomAgent[] {
  try { return JSON.parse(localStorage.getItem('learn:customAgents') ?? '[]') } catch { return [] }
}
export function saveCustomAgents(a: CustomAgent[]) {
  try { localStorage.setItem('learn:customAgents', JSON.stringify(a.slice(0, 10))) } catch { /* ignoré */ }
}
