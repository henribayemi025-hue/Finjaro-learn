// Défi chrono : « Que va afficher ce code ? ». Bonnes réponses calculées en exécutant le code (CPython) au moment de la génération ; mauvaises réponses écrites à la main.
export interface ChronoQ { code: string; answer: string; wrong: string[]; level: 1 | 2 | 3 }
export const chronoBank: ChronoQ[] = [
 {
  "code": "print(2 + 3 * 4)",
  "answer": "14",
  "wrong": [
   "20",
   "24",
   "9"
  ],
  "level": 1
 },
 {
  "code": "print(10 // 3)",
  "answer": "3",
  "wrong": [
   "3.33",
   "4",
   "1"
  ],
  "level": 1
 },
 {
  "code": "print(10 % 3)",
  "answer": "1",
  "wrong": [
   "3",
   "0",
   "3.3"
  ],
  "level": 1
 },
 {
  "code": "print(2 ** 3)",
  "answer": "8",
  "wrong": [
   "6",
   "5",
   "9"
  ],
  "level": 1
 },
 {
  "code": "print('ab' * 3)",
  "answer": "ababab",
  "wrong": [
   "ab3",
   "ab ab ab",
   "aaabbb"
  ],
  "level": 1
 },
 {
  "code": "print(len('Finjaro'))",
  "answer": "7",
  "wrong": [
   "6",
   "8",
   "5"
  ],
  "level": 1
 },
 {
  "code": "print('Python'[0])",
  "answer": "P",
  "wrong": [
   "y",
   "Python",
   "n"
  ],
  "level": 1
 },
 {
  "code": "print('Python'[-1])",
  "answer": "n",
  "wrong": [
   "P",
   "o",
   "erreur"
  ],
  "level": 1
 },
 {
  "code": "print('Python'[1:4])",
  "answer": "yth",
  "wrong": [
   "Pyt",
   "ytho",
   "yt"
  ],
  "level": 1
 },
 {
  "code": "x = 5\nx += 2\nprint(x)",
  "answer": "7",
  "wrong": [
   "5",
   "2",
   "52"
  ],
  "level": 1
 },
 {
  "code": "print(int('7') + 1)",
  "answer": "8",
  "wrong": [
   "71",
   "'8'",
   "erreur"
  ],
  "level": 1
 },
 {
  "code": "print('7' + '1')",
  "answer": "71",
  "wrong": [
   "8",
   "7 1",
   "erreur"
  ],
  "level": 1
 },
 {
  "code": "print(3 > 2 and 2 > 5)",
  "answer": "False",
  "wrong": [
   "True",
   "None",
   "erreur"
  ],
  "level": 1
 },
 {
  "code": "print(not True or True)",
  "answer": "True",
  "wrong": [
   "False",
   "None",
   "erreur"
  ],
  "level": 1
 },
 {
  "code": "print([1, 2, 3][1])",
  "answer": "2",
  "wrong": [
   "1",
   "3",
   "[2]"
  ],
  "level": 1
 },
 {
  "code": "print(len([1, [2, 3], 4]))",
  "answer": "3",
  "wrong": [
   "4",
   "2",
   "5"
  ],
  "level": 1
 },
 {
  "code": "x = [3, 1, 2]\nx.sort()\nprint(x)",
  "answer": "[1, 2, 3]",
  "wrong": [
   "[3, 1, 2]",
   "[3, 2, 1]",
   "None"
  ],
  "level": 1
 },
 {
  "code": "x = [3, 1, 2]\nprint(sorted(x), x)",
  "answer": "[1, 2, 3] [3, 1, 2]",
  "wrong": [
   "[1, 2, 3] [1, 2, 3]",
   "[3, 1, 2] [1, 2, 3]",
   "None [3, 1, 2]"
  ],
  "level": 2
 },
 {
  "code": "print(x := 4, x * 2)",
  "answer": "4 8",
  "wrong": [
   "4 4",
   "8 8",
   "erreur"
  ],
  "level": 2
 },
 {
  "code": "for i in range(3):\n    print(i, end=' ')",
  "answer": "0 1 2 ",
  "wrong": [
   "1 2 3 ",
   "0 1 2 3 ",
   "0 0 0 "
  ],
  "level": 1
 },
 {
  "code": "print(list(range(2, 10, 3)))",
  "answer": "[2, 5, 8]",
  "wrong": [
   "[2, 5, 8, 11]",
   "[2, 3, 4]",
   "[3, 6, 9]"
  ],
  "level": 1
 },
 {
  "code": "print(sum(range(5)))",
  "answer": "10",
  "wrong": [
   "15",
   "5",
   "4"
  ],
  "level": 1
 },
 {
  "code": "d = {'a': 1, 'b': 2}\nprint(d['b'])",
  "answer": "2",
  "wrong": [
   "1",
   "'b'",
   "erreur"
  ],
  "level": 1
 },
 {
  "code": "d = {'a': 1}\nprint(d.get('z', 0))",
  "answer": "0",
  "wrong": [
   "None",
   "erreur",
   "'z'"
  ],
  "level": 1
 },
 {
  "code": "print(len({1, 2, 2, 3}))",
  "answer": "3",
  "wrong": [
   "4",
   "2",
   "1"
  ],
  "level": 1
 },
 {
  "code": "print(type(3 / 1).__name__)",
  "answer": "float",
  "wrong": [
   "int",
   "float32",
   "double"
  ],
  "level": 2
 },
 {
  "code": "print(round(2.5), round(3.5))",
  "answer": "2 4",
  "wrong": [
   "3 4",
   "2 3",
   "3 3"
  ],
  "level": 2
 },
 {
  "code": "print(0.1 + 0.2 == 0.3)",
  "answer": "False",
  "wrong": [
   "True",
   "0.3",
   "erreur"
  ],
  "level": 2
 },
 {
  "code": "print([i * i for i in range(4)])",
  "answer": "[0, 1, 4, 9]",
  "wrong": [
   "[1, 4, 9, 16]",
   "[0, 2, 4, 6]",
   "[0, 1, 2, 3]"
  ],
  "level": 1
 },
 {
  "code": "print([x for x in range(6) if x % 2])",
  "answer": "[1, 3, 5]",
  "wrong": [
   "[0, 2, 4]",
   "[1, 3, 5, 6]",
   "[2, 4]"
  ],
  "level": 2
 },
 {
  "code": "a = [1, 2]\nb = a\nb.append(3)\nprint(a)",
  "answer": "[1, 2, 3]",
  "wrong": [
   "[1, 2]",
   "[3]",
   "[1, 2, 3, 3]"
  ],
  "level": 2
 },
 {
  "code": "a = [1, 2]\nb = a[:]\nb.append(3)\nprint(a)",
  "answer": "[1, 2]",
  "wrong": [
   "[1, 2, 3]",
   "[3]",
   "[]"
  ],
  "level": 2
 },
 {
  "code": "def f(x, y=2):\n    return x * y\nprint(f(3), f(3, 3))",
  "answer": "6 9",
  "wrong": [
   "6 6",
   "9 9",
   "3 9"
  ],
  "level": 2
 },
 {
  "code": "def f():\n    pass\nprint(f())",
  "answer": "None",
  "wrong": [
   "0",
   "pass",
   "''"
  ],
  "level": 2
 },
 {
  "code": "print('a,b,,c'.split(','))",
  "answer": "['a', 'b', '', 'c']",
  "wrong": [
   "['a', 'b', 'c']",
   "['a,b,,c']",
   "['a', 'b', ',', 'c']"
  ],
  "level": 2
 },
 {
  "code": "print('-'.join(['a', 'b', 'c']))",
  "answer": "a-b-c",
  "wrong": [
   "abc",
   "['a-b-c']",
   "a-b-c-"
  ],
  "level": 1
 },
 {
  "code": "print('Bonjour'.upper().count('O'))",
  "answer": "2",
  "wrong": [
   "1",
   "0",
   "3"
  ],
  "level": 2
 },
 {
  "code": "print(max([3, 9, 4], key=lambda x: -x))",
  "answer": "3",
  "wrong": [
   "9",
   "-9",
   "4"
  ],
  "level": 3
 },
 {
  "code": "x = 10\ndef f():\n    x = 5\nf()\nprint(x)",
  "answer": "10",
  "wrong": [
   "5",
   "None",
   "erreur"
  ],
  "level": 3
 },
 {
  "code": "print(bool([]), bool([0]))",
  "answer": "False True",
  "wrong": [
   "True True",
   "False False",
   "True False"
  ],
  "level": 2
 },
 {
  "code": "t = (1, 2, 3)\na, *b = t\nprint(b)",
  "answer": "[2, 3]",
  "wrong": [
   "[1, 2]",
   "(2, 3)",
   "3"
  ],
  "level": 3
 },
 {
  "code": "print(list(zip('ab', [1, 2, 3])))",
  "answer": "[('a', 1), ('b', 2)]",
  "wrong": [
   "[('a', 1), ('b', 2), (None, 3)]",
   "['a1', 'b2']",
   "erreur"
  ],
  "level": 3
 },
 {
  "code": "print({k: v for k, v in [('a', 1), ('a', 2)]})",
  "answer": "{'a': 2}",
  "wrong": [
   "{'a': 1}",
   "{'a': [1, 2]}",
   "erreur"
  ],
  "level": 3
 },
 {
  "code": "print(sorted('banane'))",
  "answer": "['a', 'a', 'b', 'e', 'n', 'n']",
  "wrong": [
   "['banane']",
   "'aabenn'",
   "['b', 'a', 'n', 'a', 'n', 'e']"
  ],
  "level": 2
 },
 {
  "code": "print(list(reversed([1, 2, 3])))",
  "answer": "[3, 2, 1]",
  "wrong": [
   "[1, 2, 3]",
   "None",
   "[3, 2]"
  ],
  "level": 1
 },
 {
  "code": "n = 0\nwhile n < 10:\n    n += 3\nprint(n)",
  "answer": "12",
  "wrong": [
   "9",
   "10",
   "3"
  ],
  "level": 2
 },
 {
  "code": "print(7 // 2 * 2 + 7 % 2)",
  "answer": "7",
  "wrong": [
   "8",
   "6",
   "3.5"
  ],
  "level": 3
 },
 {
  "code": "print('{:.2f}'.format(3.14159))",
  "answer": "3.14",
  "wrong": [
   "3.14159",
   "3.1",
   "3.141"
  ],
  "level": 2
 },
 {
  "code": "print(f'{2 + 2}={4}')",
  "answer": "4=4",
  "wrong": [
   "{2 + 2}={4}",
   "2 + 2=4",
   "True"
  ],
  "level": 2
 },
 {
  "code": "s = 'abc'\nprint(s[::-1])",
  "answer": "cba",
  "wrong": [
   "abc",
   "a",
   "erreur"
  ],
  "level": 1
 },
 {
  "code": "print(min('zèbre', 'arbre'))",
  "answer": "arbre",
  "wrong": [
   "zèbre",
   "a",
   "erreur"
  ],
  "level": 2
 },
 {
  "code": "x = [1, 2, 3]\nx.append([4])\nprint(len(x))",
  "answer": "4",
  "wrong": [
   "5",
   "3",
   "erreur"
  ],
  "level": 2
 },
 {
  "code": "x = [1, 2, 3]\nx.extend([4, 5])\nprint(len(x))",
  "answer": "5",
  "wrong": [
   "4",
   "3",
   "6"
  ],
  "level": 2
 },
 {
  "code": "print(any([0, '', None]), all([]))",
  "answer": "False True",
  "wrong": [
   "True False",
   "False False",
   "True True"
  ],
  "level": 3
 },
 {
  "code": "print(abs(-3) + int(-2.7))",
  "answer": "1",
  "wrong": [
   "0",
   "6",
   "-0.7"
  ],
  "level": 3
 }
]
