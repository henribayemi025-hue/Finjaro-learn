import type { Lesson } from './lessons'

/**
 * FIN DE MODULE (Beau, 14/10 : « à la fin du module, trois exercices, facile, milieu et dur, puis un projet complet validé par l'IA »).
 * Même format que les leçons : le runner exécute les vérifications (le code décide, jamais le modèle) ;
 * pour le projet, l'agent ne fait que commenter le code une fois les vérifications passées.
 * Module de référence : JavaScript. Les autres modules suivent le même modèle (à écrire, relus avant publication).
 */
export const finsLessons: Lesson[] = [
  {
    id: 'fin-js-facile', niveau: 'facile', lang: 'js', group: 'js',
    title: { fr: 'Fin du module · exercice facile : le double', en: 'End of module · easy exercise: double it' },
    explain: {
      fr: 'Premier exercice de fin de module. Il reprend les variables et les fonctions : une fonction reçoit une valeur et en renvoie une autre avec return.',
      en: 'First end-of-module exercise. It uses variables and functions: a function receives a value and gives back another one with return.',
    },
    example: `function triple(n) {\n  return n * 3\n}\nconsole.log(triple(2)) // 6`,
    task: { fr: 'Écris double(n) qui renvoie n multiplié par 2.', en: 'Write double(n) that returns n multiplied by 2.' },
    starter: `function double(n) {\n  // ton code ici\n}\n`,
    hint: { fr: 'Une seule ligne suffit : return n * 2', en: 'One line is enough: return n * 2' },
    solution: `function double(n) {\n  return n * 2\n}`,
    checks: ['double(4) === 8', 'double(0) === 0', 'double(-3) === -6'],
  },
  {
    id: 'fin-js-moyen', niveau: 'moyen', lang: 'js', group: 'js',
    title: { fr: 'Fin du module · exercice moyen : compter les pairs', en: 'End of module · medium exercise: count the even numbers' },
    explain: {
      fr: 'Deuxième exercice : une boucle et une condition ensemble. Un nombre est pair quand le reste de sa division par 2 vaut 0 : n % 2 === 0.',
      en: 'Second exercise: a loop and a condition together. A number is even when the remainder of its division by 2 is 0: n % 2 === 0.',
    },
    example: `let compte = 0\nfor (let i = 1; i <= 4; i++) {\n  if (i > 2) compte = compte + 1\n}\nconsole.log(compte) // 2`,
    task: { fr: 'Écris pairs(n) qui renvoie combien de nombres pairs il y a de 1 à n.', en: 'Write pairs(n) that returns how many even numbers there are from 1 to n.' },
    starter: `function pairs(n) {\n  // ton code ici\n}\n`,
    hint: { fr: 'Pars de 0, parcours i de 1 à n, et ajoute 1 quand i % 2 === 0.', en: 'Start at 0, loop i from 1 to n, and add 1 when i % 2 === 0.' },
    solution: `function pairs(n) {\n  let c = 0\n  for (let i = 1; i <= n; i++) if (i % 2 === 0) c++\n  return c\n}`,
    checks: ['pairs(10) === 5', 'pairs(1) === 0', 'pairs(7) === 3', 'pairs(0) === 0'],
  },
  {
    id: 'fin-js-difficile', niveau: 'difficile', lang: 'js', group: 'js',
    title: { fr: 'Fin du module · exercice difficile : FizzBuzz', en: 'End of module · hard exercise: FizzBuzz' },
    explain: {
      fr: 'Troisième exercice, le plus dur : boucle, conditions dans le bon ordre, et un tableau qu’on remplit avec push. L’ordre des conditions compte : 15 est multiple de 3 et de 5.',
      en: 'Third exercise, the hardest: a loop, conditions in the right order, and an array filled with push. The order of the conditions matters: 15 is a multiple of both 3 and 5.',
    },
    example: `const t = []\nt.push(1)\nt.push("Fizz")\nconsole.log(t) // [1, "Fizz"]`,
    task: {
      fr: 'Écris fizzbuzz(n) qui renvoie un tableau des nombres de 1 à n, où les multiples de 3 deviennent "Fizz", ceux de 5 "Buzz", ceux de 3 et 5 "FizzBuzz".',
      en: 'Write fizzbuzz(n) that returns an array of the numbers from 1 to n, where multiples of 3 become "Fizz", of 5 "Buzz", of both 3 and 5 "FizzBuzz".',
    },
    starter: `function fizzbuzz(n) {\n  const resultat = []\n  // ton code ici\n  return resultat\n}\n`,
    hint: { fr: 'Teste d’abord i % 15 === 0, puis i % 3, puis i % 5 ; sinon pousse i lui-même.', en: 'Test i % 15 === 0 first, then i % 3, then i % 5; otherwise push i itself.' },
    solution: `function fizzbuzz(n) {\n  const r = []\n  for (let i = 1; i <= n; i++) r.push(i % 15 === 0 ? "FizzBuzz" : i % 3 === 0 ? "Fizz" : i % 5 === 0 ? "Buzz" : i)\n  return r\n}`,
    checks: ['JSON.stringify(fizzbuzz(5)) === JSON.stringify([1, 2, "Fizz", 4, "Buzz"])', 'fizzbuzz(15)[14] === "FizzBuzz"', 'fizzbuzz(0).length === 0'],
  },
  {
    id: 'fin-js-projet', niveau: 'projet', lang: 'js', group: 'js',
    title: { fr: 'Projet du module : la petite caisse', en: 'Module project: the small till' },
    explain: {
      fr: 'Le projet réunit tout le module : variables, conditions, boucles et fonctions. Tu écris trois fonctions qui marchent ensemble. Le code est vérifié par des tests ; une fois validé, tu peux demander le retour de ton prof sur ton code.',
      en: 'The project brings the whole module together: variables, conditions, loops and functions. You write three functions that work together. The code is checked by tests; once it passes, you can ask your teacher for feedback on your code.',
    },
    example: `function somme(liste) {\n  let s = 0\n  for (const x of liste) s = s + x\n  return s\n}`,
    task: {
      fr: '1) total(prix) renvoie la somme d’un tableau de prix. 2) remise(montant) retire 10 % quand le montant dépasse 10000, sinon le laisse tel quel. 3) ticket(prix) affiche chaque prix sur une ligne, puis « Total : X » avec la remise appliquée.',
      en: '1) total(prices) returns the sum of an array of prices. 2) remise(amount) takes off 10% when the amount is over 10000, otherwise leaves it unchanged. 3) ticket(prices) prints each price on its own line, then “Total : X” with the discount applied.',
    },
    starter: `function total(prix) {\n  // ton code ici\n}\n\nfunction remise(montant) {\n  // ton code ici\n}\n\nfunction ticket(prix) {\n  // ton code ici\n}\n`,
    hint: {
      fr: 'ticket utilise les deux autres : parcours le tableau avec console.log, puis console.log("Total : " + remise(total(prix))).',
      en: 'ticket uses the other two: loop over the array with console.log, then console.log("Total : " + remise(total(prix))).',
    },
    solution: `function total(prix) {\n  let s = 0\n  for (const p of prix) s += p\n  return s\n}\nfunction remise(m) {\n  return m > 10000 ? m * 0.9 : m\n}\nfunction ticket(prix) {\n  for (const p of prix) console.log(p)\n  console.log("Total : " + remise(total(prix)))\n}`,
    checks: [
      'total([100, 200]) === 300', 'total([]) === 0', 'remise(5000) === 5000', 'remise(20000) === 18000', 'remise(10000) === 10000',
      '(() => { const n = __out.length; ticket([100, 250]); const l = __out.splice(n); return l.join("\\n") === "100\\n250\\nTotal : 350" })()',
      '(() => { const n = __out.length; ticket([6000, 6000]); const l = __out.splice(n); return l[l.length - 1] === "Total : 10800" })()',
    ],
  },
]
