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

/**
 * FIN DE MODULE · PYTHON (bases). Même modèle que JavaScript : trois exercices (facile, moyen, difficile) puis un projet,
 * vérifiés par le code (python via Pyodide dans le navigateur, python3 dans `npm run test:exos`).
 * Les noms de fonctions sont en anglais pour que le code soit identique dans les deux langues ; seule la consigne change.
 */
const enPy = (starter: string) => starter.replaceAll('# ton code ici', '# your code here')

const pyFin = (
  p: Pick<Lesson, 'id' | 'niveau' | 'title' | 'explain' | 'task' | 'hint' | 'example' | 'solution' | 'checks'> & { starter: string },
): Lesson => ({
  ...p, lang: 'py', group: 'py-bases',
  en: { starter: enPy(p.starter), example: p.example, solution: p.solution, checks: p.checks },
})

export const finsPy: Lesson[] = [
  pyFin({
    id: 'fin-py-facile', niveau: 'facile',
    title: { fr: 'Fin du module · exercice facile : l’aire', en: 'End of module · easy exercise: the area' },
    explain: {
      fr: 'Premier exercice de fin de module. Une fonction reçoit deux valeurs, les combine, et rend le résultat avec return.',
      en: 'First end-of-module exercise. A function receives two values, combines them, and gives the result back with return.',
    },
    example: `def add(a, b):\n    return a + b\n\nprint(add(2, 3))  # 5`,
    task: { fr: 'Écris area(width, height) qui renvoie la largeur multipliée par la hauteur.', en: 'Write area(width, height) that returns the width multiplied by the height.' },
    starter: `def area(width, height):\n    # ton code ici\n    pass\n`,
    hint: { fr: 'Une seule ligne : return width * height', en: 'One line: return width * height' },
    solution: `def area(width, height):\n    return width * height`,
    checks: ['area(3, 4) == 12', 'area(0, 5) == 0', 'area(2.5, 2) == 5.0'],
  }),
  pyFin({
    id: 'fin-py-moyen', niveau: 'moyen',
    title: { fr: 'Fin du module · exercice moyen : compter les pairs', en: 'End of module · medium exercise: count the even numbers' },
    explain: {
      fr: 'Deuxième exercice : une liste, une boucle et une condition ensemble. Un nombre est pair quand le reste de sa division par 2 vaut 0 : n % 2 == 0.',
      en: 'Second exercise: a list, a loop and a condition together. A number is even when the remainder of its division by 2 is 0: n % 2 == 0.',
    },
    example: `count = 0\nfor n in [5, 8, 9]:\n    if n > 6:\n        count += 1\nprint(count)  # 2`,
    task: { fr: 'Écris count_even(numbers) qui renvoie combien de nombres pairs contient la liste.', en: 'Write count_even(numbers) that returns how many even numbers the list contains.' },
    starter: `def count_even(numbers):\n    # ton code ici\n    pass\n`,
    hint: { fr: 'Pars de 0, parcours la liste, et ajoute 1 quand n % 2 == 0. Attention aux négatifs : -2 est pair.', en: 'Start at 0, loop over the list, and add 1 when n % 2 == 0. Mind the negatives: -2 is even.' },
    solution: `def count_even(numbers):\n    count = 0\n    for n in numbers:\n        if n % 2 == 0:\n            count += 1\n    return count`,
    checks: ['count_even([1, 2, 3, 4]) == 2', 'count_even([]) == 0', 'count_even([2, 4, 6]) == 3', 'count_even([-2, -1]) == 1'],
  }),
  pyFin({
    id: 'fin-py-difficile', niveau: 'difficile',
    title: { fr: 'Fin du module · exercice difficile : compter les mots', en: 'End of module · hard exercise: count the words' },
    explain: {
      fr: 'Troisième exercice, le plus dur : du texte, une boucle et un dictionnaire qu’on remplit. Les majuscules ne comptent pas : « Le » et « le » sont le même mot. text.split() coupe sur les espaces.',
      en: 'Third exercise, the hardest: text, a loop and a dictionary you fill in. Capital letters do not matter: “The” and “the” are the same word. text.split() cuts on spaces.',
    },
    example: `counts = {}\ncounts["a"] = counts.get("a", 0) + 1\ncounts["a"] = counts.get("a", 0) + 1\nprint(counts)  # {'a': 2}`,
    task: {
      fr: 'Écris word_count(text) qui renvoie un dictionnaire : chaque mot (en minuscules) associé au nombre de fois où il apparaît.',
      en: 'Write word_count(text) that returns a dictionary: each word (in lowercase) mapped to the number of times it appears.',
    },
    starter: `def word_count(text):\n    # ton code ici\n    pass\n`,
    hint: { fr: 'Passe le texte en minuscules avec text.lower(), parcours text.split(), et utilise counts.get(mot, 0) + 1.', en: 'Lowercase the text with text.lower(), loop over text.split(), and use counts.get(word, 0) + 1.' },
    solution: `def word_count(text):\n    counts = {}\n    for word in text.lower().split():\n        counts[word] = counts.get(word, 0) + 1\n    return counts`,
    checks: ['word_count("a b a") == {"a": 2, "b": 1}', 'word_count("The the THE") == {"the": 3}', 'word_count("") == {}', 'word_count("x  y") == {"x": 1, "y": 1}'],
  }),
  pyFin({
    id: 'fin-py-projet', niveau: 'projet',
    title: { fr: 'Projet du module : le carnet de dépenses', en: 'Module project: the expense notebook' },
    explain: {
      fr: 'Le projet réunit tout le module : dictionnaires, boucles, conditions et fonctions. Un carnet est un dictionnaire {nom: montant}. Tu écris trois fonctions qui marchent ensemble. Le code est vérifié par des tests ; une fois validé, tu peux demander l’avis de ton professeur sur ton code.',
      en: 'The project brings the whole module together: dictionaries, loops, conditions and functions. A notebook is a dictionary {name: amount}. You write three functions that work together. The code is checked by tests; once it passes, you can ask your teacher for feedback on your code.',
    },
    example: `notebook = {"rent": 500, "food": 200}\nprint(sum(notebook.values()))  # 700`,
    task: {
      fr: '1) total(expenses) renvoie la somme des montants (0 si le carnet est vide). 2) biggest(expenses) renvoie le nom de la plus grosse dépense (None si le carnet est vide). 3) report(expenses) renvoie une liste de lignes "nom: montant", de la plus grosse dépense à la plus petite.',
      en: '1) total(expenses) returns the sum of the amounts (0 if the notebook is empty). 2) biggest(expenses) returns the name of the biggest expense (None if the notebook is empty). 3) report(expenses) returns a list of "name: amount" lines, from the biggest expense to the smallest.',
    },
    starter: `def total(expenses):\n    # ton code ici\n    pass\n\ndef biggest(expenses):\n    # ton code ici\n    pass\n\ndef report(expenses):\n    # ton code ici\n    pass\n`,
    hint: {
      fr: 'total : sum(expenses.values()). biggest : pense au cas vide d’abord. report : sorted(expenses.items(), key=lambda p: p[1], reverse=True) donne les paires dans le bon ordre.',
      en: 'total: sum(expenses.values()). biggest: handle the empty case first. report: sorted(expenses.items(), key=lambda p: p[1], reverse=True) gives the pairs in the right order.',
    },
    solution: `def total(expenses):\n    return sum(expenses.values())\n\ndef biggest(expenses):\n    if not expenses:\n        return None\n    best = None\n    for name in expenses:\n        if best is None or expenses[name] > expenses[best]:\n            best = name\n    return best\n\ndef report(expenses):\n    pairs = sorted(expenses.items(), key=lambda p: p[1], reverse=True)\n    return [name + ": " + str(amount) for name, amount in pairs]`,
    checks: [
      'total({"a": 5, "b": 10}) == 15', 'total({}) == 0',
      'biggest({"a": 5, "b": 10}) == "b"', 'biggest({}) is None', 'biggest({"x": 3}) == "x"',
      'report({"a": 5, "b": 10}) == ["b: 10", "a: 5"]', 'report({}) == []',
    ],
  }),
]
