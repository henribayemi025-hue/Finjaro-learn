import type { Group } from './lessons'

type L2 = { fr: string; en: string }

/** Les parcours et leurs sections (partagé par la vue d'ensemble et l'arbre de compétences). */
export const TRACKS: { key: string; name: L2; groups: Group[]; groupName: Partial<Record<Group, L2>> }[] = [
  { key: 'projets', name: { fr: 'Projets guidés', en: 'Guided projects' }, groups: ['pg-calc', 'pg-robot', 'pg-faq', 'pg-ligne'],
    groupName: { 'pg-calc': { fr: 'Calculatrice', en: 'Calculator' }, 'pg-robot': { fr: 'Robot explorateur', en: 'Explorer robot' }, 'pg-faq': { fr: 'Assistant FAQ', en: 'FAQ assistant' }, 'pg-ligne': { fr: 'Robot suiveur de ligne (7 étapes)', en: 'Line-following robot (7 steps)' } } },
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
  { key: 'compil', name: { fr: 'Compilateurs', en: 'Compilers' }, groups: ['compil'],
    groupName: { compil: { fr: 'Du texte au code exécuté', en: 'From text to running code' } } },
  { key: 'nlp', name: { fr: 'NLP et Transformers', en: 'NLP and Transformers' }, groups: ['nlp'],
    groupName: { nlp: { fr: 'Du texte au Transformer', en: 'From text to Transformer' } } },
  { key: 'quant', name: { fr: 'Informatique quantique', en: 'Quantum computing' }, groups: ['quant'],
    groupName: { quant: { fr: 'Qubits simulés', en: 'Simulated qubits' } } },
  { key: 'algo', name: { fr: 'Algorithmique avancée', en: 'Advanced algorithms' }, groups: ['algo'],
    groupName: { algo: { fr: 'Structures et graphes', en: 'Structures and graphs' } } },
  { key: 'robo', name: { fr: 'Robotique', en: 'Robotics' }, groups: ['robo', 'robo-traces', 'robo-reel'],
    groupName: { robo: { fr: 'Robot simulé', en: 'Simulated robot' }, 'robo-traces': { fr: 'Vérifier par la trace', en: 'Checking by trace' }, 'robo-reel': { fr: 'Du simulé au réel', en: 'From simulation to reality' } } },
  { key: 'ccpp', name: { fr: 'C et C++', en: 'C and C++' }, groups: ['c', 'cpp'],
    groupName: { c: { fr: 'C', en: 'C' }, cpp: { fr: 'C++', en: 'C++' } } },
  { key: 'outils', name: { fr: 'Outils IA et GitHub', en: 'AI tools and GitHub' }, groups: ['ia-api', 'git'],
    groupName: { 'ia-api': { fr: 'API et agents', en: 'APIs and agents' }, git: { fr: 'Git et GitHub', en: 'Git and GitHub' } } },
  { key: 'ethique', name: { fr: "Éthique de l'IA", en: 'AI ethics' }, groups: ['ethique'],
    groupName: { ethique: { fr: 'Biais, équité, vie privée, explicabilité', en: 'Bias, fairness, privacy, explainability' } } },
  { key: 'archi', name: { fr: 'Ordinateurs', en: 'Computers' }, groups: ['archi'],
    groupName: { archi: { fr: 'Portes, additionneur, processeur', en: 'Gates, adder, processor' } } },
  { key: 'crypto', name: { fr: 'Cryptographie', en: 'Cryptography' }, groups: ['crypto'],
    groupName: { crypto: { fr: 'Chiffres, hachage, RSA', en: 'Ciphers, hashing, RSA' } } },
  { key: 'maths', name: { fr: "Maths pour l'IA", en: 'Maths for AI' }, groups: ['maths'],
    groupName: { maths: { fr: 'Vecteurs, gradient, probabilités', en: 'Vectors, gradient, probability' } } },
]

/** Adresse lisible d'un parcours : son nom français sans accents (ex. « programmation », « ia-et-deep-learning »). */
export const trackSlug = (key: string) => {
  const t = TRACKS.find((x) => x.key === key)
  return t ? t.name.fr.replace(/\+\+/g, 'pp').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') : key
}
/** Retrouve un parcours depuis son adresse lisible ou sa clé interne. */
export const trackFromSlug = (s: string) => TRACKS.find((x) => x.key === s || trackSlug(x.key) === s)?.key ?? null
