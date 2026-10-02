import type { Group } from './lessons'

type L2 = { fr: string; en: string }

/** Les parcours et leurs sections (partagé par la vue d'ensemble et l'arbre de compétences). */
export const TRACKS: { key: string; name: L2; groups: Group[]; groupName: Partial<Record<Group, L2>> }[] = [
  { key: 'prog', name: { fr: 'Programmation', en: 'Programming' }, groups: ['js', 'py-bases', 'py-algo', 'py-lecture', 'py-projets'],
    groupName: { js: { fr: 'JavaScript', en: 'JavaScript' }, 'py-bases': { fr: 'Python · bases', en: 'Python · basics' }, 'py-algo': { fr: 'Algorithmes et structures', en: 'Algorithms and structures' }, 'py-lecture': { fr: 'Lire du code', en: 'Reading code' }, 'py-projets': { fr: 'Projets', en: 'Projects' } } },
  { key: 'data', name: { fr: 'Data science', en: 'Data science' }, groups: ['ds-numpy', 'ds-pandas', 'ds-ml', 'ds-viz'],
    groupName: { 'ds-numpy': { fr: 'NumPy', en: 'NumPy' }, 'ds-pandas': { fr: 'pandas', en: 'pandas' }, 'ds-ml': { fr: 'Statistiques et apprentissage', en: 'Statistics and learning' }, 'ds-viz': { fr: 'Graphiques et projet', en: 'Charts and project' } } },
  { key: 'dl', name: { fr: 'IA et deep learning', en: 'AI and deep learning' }, groups: ['dl', 'dl-reseaux'],
    groupName: { dl: { fr: 'Les bases', en: 'The basics' }, 'dl-reseaux': { fr: 'Réseaux de neurones', en: 'Neural networks' } } },
  { key: 'eng', name: { fr: 'AI engineering', en: 'AI engineering' }, groups: ['ai-rag', 'ai-agents'],
    groupName: { 'ai-rag': { fr: 'Recherche et RAG', en: 'Retrieval and RAG' }, 'ai-agents': { fr: 'Agents et production', en: 'Agents and production' } } },
  { key: 'prompt', name: { fr: 'Prompt engineering', en: 'Prompt engineering' }, groups: ['pe'],
    groupName: { pe: { fr: 'Prompt engineering', en: 'Prompt engineering' } } },
  { key: 'crypto', name: { fr: 'Cryptographie', en: 'Cryptography' }, groups: ['crypto'],
    groupName: { crypto: { fr: 'Chiffres, hachage, RSA', en: 'Ciphers, hashing, RSA' } } },
  { key: 'maths', name: { fr: "Maths pour l'IA", en: 'Maths for AI' }, groups: ['maths'],
    groupName: { maths: { fr: 'Vecteurs, gradient, probabilités', en: 'Vectors, gradient, probability' } } },
]
