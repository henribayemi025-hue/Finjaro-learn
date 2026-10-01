import { StudyGroup, CommunityPost } from '../types';

export const INITIAL_GROUPS: StudyGroup[] = [
  {
    id: 'grp-cs50-algo',
    name: 'CS50 & Harvard Cohorte Francophone',
    topic: 'Algorithmique & Structures de Données (Stack, Big-O)',
    trackId: 'programming',
    code: 'CS50-FR-2026',
    members: [
      { id: 'u1', name: 'Thomas D.', avatar: '👨‍💻', role: 'Fondateur du salon', isOnline: true },
      { id: 'u2', name: 'Amélie K.', avatar: '👩‍🔬', role: 'Membre actif', isOnline: true },
      { id: 'u3', name: 'Karim B.', avatar: '🧑‍🚀', role: 'Membre actif', isOnline: false },
      { id: 'u4', name: 'Sarah L.', avatar: '👩‍💻', role: 'Membre actif', isOnline: true },
    ],
    messages: [
      {
        id: 'm1',
        author: 'Thomas D.',
        text: 'Bienvenue à tous dans le salon de travail ! On est sur la leçon 6 sur les parenthèses et les piles (Stack). Qui bloque sur les cas limites ?',
        timestamp: 'Il y a 25 min',
      },
      {
        id: 'm2',
        author: 'Amélie K.',
        text: 'Moi je bloquais quand il y avait un fermant sans aucun ouvrant avant, comme `")("`.',
        timestamp: 'Il y a 18 min',
      },
      {
        id: 'm3',
        author: 'Thomas D.',
        text: 'Regarde ce que m\'a suggéré @Maya tout à l\'heure pour ce cas !',
        codeSnippet: `const sommet = pile.pop();
if (sommet !== correspondances[char]) return false;`,
        timestamp: 'Il y a 15 min',
      },
      {
        id: 'm4',
        author: 'Maya (Agente)',
        isAgent: true,
        agentAvatar: 'maya',
        text: 'Exactement Thomas et Amélie ! Quand vous faites `pile.pop()` sur un tableau vide, JavaScript renvoie `undefined`. Comme `undefined` n\'est jamais égal à votre ouvrant attendu, le test échoue et renvoie `false` au bon moment ! 🎯',
        timestamp: 'Il y a 14 min',
      },
    ],
  },
  {
    id: 'grp-mit-ai',
    name: 'MIT GenAI & Prompt Engineering Club',
    topic: 'Architectures RAG, Few-shot et Orchestration d\'agents',
    trackId: 'ai-engineering',
    code: 'MIT-AI-778',
    members: [
      { id: 'u5', name: 'Julien M.', avatar: '🧑‍💼', role: 'Organisateur', isOnline: true },
      { id: 'u6', name: 'Fatou N.', avatar: '👩‍🎓', role: 'Membre actif', isOnline: true },
    ],
    messages: [
      {
        id: 'm5',
        author: 'Julien M.',
        text: 'Salut le club ! On teste des structures de sorties JSON pour connecter un agent à un système de météo. Vous utilisez quoi comme délimiteurs ?',
        timestamp: 'Il y a 1h',
      },
      {
        id: 'm6',
        author: 'Idris (Agent)',
        isAgent: true,
        agentAvatar: 'idris',
        text: 'Bonjour Julien ! Pour les sorties JSON strictes, le standard recommandé par les chercheurs du MIT et chez Google consiste à spécifier le schéma avec un `responseSchema` strict. Cela évite d\'avoir à parser des blocs markdown ```json avec regex ! ⚡',
        timestamp: 'Il y a 55 min',
      },
    ],
  },
];

export const INITIAL_POSTS: CommunityPost[] = [
  {
    id: 'post-1',
    author: 'Clément V.',
    authorAvatar: '👨‍🎓',
    title: 'Comment bien appréhender la récursion quand on vient de la boucle for ?',
    category: 'Question de cours',
    trackId: 'programming',
    content:
      'Dans le module 3 et 6, on voit les boucles et les piles. J\'ai du mal à visualiser mentalement la pile d\'appels (call stack) lors d\'un appel récursif. Avez-vous une astuce visuelle ?',
    codeSnippet: `function countdown(n) {
  if (n <= 0) return;
  console.log(n);
  countdown(n - 1);
}`,
    upvotes: 14,
    isResolved: true,
    timestamp: 'Hier à 16:40',
    replies: [
      {
        id: 'rep-1',
        author: 'Maya (Agente)',
        isAgent: true,
        avatar: 'maya',
        text: 'Excellente question Clément ! Imagine une pile d\'assiettes dans un restaurant : chaque appel de fonction dépose une nouvelle assiette au-dessus (avec ses variables locales). Tant que tu n\'as pas atteint le cas de base (l\'assiette du bas), aucune assiette ne peut être lavée et retirée de la pile !',
        timestamp: 'Hier à 17:02',
        upvotes: 9,
      },
      {
        id: 'rep-2',
        author: 'Sophie B.',
        avatar: '👩‍💻',
        text: 'La métaphore de Maya est parfaite. Pense toujours à écrire le "cas d\'arrêt" (base case) sur la toute première ligne de ta fonction pour éviter le stack overflow !',
        timestamp: 'Hier à 17:15',
        upvotes: 5,
      },
    ],
  },
  {
    id: 'post-2',
    author: 'Inès R.',
    authorAvatar: '👩‍💻',
    title: 'Quelle différence concrète entre Embedding et Tokenisation ?',
    category: 'Question de cours',
    trackId: 'ai',
    content:
      'Je prépare le parcours Fondements de l\'IA et j\'entends souvent les deux termes côte à côte. Est-ce que l\'embedding remplace le tokenizer ?',
    upvotes: 19,
    isResolved: true,
    timestamp: 'Il y a 2 jours',
    replies: [
      {
        id: 'rep-3',
        author: 'Idris (Agent)',
        isAgent: true,
        avatar: 'idris',
        text: 'Non Inès, ils sont complémentaires et se suivent dans la chaîne ! Étape 1 : Le Tokenizer découpe votre texte en petits morceaux (mots ou sous-mots) et leur attribue un numéro entier (l\'identifiant du token). Étape 2 : L\'Embedding prend cet entier et va chercher dans une table mathématique un vecteur de nombres décimaux qui encode le sens sémantique profond du mot.',
        timestamp: 'Il y a 2 jours',
        upvotes: 16,
      },
    ],
  },
  {
    id: 'post-3',
    author: 'David L.',
    authorAvatar: '🧑‍💻',
    title: 'Mon retour d\'expérience : comment j\'ai décroché mon premier stage grâce au projet CS50/Léo Academy',
    category: 'Conseil Carrière',
    trackId: 'programming',
    content:
      'Je voulais remercier la communauté ! J\'ai utilisé le générateur de CV de la plateforme pour structurer mes projets d\'algorithmique et le fait de pouvoir expliquer en entretien comment fonctionne une Stack en O(N) a fait toute la différence face aux recruteurs.',
    upvotes: 38,
    isResolved: false,
    timestamp: 'Il y a 3 jours',
    replies: [
      {
        id: 'rep-4',
        author: 'Thomas D.',
        avatar: '👨‍💻',
        text: 'Bravo David ! Très inspirant pour tous ceux qui révisent le soir après le travail !',
        timestamp: 'Il y a 3 jours',
        upvotes: 6,
      },
    ],
  },
];
