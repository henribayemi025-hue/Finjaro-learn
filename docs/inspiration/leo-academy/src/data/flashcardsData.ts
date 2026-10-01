import { Flashcard } from '../types';

export const FLASHCARDS: Flashcard[] = [
  {
    id: 'fc-1',
    category: 'JavaScript Fondations',
    trackId: 'programming',
    question: 'Quelle est la différence fondamentale entre let et const en JavaScript moderne ?',
    answer:
      '`const` empêche la réassignation de la variable (son identifiant ne peut pointer vers un autre objet). Cependant, si la variable contient un objet ou un tableau, ses propriétés internes restent mutables. `let` autorise la réassignation ultérieure.',
    codeSnippet: `const config = { theme: "dark" };
config.theme = "light"; // Valide !
// config = {}; // TypeError: Assignment to constant variable.`,
    keyTakeaway: 'Privilégier const par défaut, et n\'utiliser let que lorsqu\'une réassignation est expressément prévue.',
  },
  {
    id: 'fc-2',
    category: 'Programmation Fonctionnelle',
    trackId: 'programming',
    question: 'Quelle est la différence entre .map() et .forEach() sur un tableau ?',
    answer:
      '`.map()` crée et retourne TOUJOURS un nouveau tableau de même longueur contenant les éléments transformés. `.forEach()` se contente d\'exécuter une fonction pour chaque élément et retourne toujours `undefined` (utilisé pour les effets de bord).',
    codeSnippet: `const doubles = [1, 2, 3].map(x => x * 2); // [2, 4, 6]
const rien = [1, 2, 3].forEach(x => console.log(x)); // undefined`,
    keyTakeaway: 'Ne jamais utiliser .map() si vous ne consommez pas le tableau retourné.',
  },
  {
    id: 'fc-3',
    category: 'Algorithmique & Complexité',
    trackId: 'programming',
    question: 'Que signifie une complexité en O(1), O(N) et O(log N) ?',
    answer:
      '- O(1) : Temps constant, indépendant du volume de données (ex: accès direct par index dans un tableau ou clé d\'objet).\n- O(N) : Temps linéaire proportionnel au nombre d\'éléments (ex: recherche simple dans une liste non triée).\n- O(log N) : Temps logarithmique, l\'espace de recherche est divisé par deux à chaque étape (ex: recherche dichotomique).',
    keyTakeaway: 'La recherche dichotomique O(log N) permet de trouver un élément parmi 1 milliard en seulement ~30 opérations !',
  },
  {
    id: 'fc-4',
    category: 'Asynchrone & Web',
    trackId: 'programming',
    question: 'Comment fonctionne Promise.all() et quel est son comportement en cas d\'erreur ?',
    answer:
      '`Promise.all(iterable)` lance toutes les promesses en parallèle et attend que toutes soient résolues pour renvoyer le tableau des résultats. Attention : si UNE SEULE promesse est rejetée, l\'ensemble du Promise.all est immédiatement rejeté (comportement "fail-fast"). Pour attendre toutes les promesses même en cas d\'échec, on utilise `Promise.allSettled()`.',
    codeSnippet: `const [users, posts] = await Promise.all([
  fetchUsers(),
  fetchPosts()
]);`,
    keyTakeaway: 'Idéal pour paralléliser des appels API indépendants et diviser par 2 ou 3 le temps de chargement.',
  },
  {
    id: 'fc-5',
    category: 'Intelligence Artificielle',
    trackId: 'ai',
    question: 'Qu\'est-ce qu\'un Embedding en IA et pourquoi est-il crucial ?',
    answer:
      'Un embedding est une représentation vectorielle (une liste de nombres flottants dans un espace à plusieurs centaines ou milliers de dimensions) qui encode le sens sémantique d\'un texte, d\'une image ou d\'un code. Deux concepts proches sémantiquement auront des vecteurs très proches (distance cosinus faible).',
    keyTakeaway: 'C\'est la brique fondamentale qui permet aux moteurs RAG de retrouver des documents pertinents sans simple recherche par mot-clé.',
  },
  {
    id: 'fc-6',
    category: 'Ingénierie de l\'IA (AI Engineering)',
    trackId: 'ai-engineering',
    question: 'Quelles sont les 4 étapes clés d\'un pipeline RAG (Retrieval-Augmented Generation) ?',
    answer:
      '1. Ingestion & Chunking : Découpage des documents en morceaux cohérents.\n2. Vectorisation : Calcul des embeddings pour chaque chunk via un modèle dédié.\n3. Recherche sémantique (Retrieval) : Récupération des k chunks les plus proches de la question de l\'utilisateur dans une base vectorielle.\n4. Synthèse (Generation) : Injection des chunks dans le prompt du LLM comme contexte de vérité.',
    keyTakeaway: 'Le RAG élimine les hallucinations factuelles et permet d\'interroger des données privées récentes sans ré-entraîner de modèle.',
  },
  {
    id: 'fc-7',
    category: 'Prompt Engineering',
    trackId: 'prompt-engineering',
    question: 'Qu\'est-ce que le "Chain of Thought" (CoT) et quand l\'activer ?',
    answer:
      'Le Chain of Thought consiste à demander explicitement au modèle d\'expliciter son raisonnement pas-à-pas (ex: "Pense étape par étape avant de conclure") plutôt que de donner la réponse finale immédiatement. Cela permet au modèle d\'utiliser ses tokens de raisonnement pour vérifier ses hypothèses et évite des erreurs de logique arithmétique ou symbolique.',
    keyTakeaway: 'Indispensable pour tout problème de code, de mathématiques ou de déduction logique complexe.',
  },
  {
    id: 'fc-8',
    category: 'Data Science',
    trackId: 'datascience',
    question: 'Pourquoi la corrélation n\'implique-t-elle pas la causalité ?',
    answer:
      'Deux variables peuvent être fortement corrélées sans que l\'une ne cause l\'autre, souvent à cause d\'une troisième variable cachée (variable confondante) ou d\'une simple coïncidence statistique. Par exemple, la vente de glaces et les attaques de requins sont corrélées en été parce qu\'il fait chaud et que les gens se baignent davantage, pas parce que manger une glace attire les requins !',
    keyTakeaway: 'Toujours mener des expériences contrôlées (tests A/B) pour prouver un lien de cause à effet.',
  },
];
