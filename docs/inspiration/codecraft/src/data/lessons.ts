import { Lesson, Track } from '../types';

export const TRACKS: Track[] = [
  {
    id: 'js-fundamentals',
    title: 'JavaScript Moderne & Algorithmes',
    description: 'Maîtrisez les structures de données, la programmation fonctionnelle, les closures et l’asynchronisme.',
    icon: '⚡',
    level: 'Tous niveaux',
    totalLessons: 4,
    badge: 'Maître JS',
  },
  {
    id: 'live-debugging',
    title: 'Débogage & Réparation de Bugs en Direct',
    description: 'Analysez du code contenant des erreurs pièges avec l’aide de l’IA et apprenez à réparer méthodiquement.',
    icon: '🔍',
    level: 'Intermédiaire',
    totalLessons: 4,
    badge: 'Chasseur de Bugs',
  },
  {
    id: 'react-mastery',
    title: 'Architecture React & Hooks',
    description: 'Concevez des composants performants, gérez l’état complexe et bâtissez des hooks personnalisés robustes.',
    icon: '⚛️',
    level: 'Intermédiaire - Avancé',
    totalLessons: 3,
    badge: 'Pro React',
  },
];

export const LESSONS: Lesson[] = [
  {
    id: 'js-array-transform',
    trackId: 'js-fundamentals',
    title: 'Transformation de données avec Map, Filter et Reduce',
    difficulty: 'Débutant',
    language: 'javascript',
    concept: 'Programmation fonctionnelle et manipulation de collections d’objets',
    theory: `En JavaScript moderne, on évite les boucles impératives 'for' au profit de méthodes fonctionnelles d'ordre supérieur :
- \`filter(predicate)\` : Conserve uniquement les éléments satisfaisant la condition booléenne.
- \`map(transform)\` : Projette chaque élément vers une nouvelle forme sans muter l'original.
- \`reduce(accumulator, current)\` : Agrège tous les éléments en une valeur unique (somme, objet, tableau).`,
    instructions: [
      'Complétez la fonction `processOrders(orders)`',
      'Filtrez uniquement les commandes ayant le statut "delivered"',
      'Multipliez le total de chaque commande éligible par 1.20 (taxe de 20%)',
      'Retournez la somme totale arrondie à 2 décimales sous forme de nombre',
    ],
    starterCode: `// 🎯 Objectif : Calculez le chiffre d'affaires des commandes livrées avec 20% de TVA
function processOrders(orders) {
  // 1. Filtrer les commandes avec status === "delivered"
  // 2. Calculer le total TTC pour chacune
  // 3. Sommer et retourner le total arrondi à 2 décimales

  return 0;
}

// Jeu d'essai :
const sampleOrders = [
  { id: 1, total: 100, status: "delivered" },
  { id: 2, total: 50, status: "pending" },
  { id: 3, total: 200, status: "delivered" },
  { id: 4, total: 80, status: "cancelled" }
];

console.log("Résultat :", processOrders(sampleOrders));
`,
    solutionCode: `function processOrders(orders) {
  const sum = orders
    .filter(order => order.status === "delivered")
    .map(order => order.total * 1.20)
    .reduce((acc, current) => acc + current, 0);

  return Math.round(sum * 100) / 100;
}

const sampleOrders = [
  { id: 1, total: 100, status: "delivered" },
  { id: 2, total: 50, status: "pending" },
  { id: 3, total: 200, status: "delivered" },
  { id: 4, total: 80, status: "cancelled" }
];
console.log("Résultat :", processOrders(sampleOrders));`,
    hints: [
      'Commencez par `orders.filter(o => o.status === "delivered")`',
      'Dans le reduce, démarrez avec un accumulateur valant 0',
      'Pensez à Math.round(sum * 100) / 100 pour arrondir à 2 chiffres après la virgule',
    ],
    testCases: [
      {
        id: 't1',
        description: 'Doit filtrer uniquement les commandes "delivered" et appliquer +20%',
        testFunctionStr: `
          const mock = [
            { total: 100, status: "delivered" },
            { total: 50, status: "pending" },
            { total: 200, status: "delivered" }
          ];
          return processOrders(mock) === 360;
        `,
        expected: 360,
      },
      {
        id: 't2',
        description: 'Doit retourner 0 si le tableau est vide ou ne contient aucune commande livrée',
        testFunctionStr: `
          const mock = [{ total: 100, status: "cancelled" }];
          return processOrders(mock) === 0;
        `,
        expected: 0,
      },
    ],
    xp: 50,
  },
  {
    id: 'debug-typeerror-undefined',
    trackId: 'live-debugging',
    title: 'Déboguer : Uncaught TypeError cannot read properties of undefined',
    difficulty: 'Débutant',
    language: 'javascript',
    concept: 'Chaînage optionnel, gardes défensives et gestion des valeurs nullish',
    theory: `L'erreur 'TypeError: Cannot read properties of undefined' est l'erreur numéro 1 rencontrée par les développeurs JavaScript.
Elle survient lorsqu'on tente d'accéder à \`obj.user.address.city\` alors que \`user\` ou \`address\` est \`undefined\` ou \`null\`.
Solutions modernes :
- Le chaînage optionnel : \`obj?.user?.address?.city\`
- L'opérateur de coalescence des nuls : \`val ?? "Valeur par défaut"\`
- Les vérifications défensives préalables.`,
    instructions: [
      'Le code ci-dessous plante dès qu\'un utilisateur n\'a pas renseigné son profil complet.',
      'Activez l\'assistant IA pour analyser l\'erreur ou observez la console.',
      'Sécurisez la fonction `getUserCity(user)` pour qu\'elle ne plante JAMAIS et retourne "Ville inconnue" si le chemin est absent.',
    ],
    starterCode: `// ⚠️ Ce code provoque une erreur d'exécution quand les données sont incomplètes !
function getUserCity(user) {
  // BUG : Si address est absent, user.address.city provoque une exception fatale !
  return user.address.city;
}

const userA = { name: "Alice", address: { city: "Paris", zip: "75001" } };
const userB = { name: "Bob" }; // Pas d'adresse renseignée !

console.log("Ville de Alice :", getUserCity(userA));

try {
  console.log("Ville de Bob :", getUserCity(userB));
} catch (err) {
  console.error("💥 ERREUR ATTRAPÉE :", err.message);
  console.log("👉 Cliquez sur 'Analyser avec l'IA' pour voir l'explication et la correction !");
}
`,
    solutionCode: `function getUserCity(user) {
  // Utilisation sécurisée du chaînage optionnel (?.) et de la coalescence nulle (??)
  return user?.address?.city ?? "Ville inconnue";
}

const userA = { name: "Alice", address: { city: "Paris", zip: "75001" } };
const userB = { name: "Bob" };

console.log("Ville de Alice :", getUserCity(userA));
console.log("Ville de Bob :", getUserCity(userB));`,
    hints: [
      'Utilisez `user?.address?.city` pour éviter que JavaScript ne lance une exception',
      'Ajoutez `?? "Ville inconnue"` pour fournir la valeur de secours demandée',
    ],
    testCases: [
      {
        id: 'tb1',
        description: 'Retourne la ville quand l\'objet complet est fourni',
        testFunctionStr: `
          return getUserCity({ address: { city: "Lyon" } }) === "Lyon";
        `,
        expected: 'Lyon',
      },
      {
        id: 'tb2',
        description: 'Retourne "Ville inconnue" sans planter si user.address est manquant',
        testFunctionStr: `
          return getUserCity({ name: "Luc" }) === "Ville inconnue";
        `,
        expected: 'Ville inconnue',
      },
      {
        id: 'tb3',
        description: 'Gère le cas où user est null ou undefined',
        testFunctionStr: `
          return getUserCity(null) === "Ville inconnue";
        `,
        expected: 'Ville inconnue',
      },
    ],
    xp: 60,
  },
  {
    id: 'debug-async-promise',
    trackId: 'live-debugging',
    title: 'Déboguer : Promesses non attendues & Async/Await',
    difficulty: 'Intermédiaire',
    language: 'javascript',
    concept: 'Cycle de vie asynchrone de l’Event Loop et résolution de promesses',
    theory: `Une promesse non résolue retourne un objet \`Promise { <pending> }\` au lieu de la donnée attendue.
Si vous tentez d'accéder aux propriétés sans \`await\` ou \`.then()\`, vous obtenez \`undefined\` ou des comportements erratiques.
Règles d'or :
- Une fonction qui fait un appel asynchrone doit être déclarée avec le mot-clé \`async\`
- Tout appel de fonction retournant une Promesse doit être précédé de \`await\`
- Toujours entourer le code sensible avec \`try ... catch\` pour capturer les rejets.`,
    instructions: [
      'Exécutez le code : observez pourquoi la fonction retourne `[object Promise]` ou plante.',
      'Modifiez la fonction `fetchUserData(id)` pour qu\'elle soit `async` et utilise `await`.',
      'Ajoutez un bloc `try / catch` qui retourne `{ error: "Utilisateur introuvable" }` si l\'id est négatif.',
    ],
    starterCode: `// ⚠️ Ce code tente d'extraire des données asynchrones de façon synchrone !
function simulateApiCall(id) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (id > 0) resolve({ id, name: "Membre #" + id, role: "Développeur" });
      else reject(new Error("ID invalide"));
    }, 100);
  });
}

// BUG : La fonction n'est pas asynchrone et n'attend pas la réponse !
function fetchUserData(id) {
  const data = simulateApiCall(id);
  // data est encore une Promesse en attente, pas l'objet résolu !
  return data;
}

const userPromise = fetchUserData(42);
console.log("Valeur retournée immédiatement (inattendue) :", userPromise);
`,
    solutionCode: `function simulateApiCall(id) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (id > 0) resolve({ id, name: "Membre #" + id, role: "Développeur" });
      else reject(new Error("ID invalide"));
    }, 50);
  });
}

async function fetchUserData(id) {
  try {
    const data = await simulateApiCall(id);
    return data;
  } catch (err) {
    return { error: "Utilisateur introuvable" };
  }
}

fetchUserData(42).then(res => console.log("Données reçues proprement :", res));`,
    hints: [
      'Déclarez `async function fetchUserData(id)`',
      'Attendez la réponse avec `const data = await simulateApiCall(id);`',
    ],
    testCases: [
      {
        id: 'tas1',
        description: 'Retourne une promesse résolue avec les données utilisateur',
        testFunctionStr: `
          const p = fetchUserData(10);
          return (p instanceof Promise);
        `,
        expected: true,
      },
    ],
    xp: 75,
  },
  {
    id: 'js-closure-counter',
    trackId: 'js-fundamentals',
    title: 'Créer un gestionnaire d\'état avec les Closures',
    difficulty: 'Intermédiaire',
    language: 'javascript',
    concept: 'Encapsulation, portée lexicale et variables privées',
    theory: `Une closure (fermeture) est la combinaison d'une fonction et de l'environnement lexical dans lequel elle a été déclarée.
Cela permet de créer des variables véritablement privées, inaccessibles depuis l'extérieur sauf via les méthodes exposées :
\`\`\`js
function createStore(initial) {
  let state = initial; // Variable privée et protégée
  return {
    get: () => state,
    set: (v) => { state = v; }
  };
}
\`\`\``,
    instructions: [
      'Créez une fonction `createCounter(initialValue = 0)`',
      'Elle doit encapsuler une variable privée `count`',
      'Elle doit retourner un objet avec 4 méthodes :',
      '- `increment()` : ajoute 1 et retourne la nouvelle valeur',
      '- `decrement()` : soustrait 1 et retourne la nouvelle valeur',
      '- `reset()` : réinitialise à initialValue et retourne la valeur',
      '- `getValue()` : retourne la valeur courante sans la modifier',
    ],
    starterCode: `// 🎯 Objectif : Implémentez un compteur sécurisé via une closure
function createCounter(initialValue = 0) {
  // Votre variable privée ici

  return {
    increment() {},
    decrement() {},
    reset() {},
    getValue() {}
  };
}

const counter = createCounter(10);
console.log("Initial :", counter.getValue());
`,
    solutionCode: `function createCounter(initialValue = 0) {
  let count = initialValue;

  return {
    increment: () => ++count,
    decrement: () => --count,
    reset: () => {
      count = initialValue;
      return count;
    },
    getValue: () => count
  };
}

const counter = createCounter(10);
console.log("Initial :", counter.getValue());
console.log("Après increment :", counter.increment());`,
    hints: [
      'Déclarez `let count = initialValue;` à l\'intérieur de `createCounter`',
      'Chaque méthode peut lire et muter `count` grâce à la fermeture lexicale',
    ],
    testCases: [
      {
        id: 'tc1',
        description: 'La méthode increment doit ajouter 1 à chaque appel',
        testFunctionStr: `
          const c = createCounter(5);
          return c.increment() === 6 && c.increment() === 7;
        `,
        expected: true,
      },
      {
        id: 'tc2',
        description: 'La méthode reset doit réinitialiser à la valeur de départ',
        testFunctionStr: `
          const c = createCounter(20);
          c.increment();
          c.increment();
          return c.reset() === 20 && c.getValue() === 20;
        `,
        expected: true,
      },
    ],
    xp: 65,
  },
  {
    id: 'react-custom-hook',
    trackId: 'react-mastery',
    title: 'Concevoir un Hook Personnalisé : useDebounce',
    difficulty: 'Avancé',
    language: 'javascript',
    concept: 'Optimisation des performances React et debounce d’événements',
    theory: `Un debounce permet de retarder l'exécution d'une fonction coûteuse (ex: appel API de recherche) jusqu'à ce qu'un certain délai se soit écoulé depuis la dernière frappe au clavier de l'utilisateur.
En React, un hook \`useDebounce(value, delay)\` maintient une valeur interne mise à jour par un \`setTimeout\` nettoyé via la fonction de retour de \`useEffect\`.`,
    instructions: [
      'Implémentez la logique pure de debounce dans la fonction `debounce(fn, delay)`',
      'Si plusieurs appels se produisent avant le délai, seul le dernier doit être exécuté',
      'Testez le comportement avec le simulateur d\'appels rapides',
    ],
    starterCode: `// 🎯 Objectif : Créez une fonction utilitaire de debounce robuste
function debounce(fn, delay) {
  let timerId = null;

  return function(...args) {
    // Annuler le timer précédent si un nouvel appel survient
    // Relancer un nouveau timer de durée 'delay'
  };
}

// Test rapide :
let callCount = 0;
const logSearch = debounce((query) => {
  callCount++;
  console.log("🔎 Recherche effectuée pour :", query, "(Appel #" + callCount + ")");
}, 200);

logSearch("re");
logSearch("rea");
logSearch("react"); // Seul cet appel final doit s'exécuter !
`,
    solutionCode: `function debounce(fn, delay) {
  let timerId = null;

  return function(...args) {
    if (timerId) clearTimeout(timerId);
    timerId = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}

let callCount = 0;
const logSearch = debounce((query) => {
  callCount++;
  console.log("🔎 Recherche effectuée pour :", query);
}, 100);

logSearch("r");
logSearch("re");
logSearch("react");`,
    hints: [
      'Pensez à `clearTimeout(timerId)` si timerId existe déjà',
      'Stockez l\'identifiant retourné par `setTimeout` dans `timerId`',
    ],
    testCases: [
      {
        id: 'tdeb1',
        description: 'Doit retourner une fonction appelable',
        testFunctionStr: `
          const debounced = debounce(() => {}, 100);
          return typeof debounced === 'function';
        `,
        expected: true,
      },
    ],
    xp: 80,
  },
];
