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
    id: 'js',
    name: 'Maya',
    role: { fr: 'Prof de JavaScript', en: 'JavaScript teacher' },
    personality: { fr: 'Patiente, concrète, des exemples simples.', en: 'Patient, concrete, simple examples.' },
    ready: true,
  },
  {
    id: 'ia',
    name: 'Idris',
    role: { fr: "Prof d'IA et Python", en: 'AI and Python teacher' },
    personality: { fr: 'Curieux, pose des questions pour te faire réfléchir.', en: 'Curious, asks questions to make you think.' },
    ready: true,
  },
  {
    id: 'cv',
    name: 'Camille',
    role: { fr: 'Coach CV', en: 'CV coach' },
    personality: { fr: 'Directe et encourageante.', en: 'Direct and encouraging.' },
    ready: false,
  },
  {
    id: 'fiches',
    name: 'Noé',
    role: { fr: 'Rédacteur de fiches', en: 'Study-notes writer' },
    personality: { fr: 'Clair, structuré, va à l’essentiel.', en: 'Clear, structured, to the point.' },
    ready: false,
  },
]
