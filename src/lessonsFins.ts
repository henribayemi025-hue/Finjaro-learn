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
  group: 'py-bases' | 'py-algo' = 'py-bases',
): Lesson => ({
  ...p, lang: 'py', group,
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

/** FIN DE MODULE · PYTHON (algorithmes et structures) : récursivité, recherche dichotomique, pile, file et classe. */
export const finsPyAlgo: Lesson[] = [
  pyFin({
    id: 'fin-pyalgo-facile', niveau: 'facile',
    title: { fr: 'Fin du module · exercice facile : la puissance', en: 'End of module · easy exercise: the power' },
    explain: {
      fr: 'Premier exercice : une fonction qui s’appelle elle-même. Elle a toujours un cas d’arrêt (ici : exposant 0) et un cas où elle se rappelle avec un problème plus petit.',
      en: 'First exercise: a function that calls itself. It always has a stopping case (here: exponent 0) and a case where it calls itself with a smaller problem.',
    },
    example: `def countdown(n):\n    if n == 0:\n        return 0\n    return n + countdown(n - 1)\n\nprint(countdown(3))  # 6`,
    task: { fr: 'Écris power(base, exp) qui renvoie base élevé à la puissance exp (exp est un entier positif ou nul), sans utiliser ** ni pow.', en: 'Write power(base, exp) that returns base raised to the power exp (exp is a whole number, zero or more), without using ** or pow.' },
    starter: `def power(base, exp):\n    # ton code ici\n    pass\n`,
    hint: { fr: 'Cas d’arrêt : exp == 0 donne 1. Sinon : base * power(base, exp - 1).', en: 'Stopping case: exp == 0 gives 1. Otherwise: base * power(base, exp - 1).' },
    solution: `def power(base, exp):\n    if exp == 0:\n        return 1\n    return base * power(base, exp - 1)`,
    checks: ['power(2, 10) == 1024', 'power(5, 0) == 1', 'power(3, 1) == 3', 'power(0, 3) == 0'],
  }, 'py-algo'),
  pyFin({
    id: 'fin-pyalgo-moyen', niveau: 'moyen',
    title: { fr: 'Fin du module · exercice moyen : chercher dans une liste triée', en: 'End of module · medium exercise: search a sorted list' },
    explain: {
      fr: 'Deuxième exercice : la recherche dichotomique. Dans une liste triée, on regarde le milieu et on jette la moitié qui ne peut pas contenir la valeur. On recommence jusqu’à trouver ou jusqu’à ce qu’il ne reste rien.',
      en: 'Second exercise: binary search. In a sorted list, look at the middle and throw away the half that cannot contain the value. Repeat until you find it or nothing is left.',
    },
    example: `items = [2, 4, 6, 8]\nmid = len(items) // 2\nprint(items[mid])  # 6`,
    task: { fr: 'Écris binary_search(items, target) qui renvoie la position (en partant de 0) de target dans la liste triée items, ou -1 s’il n’y est pas.', en: 'Write binary_search(items, target) that returns the position (starting at 0) of target in the sorted list items, or -1 if it is not there.' },
    starter: `def binary_search(items, target):\n    # ton code ici\n    pass\n`,
    hint: { fr: 'Garde deux bornes, low et high. Tant que low <= high : calcule mid, compare items[mid] à target, et avance low ou recule high.', en: 'Keep two bounds, low and high. While low <= high: compute mid, compare items[mid] with target, and move low up or high down.' },
    solution: `def binary_search(items, target):\n    low, high = 0, len(items) - 1\n    while low <= high:\n        mid = (low + high) // 2\n        if items[mid] == target:\n            return mid\n        if items[mid] < target:\n            low = mid + 1\n        else:\n            high = mid - 1\n    return -1`,
    checks: ['binary_search([1, 3, 5, 7, 9], 7) == 3', 'binary_search([1, 3, 5, 7, 9], 1) == 0', 'binary_search([1, 3, 5, 7, 9], 9) == 4', 'binary_search([1, 3, 5, 7, 9], 4) == -1', 'binary_search([], 1) == -1', 'binary_search([5], 5) == 0'],
  }, 'py-algo'),
  pyFin({
    id: 'fin-pyalgo-difficile', niveau: 'difficile',
    title: { fr: 'Fin du module · exercice difficile : parenthèses équilibrées', en: 'End of module · hard exercise: balanced brackets' },
    explain: {
      fr: 'Troisième exercice, le plus dur : une pile. On empile chaque parenthèse ouvrante ; devant une fermante, on dépile et on vérifie qu’elle ferme la bonne ouvrante. Les autres caractères sont ignorés.',
      en: 'Third exercise, the hardest: a stack. Push every opening bracket; on a closing one, pop and check that it closes the right opening one. Other characters are ignored.',
    },
    example: `stack = []\nstack.append("(")\nstack.append("[")\nprint(stack.pop())  # [`,
    task: { fr: 'Écris balanced(text) qui renvoie True si les (), [] et {} du texte sont bien ouverts et fermés dans le bon ordre, False sinon.', en: 'Write balanced(text) that returns True if the (), [] and {} in the text are opened and closed in the right order, False otherwise.' },
    starter: `def balanced(text):\n    # ton code ici\n    pass\n`,
    hint: { fr: 'Un dictionnaire {")": "(", "]": "[", "}": "{"} donne l’ouvrante attendue. Une fermante sur une pile vide est déjà une erreur. À la fin, la pile doit être vide.', en: 'A dictionary {")": "(", "]": "[", "}": "{"} gives the expected opening bracket. A closing bracket on an empty stack is already an error. At the end, the stack must be empty.' },
    solution: `def balanced(text):\n    pairs = {")": "(", "]": "[", "}": "{"}\n    stack = []\n    for ch in text:\n        if ch in "([{":\n            stack.append(ch)\n        elif ch in pairs:\n            if not stack or stack.pop() != pairs[ch]:\n                return False\n    return not stack`,
    checks: ['balanced("([]{})") is True', 'balanced("(]") is False', 'balanced("((") is False', 'balanced("") is True', 'balanced("]") is False', 'balanced("a(b)c") is True'],
  }, 'py-algo'),
  pyFin({
    id: 'fin-pyalgo-projet', niveau: 'projet',
    title: { fr: 'Projet du module : la file du guichet', en: 'Module project: the ticket queue' },
    explain: {
      fr: 'Le projet réunit le module : une classe qui garde ses données, une file (premier arrivé, premier servi), une recherche dans la liste. Tu écris la classe TicketQueue. Le code est vérifié par des tests ; une fois validé, tu peux demander l’avis de ton professeur sur ton code.',
      en: 'The project brings the module together: a class that keeps its data, a queue (first in, first out), a search in the list. You write the TicketQueue class. The code is checked by tests; once it passes, you can ask your teacher for feedback on your code.',
    },
    example: `line = []\nline.append("a")\nline.append("b")\nprint(line.pop(0))  # a`,
    task: {
      fr: 'Écris la classe TicketQueue : add(name) ajoute une personne à la fin ; next() renvoie et retire la première (None si la file est vide) ; size() renvoie le nombre de personnes ; position(name) renvoie sa place en partant de 1 (-1 si absente) ; remove(name) la retire et renvoie True (False si absente).',
      en: 'Write the TicketQueue class: add(name) adds a person at the end; next() returns and removes the first one (None if the queue is empty); size() returns the number of people; position(name) returns their place starting at 1 (-1 if absent); remove(name) removes them and returns True (False if absent).',
    },
    starter: `class TicketQueue:\n    def __init__(self):\n        # ton code ici\n        pass\n\n    def add(self, name):\n        # ton code ici\n        pass\n\n    def next(self):\n        # ton code ici\n        pass\n\n    def size(self):\n        # ton code ici\n        pass\n\n    def position(self, name):\n        # ton code ici\n        pass\n\n    def remove(self, name):\n        # ton code ici\n        pass\n`,
    hint: {
      fr: 'Garde une liste self.items créée dans __init__ (pas partagée entre les files). next utilise pop(0). position utilise items.index(name) + 1.',
      en: 'Keep a list self.items created in __init__ (not shared between queues). next uses pop(0). position uses items.index(name) + 1.',
    },
    solution: `class TicketQueue:\n    def __init__(self):\n        self.items = []\n\n    def add(self, name):\n        self.items.append(name)\n\n    def next(self):\n        if not self.items:\n            return None\n        return self.items.pop(0)\n\n    def size(self):\n        return len(self.items)\n\n    def position(self, name):\n        if name in self.items:\n            return self.items.index(name) + 1\n        return -1\n\n    def remove(self, name):\n        if name in self.items:\n            self.items.remove(name)\n            return True\n        return False`,
    checks: [
      '(lambda q: (q.add("Ana"), q.add("Bob"), q.size())[-1])(TicketQueue()) == 2',
      '(lambda q: (q.add("Ana"), q.add("Bob"), q.next())[-1])(TicketQueue()) == "Ana"',
      'TicketQueue().next() is None',
      '(lambda q: (q.add("Ana"), q.add("Bob"), q.position("Bob"))[-1])(TicketQueue()) == 2',
      'TicketQueue().position("Zed") == -1',
      '(lambda q: (q.add("Ana"), q.add("Bob"), q.next(), q.position("Bob"))[-1])(TicketQueue()) == 1',
      '(lambda q: (q.add("Ana"), q.remove("Ana"))[-1])(TicketQueue()) is True',
      'TicketQueue().remove("Zed") is False',
      '(lambda a, b: (a.add("x"), b.size())[-1])(TicketQueue(), TicketQueue()) == 0',
    ],
  }, 'py-algo'),
]
