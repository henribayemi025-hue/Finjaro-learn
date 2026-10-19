// Vérifie les exercices qui ont une version anglaise (lessonsEn.ts) et ceux de fin de module (lessonsFins.ts) :
// la solution passe ses tests, le code de départ échoue. Python via python3, JavaScript via Function (mêmes règles que le runner).
// Lancer : npm run test:exos
import { lessons } from '../.test-build/lessons.mjs'
import { execFileSync } from 'node:child_process'

const PY = `import json,sys
def __raises(f, e=Exception):
    try:
        f()
    except e:
        return True
    return False
def __exc(f):
    try:
        f()
    except Exception as ex:
        return ex
    return None
d=json.load(sys.stdin); ns={'__raises':__raises,'__exc':__exc}
try:
    exec(d['code'], ns); r=all(bool(eval(c, ns)) for c in d['checks'])
except Exception:
    r=False
print('1' if r else '0')`

const passe = (l, code, checks) => {
  if (l.lang === 'py') return execFileSync('python3', ['-I', '-c', PY], { input: JSON.stringify({ code, checks }) }).toString().trim() === '1'
  const __out = []; const console = { log: (...a) => __out.push(a.map(String).join(' ')) }
  try { return new Function('console', '__out', code + '\n;return [' + checks.join(',') + ']')(console, __out).every(Boolean) } catch { return false }
}

let n = 0, ko = 0
for (const l of lessons) {
  const cas = []
  if (l.en) cas.push(['en', l.en.solution, l.en.starter, l.en.checks])
  if (l.niveau) cas.push(['fin', l.solution, l.starter, l.checks])
  for (const [quoi, sol, dep, checks] of cas) {
    n++
    const a = passe(l, sol, checks), b = passe(l, dep, checks)
    if (!a || b) { ko++; console.log(`ÉCHEC ${l.id} (${quoi}) : solution ${a ? 'passe' : 'ÉCHOUE'}, départ ${b ? 'PASSE' : 'échoue'}`) }
  }
}
console.log(`exercices : ${n - ko}/${n} vérifiés`)
process.exit(ko ? 1 : 0)
