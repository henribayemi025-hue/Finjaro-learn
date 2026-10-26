// Parcours « Recherche en IA » : chaque solution passe ses tests, chaque code de départ échoue.
// Lancer : npm run test:recherche
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { lessons } from '../.test-build/lessons.mjs'

const PY = `import json,sys
d=json.load(sys.stdin); ns={}
try:
    exec(d['code'], ns); r=all(bool(eval(c, ns)) for c in d['checks'])
except Exception:
    r=False
print('1' if r else '0')`
const passe = (code, checks) => execFileSync('python3', ['-I', '-c', PY], { input: JSON.stringify({ code, checks }), encoding: 'utf8' }).trim() === '1'

let n = 0
const ok = (c, m) => { assert.ok(c, m); n++ }
const rech = lessons.filter((l) => l.group === 'rech')
ok(rech.length >= 8, 'au moins 8 leçons de recherche : ' + rech.length)
for (const l of rech) {
  ok(l.title.fr && l.title.en && l.explain.fr && l.explain.en, l.id + ' : textes fr/en')
  if (l.lecture) { ok(l.lecture.fr.length === l.lecture.en.length && l.lecture.fr.length >= 6, l.id + ' : lecture fr/en'); continue }
  ok(passe(l.solution, l.checks), l.id + ' : la solution doit passer ses tests')
  ok(!passe(l.starter, l.checks), l.id + ' : le code de départ ne doit pas passer')
}
const projet = rech.find((l) => l.niveau === 'projet')
ok(projet && projet.id === 'rech-projet', 'un projet de fin de parcours')
console.log(`recherche : ${n} vérifications passées`)
