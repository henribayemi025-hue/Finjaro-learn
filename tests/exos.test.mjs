// Vérifie les exercices qui ont une version anglaise (lessonsEn.ts), ceux de fin de module (lessonsFins.ts) et le parcours SQL :
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

const SQL = `import json,sys,sqlite3
d=json.load(sys.stdin)
def run(code):
    db=sqlite3.connect(':memory:'); db.executescript(d['setup'])
    cur=db.cursor(); rows=None
    for st in [x for x in code.split(';') if x.strip()]:
        cur.execute(st); rows=cur.fetchall() if cur.description else rows
    return [json.dumps([round(v,6) if isinstance(v,float) else v for v in r]) for r in (rows or [])]
try:
    a=run(d['code']); b=run(d['solution'])
    r = a==b if d['ordre'] else sorted(a)==sorted(b)
except Exception:
    r=False
print('1' if r else '0')`

const passe = (l, code, checks) => {
  if (l.lang === 'sql') return execFileSync('python3', ['-I', '-c', SQL], { input: JSON.stringify({ code, solution: l.solution, setup: l.sql.setup, ordre: !!l.sql.ordre }) }).toString().trim() === '1'
  if (l.lang === 'py') return execFileSync('python3', ['-I', '-c', PY], { input: JSON.stringify({ code, checks }) }).toString().trim() === '1'
  const __out = []; const console = { log: (...a) => __out.push(a.map(String).join(' ')) }
  try { return new Function('console', '__out', code + '\n;return [' + checks.join(',') + ']')(console, __out).every(Boolean) } catch { return false }
}

let n = 0, ko = 0
for (const l of lessons) {
  const cas = []
  if (l.en) cas.push(['en', l.en.solution, l.en.starter, l.en.checks])
  if (l.niveau || l.lang === 'sql') cas.push([l.lang === 'sql' ? 'sql' : 'fin', l.solution, l.lang === 'sql' ? 'SELECT name FROM products WHERE id = 1;' : l.starter, l.checks])
  if (l.lang === 'sql' && l.sql.setupEn) cas.push(['sql-en', l.solution, 'SELECT name FROM products WHERE id = 1;', l.checks, { ...l, sql: { ...l.sql, setup: l.sql.setupEn } }])
  for (const [quoi, sol, dep, checks, autre] of cas) {
    n++
    const x = autre ?? l
    const a = passe(x, sol, checks), b = passe(x, dep, checks)
    if (!a || b) { ko++; console.log(`ÉCHEC ${l.id} (${quoi}) : solution ${a ? 'passe' : 'ÉCHOUE'}, départ ${b ? 'PASSE' : 'échoue'}`) }
  }
}
console.log(`exercices : ${n - ko}/${n} vérifiés`)
process.exit(ko ? 1 : 0)
