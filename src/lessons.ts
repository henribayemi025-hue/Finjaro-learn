import type { Lang } from './i18n'
import { pyLessons } from './lessonsPy'

type T = Record<Lang, string>

export interface Lesson {
  id: string
  title: T
  explain: T
  example: string
  task: T
  starter: string
  hint: T
  solution: string
  /** Expressions évaluées après le code de l'élève ; toutes doivent être vraies. */
  checks: string[]
  /** Langage de l'exercice (JavaScript par défaut). */
  lang?: 'js' | 'py'
  /** Section du parcours Programmation dans la liste des leçons. */
  group?: 'js' | 'py-bases' | 'py-algo'
}

const jsLessons: Lesson[] = [
  {
    id: 'afficher',
    title: { fr: 'Afficher un message', en: 'Print a message' },
    explain: {
      fr: "Un programme est une liste d'ordres donnés à l'ordinateur. Le plus simple : lui dire d'afficher du texte avec console.log(...). Le texte va entre guillemets.",
      en: 'A program is a list of orders given to the computer. The simplest one: tell it to show text with console.log(...). Text goes between quotes.',
    },
    example: `console.log("Bonjour le monde")`,
    task: {
      fr: 'Affiche exactement : Bonjour Finjaro',
      en: 'Print exactly: Bonjour Finjaro',
    },
    starter: `// écris ton code ici\n`,
    hint: {
      fr: 'Copie l\'exemple et remplace le texte entre guillemets.',
      en: 'Copy the example and replace the text between quotes.',
    },
    solution: `console.log("Bonjour Finjaro")`,
    checks: ['__out.join("\\n").trim() === "Bonjour Finjaro"'],
  },
  {
    id: 'variables',
    title: { fr: 'Les variables', en: 'Variables' },
    explain: {
      fr: "Une variable est une boîte avec un nom, qui garde une valeur. On la crée avec let : let age = 30. Ensuite on peut l'utiliser ou la changer.",
      en: 'A variable is a named box that holds a value. Create it with let: let age = 30. Then you can use or change it.',
    },
    example: `let prenom = "Beau"\nlet age = 30\nconsole.log(prenom)\nconsole.log(age + 1)`,
    task: {
      fr: 'Crée une variable total qui vaut 12 + 8, puis affiche-la.',
      en: 'Create a variable total equal to 12 + 8, then print it.',
    },
    starter: `let total = \n`,
    hint: {
      fr: 'let total = 12 + 8 puis console.log(total).',
      en: 'let total = 12 + 8 then console.log(total).',
    },
    solution: `let total = 12 + 8\nconsole.log(total)`,
    checks: ['typeof total !== "undefined" && total === 20', '__out.join("\\n").trim() === "20"'],
  },
  {
    id: 'conditions',
    title: { fr: 'Les conditions', en: 'Conditions' },
    explain: {
      fr: "Une condition permet de choisir : if (...) { ... } else { ... }. Le code entre accolades ne s'exécute que si la condition est vraie.",
      en: 'A condition lets the program choose: if (...) { ... } else { ... }. The code in braces runs only if the condition is true.',
    },
    example: `function estMajeur(age) {\n  if (age >= 18) {\n    return "oui"\n  } else {\n    return "non"\n  }\n}\nconsole.log(estMajeur(20))`,
    task: {
      fr: 'Écris une fonction signe(n) qui renvoie "positif" si n est plus grand que 0, sinon "negatif".',
      en: 'Write a function signe(n) that returns "positif" if n is greater than 0, otherwise "negatif".',
    },
    starter: `function signe(n) {\n  \n}\n`,
    hint: {
      fr: 'Utilise if (n > 0) { return "positif" } puis else { return "negatif" }.',
      en: 'Use if (n > 0) { return "positif" } then else { return "negatif" }.',
    },
    solution: `function signe(n) {\n  if (n > 0) {\n    return "positif"\n  } else {\n    return "negatif"\n  }\n}`,
    checks: ['signe(5) === "positif"', 'signe(-3) === "negatif"', 'signe(0) === "negatif"'],
  },
  {
    id: 'boucles',
    title: { fr: 'Les boucles', en: 'Loops' },
    explain: {
      fr: "Une boucle répète une action. for (let i = 1; i <= 3; i++) { ... } s'exécute 3 fois, avec i qui vaut 1, puis 2, puis 3.",
      en: 'A loop repeats an action. for (let i = 1; i <= 3; i++) { ... } runs 3 times, with i equal to 1, then 2, then 3.',
    },
    example: `for (let i = 1; i <= 3; i++) {\n  console.log("Tour " + i)\n}`,
    task: {
      fr: 'Écris une fonction somme(n) qui renvoie 1 + 2 + ... + n.',
      en: 'Write a function somme(n) that returns 1 + 2 + ... + n.',
    },
    starter: `function somme(n) {\n  let total = 0\n  \n  return total\n}\n`,
    hint: {
      fr: 'Dans la boucle, ajoute i à total : total = total + i.',
      en: 'Inside the loop, add i to total: total = total + i.',
    },
    solution: `function somme(n) {\n  let total = 0\n  for (let i = 1; i <= n; i++) {\n    total = total + i\n  }\n  return total\n}`,
    checks: ['somme(3) === 6', 'somme(10) === 55', 'somme(0) === 0'],
  },
]

export const lessons: Lesson[] = [...jsLessons.map((l) => ({ ...l, lang: 'js' as const, group: 'js' as const })), ...pyLessons]
