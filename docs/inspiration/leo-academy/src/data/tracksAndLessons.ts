import { Track, Lesson } from '../types';

export const TRACKS: Track[] = [
  {
    id: 'programming',
    title: 'Programmation Fondamentale & Algorithmique',
    shortTitle: 'Programmation',
    icon: 'Code2',
    color: 'from-blue-500 to-indigo-600',
    badge: 'En cours • Actif',
    status: 'active',
    academicBasis: 'Inspiré des cursus ouverts Harvard CS50x & MIT 6.0001 (Non affilié / Open Source)',
    description:
      'Apprenez à penser de manière computationnelle, à structurer votre code de façon propre et rigoureuse, et à maîtriser JavaScript/TypeScript du premier affichage aux algorithmes complexes.',
    targetAudience: 'Débutants complets, étudiants et personnes en reconversion tech.',
    modulesCount: 7,
    durationHours: 24,
    syllabus: [
      {
        title: 'Module 1 : Les Fondations & Variables',
        description: 'Mémoire, typage dynamique, opérateurs arithmétiques et flux d\'exécution.',
        topics: ['Types primitifs', 'let vs const', 'Expressions et portée', 'Opérations sur chaînes'],
      },
      {
        title: 'Module 2 : Logique Conditionnelle & Décisions',
        description: 'Aiguillage d\'un programme informatique et branches booléennes.',
        topics: ['Opérateurs de comparaison', 'Tables de vérité', 'Structures if / else', 'Opérateurs ternaires'],
      },
      {
        title: 'Module 3 : Boucles, Itérations & Accumulateurs',
        description: 'Répétition maîtrisée sans boucle infinie et calculs itératifs.',
        topics: ['Boucles for & while', 'Variables accumulatrices', 'Incrémentation', 'Critères d\'arrêt'],
      },
      {
        title: 'Module 4 : Tableaux & Programmation Fonctionnelle',
        description: 'Manipulation de collections de données ordonnées.',
        topics: ['Indexation de tableaux', 'map, filter, reduce', 'Immuabilité', 'Recherche d\'éléments'],
      },
      {
        title: 'Module 5 : Objets & Modélisation de Données',
        description: 'Structuration de données complexes et structures clés-valeurs.',
        topics: ['Notations littérales', 'Accès par point et crochets', 'Destructuration', 'Parsing JSON'],
      },
      {
        title: 'Module 6 : Algorithmes & Efficacité (Notion de Big-O)',
        description: 'Résolution de problèmes et optimisation du temps de calcul.',
        topics: ['Recherche linéaire vs dichotomique', 'Deux pointeurs', 'Gestion des chaînes', 'Complexité temporelle'],
      },
      {
        title: 'Module 7 : Programmation Asynchrone & APIs',
        description: 'Gestion des opérations différées et communication réseau.',
        topics: ['Promises', 'async / await', 'Appels fetch simulés', 'Gestion des erreurs try / catch'],
      },
    ],
  },
  {
    id: 'datascience',
    title: 'Data Science & Analyse Statistique',
    shortTitle: 'Data Science',
    icon: 'BarChart3',
    color: 'from-emerald-500 to-teal-600',
    badge: 'Prochainement',
    status: 'coming-soon',
    academicBasis: 'Inspiré des cursus ouverts MIT 6.0002 & Harvard Data Science (Non affilié)',
    description:
      'Transformez des données brutes en insights décisifs. De la manipulation de données tabulaires au calcul statistique et à la visualisation percutante.',
    targetAudience: 'Analystes, curieux de données et développeurs souhaitant explorer la data.',
    modulesCount: 6,
    durationHours: 30,
    syllabus: [
      {
        title: 'Module 1 : Fondations Data & Python / Pandas',
        description: 'Nettoyage de données réelles, valeurs manquantes et types de variables.',
        topics: ['DataFrames', 'Slicing & Indexation', 'Imputation de valeurs nulles', 'Agrégations groupby'],
      },
      {
        title: 'Module 2 : Visualisation & Storytelling',
        description: 'Représenter graphiquement des distributions, corrélations et tendances temporelles.',
        topics: ['Histogrammes & Boxplots', 'Scatter plots', 'Heatmaps de corrélation', 'Tableaux de bord interactifs'],
      },
      {
        title: 'Module 3 : Statistiques Inférentielles & Tests d\'hypothèse',
        description: 'Comprendre la significativité statistique, p-valeurs et intervalles de confiance.',
        topics: ['Loi normale & théorème central limite', 'Tests A/B', 'Corrélation vs Causalité', 'Échantillonnage'],
      },
      {
        title: 'Module 4 : Modélisation Prédictive & Régression',
        description: 'Prévoir des valeurs continues et classifier des observations.',
        topics: ['Régression linéaire simple et multiple', 'Régression logistique', 'Matrice de confusion', 'Métrique R² et RMSE'],
      },
    ],
  },
  {
    id: 'ai',
    title: 'Fondements de l\'Intelligence Artificielle',
    shortTitle: 'Intelligence Artificielle',
    icon: 'Brain',
    color: 'from-purple-500 to-pink-600',
    badge: 'Prochainement',
    status: 'coming-soon',
    academicBasis: 'Inspiré des cours ouverts CS50 AI (Harvard) & MIT 6.034 (Non affilié)',
    description:
      'Plongez dans les mécanismes réels de l\'intelligence artificielle : de la recherche heuristique aux réseaux de neurones profonds et à l\'apprentissage par renforcement.',
    targetAudience: 'Développeurs et passionnés voulant comprendre le fonctionnement interne des algorithmes d\'IA.',
    modulesCount: 8,
    durationHours: 35,
    syllabus: [
      {
        title: 'Module 1 : Algorithmes de Recherche & Optimisation',
        description: 'Comment une IA trouve le meilleur chemin dans un labyrinthe ou gagne aux échecs.',
        topics: ['Recherche en largeur (BFS) et profondeur (DFS)', 'Algorithme A* et heuristiques', 'Minimax & élagage Alpha-Bêta'],
      },
      {
        title: 'Module 2 : Connaissance & Logique Propositionnelle',
        description: 'Représentation des faits et inférence logique formelle.',
        topics: ['Tables de vérité', 'Modélisation de règles', 'Résolution par réfutation'],
      },
      {
        title: 'Module 3 : Probabilités & Réseaux Bayésiens',
        description: 'Raisonner face à l\'incertitude et prédictions probabilistes.',
        topics: ['Théorème de Bayes', 'Inférence bayésienne', 'Modèles de Markov cachés (HMM)'],
      },
      {
        title: 'Module 4 : Réseaux de Neurones & Rétropropagation',
        description: 'Du perceptron simple aux couches denses et à la descente de gradient.',
        topics: ['Fonctions d\'activation (ReLU, Sigmoid)', 'Forward & Backward Pass', 'Fonctions de perte', 'Optimiseur Adam'],
      },
    ],
  },
  {
    id: 'ai-engineering',
    title: 'Ingénierie de l\'IA & Systèmes LLM (AI Engineering)',
    shortTitle: 'AI Engineering',
    icon: 'Cpu',
    color: 'from-amber-500 to-orange-600',
    badge: 'Prochainement',
    status: 'coming-soon',
    academicBasis: 'Inspiré des programmes avancés MIT GenAI & pratiques de pointe de l\'industrie (Non affilié)',
    description:
      'Construisez des applications de production intégrant des modèles de fondation : architectures RAG, bases vectorielles, orchestration d\'agents autonomes et guardrails de sécurité.',
    targetAudience: 'Ingénieurs logiciels, architectes applicatifs et tech leads.',
    modulesCount: 6,
    durationHours: 28,
    syllabus: [
      {
        title: 'Module 1 : Architectures RAG (Retrieval-Augmented Generation)',
        description: 'Connecter des modèles de langage à vos bases de connaissances privées.',
        topics: ['Chunking de documents', 'Embeddings sémantiques', 'Vector Databases (Chroma/Pinecone)', 'Re-ranking'],
      },
      {
        title: 'Module 2 : Orchestration Multi-Agents & Outils (Function Calling)',
        description: 'Concevoir des systèmes où des agents collaborent et exécutent du code ou des APIs.',
        topics: ['Tool calling & Function declarations', 'Architecture Router / Planner', 'State machines d\'agents', 'Mémoire conversationnelle'],
      },
      {
        title: 'Module 3 : Évaluation, Fine-Tuning & Alignement',
        description: 'Mesurer la fidélité des réponses, réduire les hallucinations et adapter un modèle.',
        topics: ['Frameworks d\'évaluation (Ragas/G-Eval)', 'LoRA / QLoRA', 'Prévention des injections de prompt', 'Guardrails'],
      },
    ],
  },
  {
    id: 'prompt-engineering',
    title: 'Écriture de Prompts Avancée (Prompt Engineering)',
    shortTitle: 'Prompt Engineering',
    icon: 'Sparkles',
    color: 'from-rose-500 to-red-600',
    badge: 'Prochainement',
    status: 'coming-soon',
    academicBasis: 'Inspiré des publications de recherche MIT, Stanford & OpenAI (Non affilié)',
    description:
      'L\'art et la science d\'instruire les modèles de langage avec précision : techniques Few-shot, Chain-of-Thought, contraintes de schéma strictes et décomposition de tâches cognitives.',
    targetAudience: 'Développeurs, chefs de produit, designers et professionnels de tout horizon.',
    modulesCount: 5,
    durationHours: 15,
    syllabus: [
      {
        title: 'Module 1 : Anatomie d\'un Prompt Efficace',
        description: 'Rôle, contexte, instructions impératives, délimiteurs et formats de sortie.',
        topics: ['Persona prompting', 'Délimitation XML/Markdown', 'Zero-shot vs Few-shot', 'Spécification de ton et de longueur'],
      },
      {
        title: 'Module 2 : Raisonnement & Chaînes de Pensée (Chain of Thought)',
        description: 'Forcer le modèle à réfléchir étape par étape pour résoudre des problèmes complexes.',
        topics: ['Step-by-step thinking', 'Tree of Thoughts', 'Auto-correction et vérification contradictoire'],
      },
      {
        title: 'Module 3 : Réponses Structurées & JSON Garanti',
        description: 'Piloter des APIs et des interfaces avec des sorties strictement typées.',
        topics: ['Schémas JSON stricts', 'Gestion des types imbriqués', 'Validation et parsing automatique'],
      },
    ],
  },
];

export const LESSONS: Lesson[] = [
  {
    id: 'prog-1-variables',
    trackId: 'programming',
    moduleNumber: 1,
    lessonNumber: 1,
    title: '1. Les Fondations : Variables, Expressions & Affichage',
    subtitle: 'Créer votre premier programme, déclarer des variables immuables et formater du texte.',
    difficulty: 'Débutant',
    estimatedMinutes: 15,
    academicInspiration: 'Inspiré de Harvard CS50x (Week 1 : C / Logique de mémoire) & MIT 6.0001 (Variables et types)',
    theory: {
      overview:
        'En programmation, une variable est une boîte étiquetée dans la mémoire vive (RAM) de l\'ordinateur qui stocke une valeur. Comme l\'enseigne CS50, comprendre comment un ordinateur garde en mémoire une donnée est la pierre angulaire de tout code.',
      keyPoints: [
        'const est utilisé pour déclarer une variable dont la référence ne doit jamais être réassignée (bonne pratique moderne par défaut).',
        'let permet de créer une variable réassignable lorsque sa valeur est amenée à changer.',
        'Les gabarits de chaînes (template literals avec backticks `) permettent d\'insérer directement des variables via la syntaxe ${maVariable}.',
      ],
      codeExamples: [
        {
          title: 'Déclaration et concaténation moderne',
          code: `const prenom = "Alice";
const score = 42;
const message = \`Félicitations \${prenom}, votre score est de \${score} points !\`;
console.log(message);`,
          explanation: 'L\'utilisation des backticks permet une lecture limpide sans concaténation laborieuse avec le signe +.',
        },
      ],
      commonPitfalls: [
        'Ne jamais utiliser "var" : c\'est une ancienne syntaxe sujette à des fuites de portée (scope).',
        'Tenter de réassigner une variable déclarée avec "const" provoque une erreur fatale TypeError.',
      ],
    },
    exercise: {
      instruction:
        'Créez une fonction nommée "genererBadge" qui prend deux paramètres : "nom" (une chaîne) et "xp" (un nombre). La fonction doit retourner la chaîne exacte : "[Léo Academy] Nom: <nom> | Niveau: <niveau>", où <niveau> vaut "Expert" si xp >= 100, et "Apprenti" sinon.',
      task: 'Implémentez la fonction genererBadge(nom, xp) selon les spécifications.',
      expectedBehavior:
        'genererBadge("Lina", 120) doit retourner "[Léo Academy] Nom: Lina | Niveau: Expert"',
      starterCode: `function genererBadge(nom, xp) {
  // Votre code ici :
  // Déterminez le niveau ("Expert" si xp >= 100, sinon "Apprenti")
  // Retournez le badge au format exact : "[Léo Academy] Nom: <nom> | Niveau: <niveau>"
  
}
`,
      testCases: [
        {
          description: 'Devrait retourner le niveau Expert pour xp = 150',
          testFnCode: `genererBadge("Alex", 150) === "[Léo Academy] Nom: Alex | Niveau: Expert"`,
          expected: `"[Léo Academy] Nom: Alex | Niveau: Expert"`,
        },
        {
          description: 'Devrait retourner le niveau Apprenti pour xp = 40',
          testFnCode: `genererBadge("Maya", 40) === "[Léo Academy] Nom: Maya | Niveau: Apprenti"`,
          expected: `"[Léo Academy] Nom: Maya | Niveau: Apprenti"`,
        },
        {
          description: 'Devrait retourner Expert au seuil exact de 100 xp',
          testFnCode: `genererBadge("Idris", 100) === "[Léo Academy] Nom: Idris | Niveau: Expert"`,
          expected: `"[Léo Academy] Nom: Idris | Niveau: Expert"`,
        },
      ],
      hints: [
        'Indice 1 : Vous pouvez déclarer une variable `const niveau = xp >= 100 ? "Expert" : "Apprenti";`.',
        'Indice 2 : Utilisez un template string avec les backticks : `\`[Léo Academy] Nom: \${nom} | Niveau: \${niveau}\``. N\'oubliez pas le mot-clé return !',
      ],
      solutionCode: `function genererBadge(nom, xp) {
  const niveau = xp >= 100 ? "Expert" : "Apprenti";
  return \`[Léo Academy] Nom: \${nom} | Niveau: \${niveau}\`;
}`,
      solutionExplanation:
        'Nous vérifions si xp est supérieur ou égal à 100 grâce à une condition ternaire concise. Puis nous retournons la chaîne de caractères interpolée avec les backticks.',
    },
    recommendedAgent: 'maya',
  },
  {
    id: 'prog-2-conditions',
    trackId: 'programming',
    moduleNumber: 2,
    lessonNumber: 2,
    title: '2. Logique & Conditions : Aiguiller un Programme',
    subtitle: 'Comprendre les opérateurs booléens, les seuils multiples et la prise de décision.',
    difficulty: 'Débutant',
    estimatedMinutes: 20,
    academicInspiration: 'Inspiré de MIT 6.0001 (Branching & Conditionals) & Harvard CS50',
    theory: {
      overview:
        'Sans conditions, un programme n\'exécute qu\'une suite linéaire d\'instructions. Les blocs if/else permettent à l\'ordinateur de prendre des chemins différents selon les données en entrée.',
      keyPoints: [
        'Utilisez toujours le triple égal (===) pour vérifier l\'égalité stricte en valeur et en type, évitant les coercitions implicites imprévisibles de ==.',
        'Les opérateurs logiques && (ET) et || (OU) permettent de combiner plusieurs expressions booléennes.',
        'L\'ordre des branches dans un if / else if / else compte : la première condition vraie bloque l\'évaluation des suivantes.',
      ],
      codeExamples: [
        {
          title: 'Structure de décision claire',
          code: `function evaluerNote(note) {
  if (note >= 16) {
    return "Très Bien";
  } else if (note >= 12) {
    return "Bien";
  } else {
    return "À encourager";
  }
}`,
          explanation: 'Chaque condition est testée séquentiellement.',
        },
      ],
      commonPitfalls: [
        'Attention à ne pas confondre l\'assignation simple (=) et la comparaison stricte (===).',
        'Oublier de tester les valeurs extrêmes ou négatives.',
      ],
    },
    exercise: {
      instruction:
        'Écrivez une fonction "calculerTarif(age, estEtudiant)" qui calcule le prix d\'un accès à un atelier tech. Le tarif plein est de 30€. Moins de 18 ans : 10€. Étudiants (estEtudiant === true) de 18 à 25 ans inclus : 15€. Seniors de 65 ans et plus : 20€. Tous les autres : plein tarif (30€).',
      task: 'Retournez le montant en nombre entier (ex: 15, 10, 30).',
      expectedBehavior: 'calculerTarif(21, true) doit retourner 15',
      starterCode: `function calculerTarif(age, estEtudiant) {
  // Votre code ici :
  // - Moins de 18 ans => 10
  // - De 18 à 25 ans inclus ET estEtudiant est vrai => 15
  // - 65 ans et plus => 20
  // - Sinon => 30
  
}
`,
      testCases: [
        {
          description: 'Mineur de 16 ans paye 10€',
          testFnCode: `calculerTarif(16, false) === 10`,
          expected: `10`,
        },
        {
          description: 'Étudiant de 20 ans paye 15€',
          testFnCode: `calculerTarif(20, true) === 15`,
          expected: `15`,
        },
        {
          description: 'Non-étudiant de 20 ans paye plein tarif 30€',
          testFnCode: `calculerTarif(20, false) === 30`,
          expected: `30`,
        },
        {
          description: 'Senior de 70 ans paye 20€',
          testFnCode: `calculerTarif(70, false) === 20`,
          expected: `20`,
        },
      ],
      hints: [
        'Indice 1 : Commencez par vérifier la première règle : `if (age < 18) return 10;`.',
        'Indice 2 : Pour l\'étudiant : `if (age >= 18 && age <= 25 && estEtudiant) return 15;`.',
      ],
      solutionCode: `function calculerTarif(age, estEtudiant) {
  if (age < 18) {
    return 10;
  }
  if (age >= 18 && age <= 25 && estEtudiant) {
    return 15;
  }
  if (age >= 65) {
    return 20;
  }
  return 30;
}`,
      solutionExplanation:
        'L\'approche par "garde" (early return) rend le code extrêmement lisible en évitant les imbrications complexes.',
    },
    recommendedAgent: 'maya',
  },
  {
    id: 'prog-3-boucles',
    trackId: 'programming',
    moduleNumber: 3,
    lessonNumber: 3,
    title: '3. Boucles & Accumulateurs : Répéter sans s\'épuiser',
    subtitle: 'Comprendre l\'état mutable contrôlé, les calculs factoriels et les sommes itératives.',
    difficulty: 'Débutant',
    estimatedMinutes: 20,
    academicInspiration: 'Inspiré de Harvard CS50 Week 1 (Loops) & MIT 6.0001 (Iteration & Guess-and-Check)',
    theory: {
      overview:
        'La puissance fondamentale d\'un processeur réside dans sa capacité à répéter des milliards d\'opérations sans faiblir. Une boucle standard for définit une initialisation, une condition d\'arrêt et un pas d\'incrément.',
      keyPoints: [
        'Une variable accumulatrice est déclarée avec let en dehors de la boucle pour conserver le total cumulé au fil des itérations.',
        'La condition d\'arrêt (ex: i <= n) doit impérativement devenir fausse à terme pour éviter la redoutée "boucle infinie".',
        'Les boucles for sont idéales lorsque le nombre d\'itérations est connu à l\'avance.',
      ],
      codeExamples: [
        {
          title: 'Somme des entiers de 1 à N',
          code: `function sommeJusqua(n) {
  let total = 0;
  for (let i = 1; i <= n; i++) {
    total += i;
  }
  return total;
}`,
          explanation: 'La variable total accumule chaque valeur de i à chaque tour de boucle.',
        },
      ],
      commonPitfalls: [
        'Attention à l\'erreur "off-by-one" (oublier <= au lieu de <).',
        'Oublier d\'incrémenter le compteur i++ dans une boucle while.',
      ],
    },
    exercise: {
      instruction:
        'Écrivez une fonction "calculerFactorielle(n)" qui calcule le produit de tous les entiers positifs de 1 jusqu\'à n (n!). Par convention mathématique, la factorielle de 0 vaut 1 (0! = 1). Pour n = 4, 4! = 4 × 3 × 2 × 1 = 24.',
      task: 'Retournez la factorielle de n sous forme de nombre entier.',
      expectedBehavior: 'calculerFactorielle(5) doit retourner 120',
      starterCode: `function calculerFactorielle(n) {
  // Votre code ici :
  // Cas particulier : 0! = 1
  // Sinon, multipliez tous les entiers de 1 à n
  
}
`,
      testCases: [
        {
          description: 'Factorielle de 0 vaut 1',
          testFnCode: `calculerFactorielle(0) === 1`,
          expected: `1`,
        },
        {
          description: 'Factorielle de 1 vaut 1',
          testFnCode: `calculerFactorielle(1) === 1`,
          expected: `1`,
        },
        {
          description: 'Factorielle de 4 vaut 24 (4*3*2*1)',
          testFnCode: `calculerFactorielle(4) === 24`,
          expected: `24`,
        },
        {
          description: 'Factorielle de 5 vaut 120',
          testFnCode: `calculerFactorielle(5) === 120`,
          expected: `120`,
        },
      ],
      hints: [
        'Indice 1 : Initialisez une variable accumulateur `let resultat = 1;`. Si n === 0, vous pouvez retourner 1 directement.',
        'Indice 2 : Parcourez les nombres avec une boucle `for (let i = 2; i <= n; i++) { resultat *= i; }` et retournez resultat.',
      ],
      solutionCode: `function calculerFactorielle(n) {
  if (n === 0 || n === 1) return 1;
  let resultat = 1;
  for (let i = 2; i <= n; i++) {
    resultat *= i;
  }
  return resultat;
}`,
      solutionExplanation:
        'On initialise le résultat à 1 (neutre pour la multiplication). On multiplie successivement par chaque entier de 2 jusqu\'à n.',
    },
    recommendedAgent: 'maya',
  },
  {
    id: 'prog-4-tableaux',
    trackId: 'programming',
    moduleNumber: 4,
    lessonNumber: 4,
    title: '4. Tableaux & Transformations Fonctionnelles',
    subtitle: 'Filtrer, transformer et agréger des collections de données avec map, filter et reduce.',
    difficulty: 'Intermédiaire',
    estimatedMinutes: 25,
    academicInspiration: 'Inspiré de MIT 6.0001 (Lists & Mutability) & Harvard CS50',
    theory: {
      overview:
        'En programmation moderne, plutôt que d\'écrire des boucles for impératives manuelles pour manipuler des listes, on utilise des fonctions d\'ordre supérieur qui ne modifient pas le tableau d\'origine (immuabilité).',
      keyPoints: [
        'filter(predicate) : extrait un sous-ensemble d\'éléments répondant à un critère booléen.',
        'map(transform) : produit un nouveau tableau où chaque élément a été transformé par la fonction passée en argument.',
        'reduce(accumulator, item) : replie une liste entière vers une valeur unique (ex: somme, objet récapitulatif).',
      ],
      codeExamples: [
        {
          title: 'Pipeline fonctionnel moderne',
          code: `const notes = [12, 8, 17, 19, 9, 15];
// Garder les notes >= 10 et leur ajouter 1 point de bonus
const notesBonifiees = notes
  .filter(note => note >= 10)
  .map(note => Math.min(20, note + 1));
console.log(notesBonifiees); // [13, 18, 20, 16]`,
          explanation: 'Le chaînage permet une expressivité remarquable et un code sans effet de bord.',
        },
      ],
      commonPitfalls: [
        'Confondre map et forEach : map retourne toujours un nouveau tableau, forEach ne retourne rien (undefined).',
        'Ne pas oublier le mot-clé return dans le callback si vous utilisez des accolades {}.',
      ],
    },
    exercise: {
      instruction:
        'Écrivez une fonction "filtrerEtMultiplier(nombres, seuil, facteur)" qui prend un tableau de nombres, ne conserve QUE les nombres strictement supérieurs à "seuil", et retourne un nouveau tableau où chacun de ces nombres est multiplié par "facteur".',
      task: 'Utilisez filter et map pour retourner le tableau transformé.',
      expectedBehavior:
        'filtrerEtMultiplier([5, 12, 8, 20, 3], 10, 2) doit retourner [24, 40]',
      starterCode: `function filtrerEtMultiplier(nombres, seuil, facteur) {
  // Votre code ici :
  // 1. Filtrer les nombres > seuil
  // 2. Multiplier chaque nombre restant par facteur
  
}
`,
      testCases: [
        {
          description: 'Filtre les nombres > 10 et multiplie par 2',
          testFnCode: `JSON.stringify(filtrerEtMultiplier([5, 12, 8, 20, 3], 10, 2)) === JSON.stringify([24, 40])`,
          expected: `[24, 40]`,
        },
        {
          description: 'Retourne un tableau vide si aucun nombre ne dépasse le seuil',
          testFnCode: `JSON.stringify(filtrerEtMultiplier([1, 2, 3], 10, 5)) === JSON.stringify([])`,
          expected: `[]`,
        },
        {
          description: 'Gère les nombres négatifs',
          testFnCode: `JSON.stringify(filtrerEtMultiplier([-5, 0, 10, 15], 0, 3)) === JSON.stringify([30, 45])`,
          expected: `[30, 45]`,
        },
      ],
      hints: [
        'Indice 1 : Vous pouvez chaîner directement : `return nombres.filter(n => n > seuil).map(n => n * facteur);`.',
        'Indice 2 : Assurez-vous que l\'inégalité est stricte (>) selon l\'énoncé.',
      ],
      solutionCode: `function filtrerEtMultiplier(nombres, seuil, facteur) {
  return nombres
    .filter(n => n > seuil)
    .map(n => n * facteur);
}`,
      solutionExplanation:
        'La méthode filter ne conserve que les éléments respectant n > seuil, puis map applique la multiplication à chaque élément restant.',
    },
    recommendedAgent: 'maya',
  },
  {
    id: 'prog-5-objets',
    trackId: 'programming',
    moduleNumber: 5,
    lessonNumber: 5,
    title: '5. Objets & Structures de Données Clés-Valeurs',
    subtitle: 'Modéliser des entités du monde réel et calculer des synthèses de données.',
    difficulty: 'Intermédiaire',
    estimatedMinutes: 25,
    academicInspiration: 'Inspiré de MIT 6.0001 (Dictionaries as mapping) & Harvard CS50',
    theory: {
      overview:
        'Les objets (ou dictionnaires) associent des clés uniques à des valeurs. C\'est la structure reine du web (format JSON) et la base de la modélisation de données dans les applications et pipelines d\'IA.',
      keyPoints: [
        'On accède aux propriétés d\'un objet soit par la notation par point (utilisateur.nom), soit par crochets (utilisateur["nom"]).',
        'Object.keys(), Object.values() et Object.entries() permettent de parcourir dynamiquement les propriétés d\'un objet.',
        'La destructuration { nom, age } = utilisateur permet d\'extraire directement des variables propres.',
      ],
      codeExamples: [
        {
          title: 'Compteur d\'occurrences avec un objet',
          code: `const mots = ["ia", "code", "ia", "web", "ia", "code"];
const compte = {};
for (const mot of mots) {
  compte[mot] = (compte[mot] || 0) + 1;
}
console.log(compte); // { ia: 3, code: 2, web: 1 }`,
          explanation: 'L\'utilisation d\'un dictionnaire permet un comptage en temps linéaire O(N).',
        },
      ],
      commonPitfalls: [
        'Tenter d\'accéder à une propriété sur une valeur null ou undefined déclenche une erreur fatale TypeError.',
      ],
    },
    exercise: {
      instruction:
        'Écrivez une fonction "synthetiserPanier(articles)" qui reçoit un tableau d\'objets représentant des cours ou abonnements (chaque objet a la forme `{ nom: "string", prix: number, quantite: number }`). La fonction doit retourner un objet récapitulatif avec deux propriétés : `totalArticles` (la somme des quantités) et `totalPrix` (la somme des prix × quantités).',
      task: 'Retournez l\'objet { totalArticles, totalPrix } calculé précisément.',
      expectedBehavior:
        'synthetiserPanier([{ nom: "JS", prix: 20, quantite: 2 }, { nom: "IA", prix: 50, quantite: 1 }]) doit retourner { totalArticles: 3, totalPrix: 90 }',
      starterCode: `function synthetiserPanier(articles) {
  // Votre code ici :
  // Calculez totalArticles (somme des quantite)
  // Calculez totalPrix (somme des prix * quantite)
  // Retournez l'objet { totalArticles, totalPrix }
  
}
`,
      testCases: [
        {
          description: 'Calcule correctement un panier avec 2 articles',
          testFnCode: `(() => {
  const res = synthetiserPanier([
    { nom: "JS", prix: 20, quantite: 2 },
    { nom: "IA", prix: 50, quantite: 1 }
  ]);
  return res.totalArticles === 3 && res.totalPrix === 90;
})()`,
          expected: `{ totalArticles: 3, totalPrix: 90 }`,
        },
        {
          description: 'Gère un panier vide sans planter',
          testFnCode: `(() => {
  const res = synthetiserPanier([]);
  return res.totalArticles === 0 && res.totalPrix === 0;
})()`,
          expected: `{ totalArticles: 0, totalPrix: 0 }`,
        },
        {
          description: 'Calcule avec plusieurs articles de quantités variables',
          testFnCode: `(() => {
  const res = synthetiserPanier([
    { nom: "A", prix: 10, quantite: 5 },
    { nom: "B", prix: 100, quantite: 2 }
  ]);
  return res.totalArticles === 7 && res.totalPrix === 250;
})()`,
          expected: `{ totalArticles: 7, totalPrix: 250 }`,
        },
      ],
      hints: [
        'Indice 1 : Initialisez `let totalArticles = 0; let totalPrix = 0;`.',
        'Indice 2 : Parcourez les articles avec `for (const article of articles) { totalArticles += article.quantite; totalPrix += article.prix * article.quantite; }`.',
      ],
      solutionCode: `function synthetiserPanier(articles) {
  let totalArticles = 0;
  let totalPrix = 0;

  for (const article of articles) {
    totalArticles += article.quantite;
    totalPrix += article.prix * article.quantite;
  }

  return { totalArticles, totalPrix };
}`,
      solutionExplanation:
        'Une boucle simple permet d\'accumuler simultanément les deux métriques en un seul passage (complexité O(N)).',
    },
    recommendedAgent: 'maya',
  },
  {
    id: 'prog-6-algorithmes',
    trackId: 'programming',
    moduleNumber: 6,
    lessonNumber: 6,
    title: '6. Algorithmique : Recherche, Indexation & Validation',
    subtitle: 'Résoudre un problème classique d\'entretien technique : la validation de parenthèses (Stack).',
    difficulty: 'Avancé',
    estimatedMinutes: 30,
    academicInspiration: 'Inspiré de Harvard CS50 Week 5 (Data Structures) & MIT 6.006 (Introduction to Algorithms)',
    theory: {
      overview:
        'Un algorithme est une suite finie et non ambiguë d\'instructions pour résoudre une classe de problèmes. L\'un des algorithmes fondamentaux enseignés au MIT et chez Harvard est l\'usage de la pile (Stack / LIFO : Dernier Entré, Premier Sorti).',
      keyPoints: [
        'Une Pile (Stack) s\'implémente naturellement en JavaScript avec un tableau et les méthodes .push() (empiler) et .pop() (dépiler).',
        'Pour vérifier la validité de symboles imbriqués (comme les accolades {} ou parenthèses ()), chaque ouvrant est empilé, et chaque fermant doit correspondre au sommet de la pile.',
        'Si la pile est vide à la fin de la lecture, les parenthèses sont parfaitement équilibrées.',
      ],
      codeExamples: [
        {
          title: 'Principe de la pile en JS',
          code: `const pile = [];
pile.push("(");
pile.push("[");
console.log(pile.pop()); // "[" (le dernier entré est le premier sorti)`,
          explanation: 'La structure LIFO est idéale pour traiter les structures arborescentes et les syntaxes de code.',
        },
      ],
      commonPitfalls: [
        'Oublier de vérifier si la pile est vide avant de dépiler (ce qui signifie un fermant en trop).',
        'Oublier de vérifier si la pile est vide à la fin (ce qui signifie un ouvrant non fermé).',
      ],
    },
    exercise: {
      instruction:
        'Écrivez une fonction "estParenthesageValide(chaine)" qui prend une chaîne composée uniquement des caractères "(", ")", "[", "]", "{", "}". La fonction doit retourner true si la séquence de parenthèses est valide et correctement fermée/imbriquée, et false sinon.',
      task: 'Retournez un booléen (true ou false).',
      expectedBehavior: 'estParenthesageValide("({[]})") => true, estParenthesageValide("([)]") => false',
      starterCode: `function estParenthesageValide(chaine) {
  // Votre code ici :
  // Utilisez une pile (tableau JS avec push et pop)
  // Associez chaque fermant à son ouvrant correspondant
  
}
`,
      testCases: [
        {
          description: 'Parenthèses simples valides "()"',
          testFnCode: `estParenthesageValide("()") === true`,
          expected: `true`,
        },
        {
          description: 'Imbrication complexe valide "({[]})"',
          testFnCode: `estParenthesageValide("({[]})") === true`,
          expected: `true`,
        },
        {
          description: 'Mauvais ordre d\'imbrication "([)]"',
          testFnCode: `estParenthesageValide("([)]") === false`,
          expected: `false`,
        },
        {
          description: 'Ouvrant sans fermant "("{[}"',
          testFnCode: `estParenthesageValide("({[}") === false`,
          expected: `false`,
        },
        {
          description: 'Fermant sans ouvrant ")("',
          testFnCode: `estParenthesageValide(")(") === false`,
          expected: `false`,
        },
      ],
      hints: [
        'Indice 1 : Créez un dictionnaire des paires : `const correspondances = { ")": "(", "]": "[", "}": "{" };`.',
        'Indice 2 : Parcourez chaque caractère. S\'il est dans correspondances (c\'est un fermant), dépilez le sommet et vérifiez s\'il correspond. Sinon (c\'est un ouvrant), empilez-le. À la fin, vérifiez que `pile.length === 0`.',
      ],
      solutionCode: `function estParenthesageValide(chaine) {
  const pile = [];
  const correspondances = {
    ")": "(",
    "]": "[",
    "}": "{"
  };

  for (const char of chaine) {
    if (correspondances[char]) {
      // C'est un caractère fermant
      const sommet = pile.pop();
      if (sommet !== correspondances[char]) {
        return false;
      }
    } else {
      // C'est un caractère ouvrant
      pile.push(char);
    }
  }

  return pile.length === 0;
}`,
      solutionExplanation:
        'C\'est l\'algorithme canonique enseigné à Harvard et au MIT : complexité temporelle O(N) et mémoire O(N). La pile assure que le dernier ouvrant rencontré est le premier à être refermé.',
    },
    recommendedAgent: 'maya',
  },
  {
    id: 'prog-7-async-ia',
    trackId: 'programming',
    moduleNumber: 7,
    lessonNumber: 7,
    title: '7. L\'Asynchrone & les APIs : Préparer le Terrain de l\'IA',
    subtitle: 'Comprendre async/await, les Promises et le traitement de flux de données externes.',
    difficulty: 'Avancé',
    estimatedMinutes: 25,
    academicInspiration: 'Inspiré des fondations réseau de Harvard CS50 & principes de programmation concurrente',
    theory: {
      overview:
        'Interagir avec une API de modèle d\'IA (comme Gemini ou un service distant) prend du temps : le réseau doit envoyer le prompt et recevoir les tokens. L\'asynchronisme en JavaScript empêche l\'interface de geler pendant cette attente.',
      keyPoints: [
        'Une Promise représente une valeur qui sera disponible dans le futur (en attente, résolue ou rejetée).',
        'La syntaxe async / await permet d\'écrire du code asynchrone qui ressemble visuellement à du code synchrone linéaire.',
        'Les blocs try / catch permettent de capturer proprement les erreurs de réseau ou les réponses invalides.',
      ],
      codeExamples: [
        {
          title: 'Requête asynchrone robuste',
          code: `async function chargerReponseAgent(prompt) {
  try {
    const reponse = await fetch("/api/agent", {
      method: "POST",
      body: JSON.stringify({ prompt })
    });
    const donnees = await reponse.json();
    return donnees.texte;
  } catch (erreur) {
    console.error("Échec de la requête :", erreur);
    return "Désolé, une erreur est survenue.";
  }
}`,
          explanation: 'try / catch garantit que votre application ne crashe jamais face à un aléa réseau.',
        },
      ],
      commonPitfalls: [
        'Oublier d\'ajouter async devant la fonction qui utilise await.',
        'Oublier le await devant une Promise, ce qui retourne l\'objet Promise non résolu au lieu de la donnée.',
      ],
    },
    exercise: {
      instruction:
        'Écrivez une fonction asynchrone "executerBatchPrompts(prompts, simulateurAppel)" qui reçoit une liste de prompts (tableaux de chaînes) et une fonction asynchrone "simulateurAppel(prompt)" qui prend un prompt et retourne une réponse. Votre fonction doit exécuter tous les appels en parallèle (avec Promise.all) et retourner un tableau contenant uniquement les réponses en majuscules.',
      task: 'Retournez une Promise résolue avec le tableau des réponses en majuscules.',
      expectedBehavior:
        'executerBatchPrompts(["salut", "code"], async p => `ok: ${p}`) doit retourner ["OK: SALUT", "OK: CODE"]',
      starterCode: `async function executerBatchPrompts(prompts, simulateurAppel) {
  // Votre code ici :
  // 1. Lancez simulateurAppel sur chaque prompt
  // 2. Attendez la résolution de tous les appels en parallèle avec Promise.all
  // 3. Retournez les réponses transformées en majuscules (.toUpperCase())
  
}
`,
      testCases: [
        {
          description: 'Exécute et met en majuscules les réponses du simulateur',
          testFnCode: `(async () => {
  const fauxAppel = async (p) => "echo: " + p;
  const resultat = await executerBatchPrompts(["ia", "leo"], fauxAppel);
  return JSON.stringify(resultat) === JSON.stringify(["ECHO: IA", "ECHO: LEO"]);
})()`,
          expected: `["ECHO: IA", "ECHO: LEO"]`,
        },
        {
          description: 'Gère un tableau vide de prompts',
          testFnCode: `(async () => {
  const fauxAppel = async (p) => p;
  const resultat = await executerBatchPrompts([], fauxAppel);
  return Array.isArray(resultat) && resultat.length === 0;
})()`,
          expected: `[]`,
        },
      ],
      hints: [
        'Indice 1 : Utilisez `const promesses = prompts.map(p => simulateurAppel(p));`.',
        'Indice 2 : Attendez la résolution globale avec `const reponses = await Promise.all(promesses);` puis faites `return reponses.map(r => r.toUpperCase());`.',
      ],
      solutionCode: `async function executerBatchPrompts(prompts, simulateurAppel) {
  const promesses = prompts.map(prompt => simulateurAppel(prompt));
  const reponses = await Promise.all(promesses);
  return reponses.map(reponse => reponse.toUpperCase());
}`,
      solutionExplanation:
        'Promise.all permet d\'exécuter simultanément l\'ensemble des requêtes asynchrones en un temps minimal, puis on normalise les sorties.',
    },
    recommendedAgent: 'idris',
  },
];
