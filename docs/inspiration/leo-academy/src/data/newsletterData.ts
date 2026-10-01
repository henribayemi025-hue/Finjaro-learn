import { NewsletterArticle } from '../types';

export const NEWSLETTER_EDITIONS: NewsletterArticle[] = [
  {
    id: 'news-4',
    issue: 4,
    date: 'Semaine en cours',
    title: 'L\'essor des Architectures Multi-Agents et le raisonnement itératif',
    readTime: '4 min',
    summary:
      'Pourquoi l\'industrie passe des simples requêtes de prompt à des systèmes multi-agents capables de déboguer leur propre code et d\'exécuter des outils.',
    content: [
      'Pendant deux ans, l\'IA générative grand public s\'est résumée à une interaction "question-réponse" ponctuelle. Aujourd\'hui, le paradigme change : nous entrons dans l\'ère des architectures agentiques.',
      'Un agent ne se contente plus de prédire le token suivant : il planifie une séquence d\'actions, appelle des APIs réelles, observe le résultat d\'exécution (logs, tests unitaires) et auto-corrige son code avant même que l\'humain ne lise la réponse.',
      'C\'est exactement le modèle adopté par Léo Academy : nos agents Maya et Idris ne sont pas de simples moteurs de recherche, mais des compagnons d\'apprentissage capables d\'observer votre éditeur de code et d\'adapter leur pédagogie à vos erreurs réelles.',
    ],
    keyInsight:
      'Les ingénieurs les plus recherchés aujourd\'hui ne sont plus ceux qui "écrivent de jolis prompts", mais ceux qui savent architecturer et orchestrer des agents fiables avec des outils d\'évaluation continue.',
    quiz: {
      question: 'Qu\'est-ce qui caractérise principalement un système agentique par rapport à un simple appel de prompt ?',
      options: [
        'Il génère du texte plus vite.',
        'Il peut exécuter des outils, observer les résultats et itérer pour corriger ses erreurs de façon autonome.',
        'Il n\'a plus besoin d\'aucun modèle de langage sous-jacent.',
        'Il coûte obligatoirement 100 fois plus cher.',
      ],
      correctIndex: 1,
      explanation:
        'Un agent dispose d\'une boucle de rétroaction (perception -> réflexion -> action avec outils -> observation -> correction).',
    },
  },
  {
    id: 'news-3',
    issue: 3,
    date: 'Il y a 1 semaine',
    title: 'Pourquoi les cursus de Harvard (CS50) et du MIT restent la référence mondiale',
    readTime: '5 min',
    summary:
      'Comprendre la mémoire, les pointeurs et la pensée computationnelle avant même de toucher aux frameworks à la mode.',
    content: [
      'À l\'heure où des dizaines de bootcamps promettent de vous rendre développeur en 3 semaines en apprenant uniquement un framework JavaScript, les cours ouverts du MIT (6.0001) et de Harvard (CS50) continuent de former les esprits les plus résilients de la tech.',
      'Leur secret ? Ils enseignent la "pensée computationnelle" : comment décomposer un problème réputé insoluble en sous-problèmes élémentaires, comment modéliser la mémoire d\'un ordinateur et comment raisonner sur la complexité algorithmique.',
      'Chez Léo Academy, nous appliquons cette même philosophie : chaque leçon vous invite à comprendre le "pourquoi" sous le capot avant de mémoriser une syntaxe.',
    ],
    keyInsight:
      'Les frameworks changent tous les trois ans. La pensée computationnelle, la logique booléenne et les structures de données restent valables pendant 40 ans.',
    quiz: {
      question: 'Quel est le bénéfice principal d\'apprendre la pensée computationnelle selon CS50 ?',
      options: [
        'Connaître par cœur toutes les fonctions d\'une bibliothèque logicielle.',
        'Développer la capacité à décomposer n\'importe quel problème complexe en étapes logiques claires et pérennes.',
        'Écrire du code sans jamais faire de tests.',
        'Remplacer complètement les ordinateurs.',
      ],
      correctIndex: 1,
      explanation:
        'La pensée computationnelle est une méthode universelle de résolution de problèmes qui transcende les langages et frameworks particuliers.',
    },
  },
  {
    id: 'news-2',
    issue: 2,
    date: 'Il y a 2 semaines',
    title: 'RAG vs Fine-Tuning : Quand utiliser quoi pour vos projets d\'IA ?',
    readTime: '6 min',
    summary:
      'Guide pragmatique pour choisir la bonne stratégie entre enrichir le contexte (RAG) ou modifier les poids du modèle.',
    content: [
      'Le dilemme classique de l\'AI Engineer : "Dois-je fine-tuner un modèle ou mettre en place un système RAG ?"',
      'Le Fine-Tuning modifie les poids d\'un réseau de neurones. C\'est l\'équivalent de lui apprendre un nouveau style d\'écriture, un vocabulaire médical spécifique ou un format de réponse JSON très strict.',
      'Le RAG (Retrieval-Augmented Generation) lui donne un livre ouvert à consulter lors de l\'examen. C\'est idéal pour les données vivantes qui changent tous les jours, les bases de connaissances privées ou les documents confidentiels.',
    ],
    keyInsight:
      'Dans 80% des cas en entreprise, le RAG est la solution la plus rapide, la moins coûteuse et la plus facile à maintenir à jour.',
    quiz: {
      question: 'Si vos données d\'entreprise changent toutes les heures (ex: stock, prix, tickets clients), quelle approche est la plus adaptée ?',
      options: [
        'Ré-entraîner le modèle de fondation depuis zéro.',
        'Fine-tuner le modèle toutes les nuits.',
        'Architecture RAG avec base vectorielle mise à jour en temps réel.',
        'Imprimer les documents sur papier.',
      ],
      correctIndex: 2,
      explanation:
        'Le RAG interroge la source de données à la volée, garantissant une information fraîche sans coût prohibitif de réentraînement.',
    },
  },
];
