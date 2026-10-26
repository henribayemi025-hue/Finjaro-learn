import assert from 'node:assert/strict'
import { controlerPython, constatsEnTexte } from '../.test-build/lint.mjs'
let n = 0
const ok = (c, m) => { assert.ok(c, m); n++ }
const noms = (a) => a.map((x) => x.nom).sort().join(',')
// le cas de Beau : « multiply » créée et jamais utilisée, « somme » utilisée sans être créée
let c = controlerPython('multiply = 0\nfor i in range(1,6):\n    somme += i\n    print("sum"+ str(somme))')
ok(noms(c.indefinis) === 'somme', 'somme est augmentée (+=) sans avoir été créée : erreur : ' + noms(c.indefinis))
ok(noms(c.inutilises) === 'multiply', 'multiply jamais utilisée : ' + noms(c.inutilises))
c = controlerPython('total = 0\nfor i in range(5):\n    total = total + i\nprint(somme)')
ok(noms(c.indefinis) === 'somme', 'somme jamais définie : ' + noms(c.indefinis))
ok(c.indefinis[0].ligne === 4, 'ligne 4')
c = controlerPython('def carre(x):\n    return x * x\nprint(carre(3), f"{carre(2)} et {y}")\nz = [k * 2 for k in range(3)]\nprint(z)')
ok(noms(c.indefinis) === 'y', 'f-string : y inconnue, k connue : ' + noms(c.indefinis))
c = controlerPython('import math\nfrom random import randint as r\nprint(math.sqrt(4), r(1, 2), len("x"))\n# somme dans un commentaire\ns = "somme dans un texte"\nprint(s)')
ok(noms(c.indefinis) === '' && noms(c.inutilises) === '', 'imports, commentaires, textes : ' + noms(c.indefinis) + ' / ' + noms(c.inutilises))
c = controlerPython('def f(a, b=2, *args, **kw):\n    return a + b\nprint(f(1, b=3))')
ok(noms(c.indefinis) === '', 'arguments nommés : ' + noms(c.indefinis))
ok(/jamais définis/.test(constatsEnTexte(controlerPython('print(inconnue)'), 'fr')) && /never defined/.test(constatsEnTexte(controlerPython('print(inconnue)'), 'en')), 'texte fr/en')
console.log(`lint : ${n} vérifications passées`)
