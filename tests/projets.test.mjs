// Projets de module : chaque solution passe ses tests, chaque code de départ échoue, chaque projet a ses indices et ses rappels.
// Lancer : npm run test:projets
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { PROJETS } from '../.test-build/projetsmodules.mjs'
import { lessons } from '../.test-build/lessons.mjs'

const PY = `import json,sys
def __raises(f, e=Exception):
    try:
        f()
    except e:
        return True
    return False
d=json.load(sys.stdin); ns={'__raises':__raises}
try:
    exec(d['code'], ns); r=all(bool(eval(c, ns)) for c in d['checks'])
except Exception as ex:
    r=False
print('1' if r else '0')`
const passe = (code, checks) => execFileSync('python3', ['-I', '-c', PY], { input: JSON.stringify({ code, checks }), encoding: 'utf8', timeout: 60000 }).trim() === '1'

let n = 0
const ok = (c, m) => { assert.ok(c, m); n++ }
const ids = new Set(lessons.map((l) => l.id))
for (const [mod, liste] of Object.entries(PROJETS)) {
  ok(liste.length >= 2, mod + ' : au moins deux variantes (un autre projet après deux échecs)')
  for (const p of liste) {
    ok(p.title.fr && p.title.en && p.explain.fr && p.explain.en, p.id + ' : textes fr/en')
    ok(p.indices && p.indices.length === 3 && p.indices.every((i) => i.fr && i.en), p.id + ' : trois indices fr/en')
    ok(p.rappels && p.rappels.length >= 2 && p.rappels.every((r) => ids.has(r)), p.id + ' : rappels = leçons qui existent')
    ok(p.checks.length >= 5, p.id + ' : au moins 5 tests')
    ok(passe(p.solution, p.checks), p.id + ' : la solution doit passer ses tests')
    ok(!passe(p.starter, p.checks), p.id + ' : le code de départ ne doit pas passer')
  }
}
console.log(`projets : ${n} vérifications passées`)
