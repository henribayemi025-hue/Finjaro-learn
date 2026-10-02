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
