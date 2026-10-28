/** Figure tracée par l'élève avec courbe(), nuage() ou barres() (affichée en SVG par la page). */
export interface Figure {
  type: 'courbe' | 'nuage' | 'barres' | 'reseau'
  titre: string
  x: (number | string)[]
  y: number[]
}

export interface RunResult {
  output: string[]
  error: string | null
  passed: boolean | null
  /** Tests réussis / total (affichés à l'élève). */
  tests?: { ok: number; total: number; detail?: boolean[] }
  figures?: Figure[]
  /** Images produites par matplotlib (PNG en data URL). */
  images?: string[]
}

const workerSrc = `
onmessage = (e) => {
  const { code, checks } = e.data
  const __out = []
  const console = { log: (...a) => __out.push(a.map(String).join(' ')) }
  try {
    const run = new Function('console', '__out', code + '\\n;return [' + checks.join(',') + ']')
    const res = run(console, __out)
    postMessage({ output: __out, error: null, passed: checks.length === 0 ? null : res.every(Boolean), tests: { ok: res.filter(Boolean).length, total: checks.length, detail: res.map(Boolean) } })
  } catch (err) {
    postMessage({ output: __out, error: String(err), passed: false })
  }
}`

/** Exécute le code de l'élève dans un Worker isolé (timeout 3 s). */
export function runCode(code: string, checks: string[]): Promise<RunResult> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(new Blob([workerSrc], { type: 'text/javascript' }))
    const w = new Worker(url)
    const done = (r: RunResult) => {
      clearTimeout(t)
      w.terminate()
      URL.revokeObjectURL(url)
      resolve(r)
    }
    const t = setTimeout(
      () => done({ output: [], error: 'Timeout (boucle infinie ?)', passed: false }),
      3000,
    )
    w.onmessage = (e) => done(e.data)
    w.onerror = (e) => done({ output: [], error: e.message, passed: false })
    w.postMessage({ code, checks })
  })
}

// ───────── Python (Pyodide, chargé à la demande depuis le CDN jsDelivr : gratuit, aucune clé) ─────────
const PYODIDE = 'https://cdn.jsdelivr.net/pyodide/v0.27.7/full/'

// Fonctions de tracé fournies à l'élève : elles ne font que mémoriser les données ; la page dessine.
const PY_HELPERS = [
  '__figs = []',
  'def _liste(v):',
  '    return [float(a) for a in v]',
  'def courbe(x, y, titre=""):',
  '    __figs.append({"type": "courbe", "titre": titre, "x": _liste(x), "y": _liste(y)})',
  'def nuage(x, y, titre=""):',
  '    __figs.append({"type": "nuage", "titre": titre, "x": _liste(x), "y": _liste(y)})',
  'def barres(etiquettes, valeurs, titre=""):',
  '    __figs.append({"type": "barres", "titre": titre, "x": [str(e) for e in etiquettes], "y": _liste(valeurs)})',
  'def reseau(tailles, activations=None, titre=""):',
  '    flat = []',
  '    for couche in (activations or []):',
  '        flat += _liste(couche)',
  '    __figs.append({"type": "reseau", "titre": titre, "x": [int(t) for t in tailles], "y": flat})',
].join('\n')

// Débogueur temporel : on enregistre, ligne après ligne, les variables simples du code de l'élève.
const PY_TRACE = [
  'import sys, json',
  '__steps = []',
  'def __fmt(v):',
  '    t = type(v).__name__',
  '    if t in ("int", "float", "str", "bool", "NoneType", "list", "tuple", "dict", "set", "ndarray"):',
  '        r = repr(v)',
  '        return r if len(r) <= 80 else r[:77] + "..."',
  '    return None',
  'def __tracer(frame, event, arg):',
  '    if frame.f_code.co_filename != "<eleve>":',
  '        return None',
  '    if event in ("line", "return"):',
  '        loc = {}',
  '        for k, v in frame.f_locals.items():',
  '            if k.startswith("_"):',
  '                continue',
  '            f = __fmt(v)',
  '            if f is not None:',
  '                loc[k] = f',
  '        __steps.append({"ligne": frame.f_lineno, "evt": event, "fn": frame.f_code.co_name, "vars": loc})',
  '        if len(__steps) > 600:',
  '            raise RuntimeError("Trop d\'étapes (600 max) : réduis la taille de l\'exemple.")',
  '    return __tracer',
  '__erreur = None',
  'try:',
  '    __c = compile(__code, "<eleve>", "exec")',
  '    sys.settrace(__tracer)',
  '    try:',
  '        exec(__c, globals())',
  '    finally:',
  '        sys.settrace(None)',
  'except BaseException as __e:',
  '    __erreur = type(__e).__name__ + ": " + str(__e)',
  '__resultat = json.dumps({"steps": __steps, "erreur": __erreur})',
].join('\n')

// Graphiques matplotlib : on les range en images pour la page (le Worker n'a pas d'écran).
const PY_CAPTURE = [
  'import io, base64, json, sys',
  '__imgs = []',
  'if "matplotlib.pyplot" in sys.modules:',
  '    import matplotlib.pyplot as __plt',
  '    for __n in __plt.get_fignums():',
  '        __b = io.BytesIO()',
  '        __plt.figure(__n).savefig(__b, format="png", dpi=110, bbox_inches="tight", facecolor="white")',
  '        __imgs.append("data:image/png;base64," + base64.b64encode(__b.getvalue()).decode())',
  '    __plt.close("all")',
  'json.dumps(__imgs)',
].join('\n')

// Terminal et notebooks : un interpréteur qui garde ses variables d'une commande à l'autre (comme IPython).
const PY_REPL = [
  'import ast',
  'def __repl(src):',
  '    tree = ast.parse(src, "<terminal>", "exec")',
  '    last = None',
  '    if tree.body and isinstance(tree.body[-1], ast.Expr):',
  '        last = ast.Expression(tree.body.pop().value)',
  '    exec(compile(tree, "<terminal>", "exec"), globals())',
  '    if last is not None:',
  '        v = eval(compile(last, "<terminal>", "eval"), globals())',
  '        if v is not None:',
  '            return repr(v)',
  '    return None',
].join('\n')

const pyWorkerSrc = `
const HELPERS = ${JSON.stringify(PY_HELPERS)}
const TRACE = ${JSON.stringify(PY_TRACE)}
const CAPTURE = ${JSON.stringify(PY_CAPTURE)}
const REPLDEF = ${JSON.stringify(PY_REPL)}
const figures = (py, ns, from, to) => { try { return JSON.parse(py.runPython('import json\\njson.dumps(__figs[' + (from || 0) + ':' + (to === undefined ? '' : to) + '])', { globals: ns })) } catch (e) { return [] } }
const nfigs = (py, ns) => { try { return py.runPython('len(__figs)', { globals: ns }) } catch (e) { return 0 } }
let py = null
let replNs = null
let ecrits = new Set()
// Les fichiers du projet (modules .py, données .csv…) sont posés dans le dossier de travail : import utils, pd.read_csv("data.csv") marchent.
const ecrireFichiers = (files) => {
  const nouveaux = new Set(Object.keys(files || {}))
  const mods = []
  for (const n of ecrits) if (!nouveaux.has(n)) { try { py.FS.unlink(n) } catch (e) { /* déjà absent */ } }
  for (const [n, c] of Object.entries(files || {})) {
    try { const i = n.lastIndexOf('/'); if (i > 0) py.FS.mkdirTree(n.slice(0, i)); py.FS.writeFile(n, c) } catch (e) { /* ignoré */ }
    if (/^[A-Za-z_][A-Za-z0-9_]*\\.py$/.test(n)) mods.push(n.slice(0, -3))
  }
  for (const n of ecrits) if (/^[A-Za-z_][A-Za-z0-9_]*\\.py$/.test(n)) mods.push(n.slice(0, -3))
  ecrits = nouveaux
  try { py.runPython('import sys\\nif "" not in sys.path: sys.path.insert(0, "")\\nfor __m in ' + JSON.stringify(mods) + ':\\n    sys.modules.pop(__m, None)') } catch (e) { /* ignoré */ }
}
// Quelques bibliothèques Python pures ne sont pas dans Pyodide mais s'installent depuis PyPI : on les installe toutes seules à l'import (liste fermée : jamais un nom tapé au hasard).
const AUTO_PIP = { seaborn: 'seaborn', tabulate: 'tabulate', tqdm: 'tqdm', faker: 'faker', xlrd: 'xlrd' }
const installerManquants = async (code) => {
  const noms = [...new Set([...code.matchAll(/^\\s*(?:import|from)\\s+([A-Za-z_][A-Za-z0-9_]*)/gm)].map((m) => m[1]))].filter((n) => AUTO_PIP[n])
  const need = noms.filter((n) => !py.runPython('import importlib.util\\nimportlib.util.find_spec("' + n + '") is not None'))
  if (!need.length) return
  try { await py.loadPackage('micropip'); const mp = py.pyimport('micropip'); await mp.install(need.map((n) => AUTO_PIP[n])) } catch (e) { /* l'import dira l'erreur */ }
}
const dernieres = (err, n) => String(err && err.message ? err.message : err).trim().split('\\n').slice(-n).join('\\n')
onmessage = async (e) => {
  const d = e.data
  try {
    if (d.type === 'init') {
      importScripts('${PYODIDE}pyodide.js')
      py = await loadPyodide({ indexURL: '${PYODIDE}' })
      postMessage({ type: 'ready' })
      return
    }
    if (d.type === 'trace') {
      const out = []
      py.setStdout({ batched: (s) => out.push(s) })
      py.setStderr({ batched: (s) => out.push(s) })
      const ns = py.globals.get('dict')()
      try {
        ecrireFichiers(d.files)
        ns.set('__code', d.code)
        py.runPython(HELPERS, { globals: ns })
        py.runPython(TRACE, { globals: ns })
        const r = JSON.parse(ns.get('__resultat'))
        postMessage({ type: 'traced', output: out, steps: r.steps, error: r.erreur })
      } catch (err) {
        postMessage({ type: 'traced', output: out, steps: [], error: String(err && err.message ? err.message : err).trim().split('\\n').slice(-2).join(' ') })
      } finally { ns.destroy() }
      return
    }
    if (d.type === 'repl') {
      const out = []
      py.setStdout({ batched: (s) => out.push(s) })
      py.setStderr({ batched: (s) => out.push(s) })
      if (!replNs) { replNs = py.globals.get('dict')(); py.runPython(REPLDEF, { globals: replNs }) }
      ecrireFichiers(d.files)
      try { await py.loadPackagesFromImports(d.code, { messageCallback: () => {}, errorCallback: () => {} }) } catch (e) { /* hors ligne */ }
      await installerManquants(d.code)
      if (/matplotlib|pyplot/.test(d.code)) { try { py.runPython('import matplotlib, warnings\\nmatplotlib.use("AGG")\\nwarnings.filterwarnings("ignore", message=".*non-interactive.*")', { globals: replNs }) } catch (e) { /* ignoré */ } }
      replNs.set('__src', d.code)
      let valeur = null, erreur = null
      try { valeur = py.runPython('__repl(__src)', { globals: replNs }) } catch (err) { erreur = dernieres(err, 3) }
      let images = []
      try { images = JSON.parse(py.runPython(CAPTURE, { globals: replNs })) } catch (e) { /* ignoré */ }
      postMessage({ type: 'repld', output: out, valeur: valeur === undefined ? null : valeur, error: erreur, images })
      return
    }
    if (d.type === 'replreset') { if (replNs) { try { replNs.destroy() } catch (e) { /* ignoré */ } replNs = null } postMessage({ type: 'resetok' }); return }
    if (d.type === 'pip') {
      try {
        await py.loadPackage('micropip')
        const mp = py.pyimport('micropip')
        await mp.install(d.pkgs)
        postMessage({ type: 'pipd', ok: true })
      } catch (err) { postMessage({ type: 'pipd', ok: false, error: dernieres(err, 2) }) }
      return
    }
    if (d.type === 'pkgs') { postMessage({ type: 'pkgsd', pkgs: Object.keys(py.loadedPackages || {}) }); return }
    if (d.type === 'load') { await py.loadPackage(d.packages); postMessage({ type: 'loaded' }); return }
    const out = []
    py.setStdout({ batched: (s) => out.push(s) })
    py.setStderr({ batched: (s) => out.push(s) })
    const ns = py.globals.get('dict')()
    try {
      // Les bibliothèques importées par le code (pandas, matplotlib, scikit-learn…) se chargent toutes seules.
      try { await py.loadPackagesFromImports(d.code, { messageCallback: () => {}, errorCallback: () => {} }) } catch (e) { /* hors ligne : l'import dira l'erreur */ }
      await installerManquants(d.code)
      ecrireFichiers(d.files)
      py.runPython(HELPERS, { globals: ns })
      if (/matplotlib|pyplot/.test(d.code)) { try { py.runPython('import matplotlib, warnings\\nmatplotlib.use("AGG")\\nwarnings.filterwarnings("ignore", message=".*non-interactive.*")', { globals: ns }) } catch (e) { /* ignoré */ } }
      py.runPython(d.code, { globals: ns })
      let images = []
      if (/matplotlib|pyplot/.test(d.code)) { try { images = JSON.parse(py.runPython(CAPTURE, { globals: ns })) } catch (e) { /* ignoré */ } }
      // Figures tracées par le code de l'élève lui-même ; sinon, celles du premier test qui en produit.
      let shown = figures(py, ns)
      ns.set('__out', out.join('\\n'))
      for (const mod of ['numpy as np', 'pandas as pd']) { try { py.runPython('import ' + mod, { globals: ns }) } catch (e) { /* bibliothèque non chargée */ } }
      py.runPython('def __raises(f, e=Exception):\\n    try:\\n        f()\\n    except e:\\n        return True\\n    return False\\ndef __exc(f):\\n    try:\\n        f()\\n    except Exception as ex:\\n        return ex\\n    return None', { globals: ns })
      const results = d.checks.map((c) => {
        const before = nfigs(py, ns)
        ns.set('__c', c)
        const ok = py.runPython('bool(eval(__c, globals()))', { globals: ns }) === true
        const after = nfigs(py, ns)
        if (!shown.length && after > before) shown = figures(py, ns, before, after)
        return ok
      })
      postMessage({ type: 'done', output: out, error: null, passed: d.checks.length === 0 ? null : results.every(Boolean), tests: { ok: results.filter(Boolean).length, total: d.checks.length, detail: results }, figures: shown, images })
    } catch (err) {
      const msg = String(err && err.message ? err.message : err).trim().split('\\n').slice(-3).join('\\n')
      postMessage({ type: 'done', output: out, error: msg, passed: false, figures: figures(py, ns) })
    } finally { ns.destroy() }
  } catch (err) {
    postMessage({ type: 'fatal', error: String(err && err.message ? err.message : err) })
  }
}`

let pyWorker: Worker | null = null
let pyReady: Promise<void> | null = null
let pyOk = false

/** Python (et ces bibliothèques) déjà chargés ? Sinon le premier lancement prend quelques secondes. */
export function pythonPret(pkgs: string[] = []) { return pyOk && pkgs.every((p) => loadedPkgs.has(p)) }

function startPython(): Promise<void> {
  if (pyReady) return pyReady
  const url = URL.createObjectURL(new Blob([pyWorkerSrc], { type: 'text/javascript' }))
  const w = new Worker(url)
  pyWorker = w
  pyReady = new Promise<void>((resolve, reject) => {
    const t = setTimeout(() => { reset(); reject(new Error('Python : chargement trop long (réseau ?)')) }, 90000)
    w.onmessage = (e) => { if (e.data.type === 'ready') { clearTimeout(t); pyOk = true; resolve() } else if (e.data.type === 'fatal') { clearTimeout(t); reset(); reject(new Error(e.data.error)) } }
    w.onerror = (e) => { clearTimeout(t); reset(); reject(new Error(e.message)) }
    w.postMessage({ type: 'init' })
  })
  return pyReady
}

function reset() { pyWorker?.terminate(); pyWorker = null; pyReady = null; pyOk = false; loadedPkgs.clear() }

/** Exécute du Python dans un Worker isolé (Pyodide). Boucle infinie : le Worker est arrêté après 20 s. */
const loadedPkgs = new Set<string>()

/** Charge numpy, pandas… à la demande (jsDelivr, gratuit) ; une seule fois par session. */
async function ensurePackages(pkgs: string[]) {
  const need = pkgs.filter((p) => !loadedPkgs.has(p))
  if (!need.length) return
  const w = pyWorker!
  await new Promise<void>((resolve, reject) => {
    const t = setTimeout(() => { reset(); loadedPkgs.clear(); reject(new Error('Python : chargement des bibliothèques trop long (réseau ?)')) }, 120000)
    w.onmessage = (e) => { if (e.data.type === 'loaded') { clearTimeout(t); need.forEach((p) => loadedPkgs.add(p)); resolve() } else if (e.data.type === 'fatal') { clearTimeout(t); reject(new Error(e.data.error)) } }
    w.onerror = (e) => { clearTimeout(t); reset(); loadedPkgs.clear(); reject(new Error(e.message)) }
    w.postMessage({ type: 'load', packages: need })
  })
}

async function runPythonBrut(code: string, checks: string[], packages: string[] = []): Promise<RunResult> {
  try { await startPython(); await ensurePackages(packages) } catch (e) { return { output: [], error: String((e as Error).message), passed: false } }
  const w = pyWorker!
  return new Promise<RunResult>((resolve) => {
    const t = setTimeout(() => { reset(); resolve({ output: [], error: 'Timeout (boucle infinie ?)', passed: false }) }, 20000)
    w.onmessage = (e) => { if (e.data.type === 'done') { clearTimeout(t); resolve({ output: e.data.output, error: e.data.error, passed: e.data.passed, tests: e.data.tests, figures: e.data.figures, images: e.data.images }) } }
    w.onerror = (e) => { clearTimeout(t); reset(); resolve({ output: [], error: e.message, passed: false }) }
    w.postMessage({ type: 'run', code, checks, files: fichiersProjet.courant })
  })
}


// ───────── Une seule demande à la fois pour l'interpréteur (lancer, terminal, installer…) ─────────
let fileAttente: Promise<unknown> = Promise.resolve()
function enfiler<T>(f: () => Promise<T>): Promise<T> {
  const p = fileAttente.then(f, f)
  fileAttente = p.catch(() => undefined)
  return p
}
export const runPython = (code: string, checks: string[], packages: string[] = []) => enfiler(() => runPythonBrut(code, checks, packages))
export const tracePython = (code: string, packages: string[] = []) => enfiler(() => tracePythonBrut(code, packages))

/** Les fichiers du projet (modules, données) vus par le code : `import utils`, `pd.read_csv("data.csv")`. */
export const fichiersProjet: { courant: Record<string, string> } = { courant: {} }
export function definirFichiers(f: Record<string, string>) { fichiersProjet.courant = f }

export interface SortieTerminal { output: string[]; valeur: string | null; error: string | null; images: string[] }
/** Terminal et cellules de notebook : les variables restent d'une commande à l'autre. */
export function terminalPython(code: string): Promise<SortieTerminal> {
  return enfiler(async () => {
    try { await startPython() } catch (e) { return { output: [], valeur: null, error: String((e as Error).message), images: [] } }
    const w = pyWorker!
    return new Promise<SortieTerminal>((resolve) => {
      const t = setTimeout(() => { reset(); resolve({ output: [], valeur: null, error: 'Timeout (boucle infinie ?)', images: [] }) }, 30000)
      w.onmessage = (e) => { if (e.data.type === 'repld') { clearTimeout(t); resolve({ output: e.data.output, valeur: e.data.valeur, error: e.data.error, images: e.data.images ?? [] }) } }
      w.onerror = (e) => { clearTimeout(t); reset(); resolve({ output: [], valeur: null, error: e.message, images: [] }) }
      w.postMessage({ type: 'repl', code, files: fichiersProjet.courant })
    })
  })
}
export function redemarrerTerminal(): Promise<void> {
  return enfiler(async () => {
    if (!pyWorker || !pyOk) return
    const w = pyWorker
    await new Promise<void>((resolve) => { w.onmessage = (e) => { if (e.data.type === 'resetok') resolve() }; w.postMessage({ type: 'replreset' }) })
  })
}
/** pip install : les paquets Python purs de PyPI, installés dans le navigateur. */
export function pipInstaller(pkgs: string[]): Promise<{ ok: boolean; error?: string }> {
  return enfiler(async () => {
    try { await startPython() } catch (e) { return { ok: false, error: String((e as Error).message) } }
    const w = pyWorker!
    return new Promise<{ ok: boolean; error?: string }>((resolve) => {
      const t = setTimeout(() => resolve({ ok: false, error: 'Timeout (réseau ?)' }), 120000)
      w.onmessage = (e) => { if (e.data.type === 'pipd') { clearTimeout(t); resolve({ ok: e.data.ok, error: e.data.error }) } }
      w.postMessage({ type: 'pip', pkgs })
    })
  })
}
/** Les bibliothèques actuellement chargées dans l'interpréteur. */
export function paquetsCharges(): Promise<string[]> {
  return enfiler(async () => {
    if (!pyWorker || !pyOk) return []
    const w = pyWorker
    return new Promise<string[]>((resolve) => { w.onmessage = (e) => { if (e.data.type === 'pkgsd') resolve(e.data.pkgs) }; w.postMessage({ type: 'pkgs' }) })
  })
}
/** Charge des bibliothèques Pyodide (numpy, pandas…) à la demande depuis le gestionnaire de paquets. */
export function chargerPaquets(noms: string[]): Promise<{ ok: boolean; error?: string }> {
  return enfiler(async () => {
    try { await startPython(); await ensurePackages(noms); return { ok: true } } catch (e) { return { ok: false, error: String((e as Error).message) } }
  })
}

/** Lance le code d'une leçon dans le bon langage. */
export function runLesson(lesson: { lang?: 'js' | 'py' | 'sql'; checks: string[]; packages?: string[]; solution?: string; sql?: { setup: string; ordre?: boolean } }, code: string): Promise<RunResult> {
  if (lesson.lang === 'sql' && lesson.sql) return runSql(code, lesson.solution ?? '', lesson.sql.setup, !!lesson.sql.ordre)
  return lesson.lang === 'py' ? runPython(code, lesson.checks, lesson.packages) : runCode(code, lesson.checks)
}

// ───────── SQL (sql.js : SQLite compilé en WebAssembly, chargé à la demande depuis jsDelivr : gratuit, aucune clé) ─────────
// Le verdict vient du code : la requête de l'élève et la solution tournent sur la même base neuve, on compare les lignes.
const SQLJS = 'https://cdn.jsdelivr.net/npm/sql.js@1.10.3/dist/'
const sqlWorkerSrc = `
let SQL = null
const table = (r) => {
  if (!r) return ['(aucune ligne)']
  const w = r.columns.map((c, i) => Math.min(24, Math.max(String(c).length, ...r.values.map((v) => String(v[i] ?? 'NULL').length))))
  const ligne = (v) => v.map((x, i) => String(x ?? 'NULL').slice(0, 24).padEnd(w[i])).join(' | ')
  return [ligne(r.columns), w.map((n) => '-'.repeat(n)).join('-+-'), ...r.values.slice(0, 50).map(ligne), ...(r.values.length > 50 ? ['… ' + r.values.length + ' lignes'] : [])]
}
const exec = (setup, code) => { const db = new SQL.Database(); try { db.run(setup); const r = db.exec(code); return r[r.length - 1] || null } finally { db.close() } }
const cle = (r, ordre) => { const rows = (r ? r.values : []).map((v) => JSON.stringify(v.map((x) => (typeof x === 'number' ? Math.round(x * 1e6) / 1e6 : x)))); return JSON.stringify(ordre ? rows : rows.sort()) }
const voir = (setup) => { const db = new SQL.Database(); try { db.run(setup); const n = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY rowid"); return (n[0] ? n[0].values : []).map((v) => { const r = db.exec('SELECT * FROM "' + v[0] + '"'); return { nom: v[0], colonnes: r[0] ? r[0].columns : [], lignes: r[0] ? r[0].values.slice(0, 50) : [], total: r[0] ? r[0].values.length : 0 } }) } finally { db.close() } }
onmessage = async (e) => {
  const { setup, code, solution, ordre, voir: veut } = e.data
  try {
    if (!SQL) { importScripts('${SQLJS}sql-wasm.js'); SQL = await initSqlJs({ locateFile: (f) => '${SQLJS}' + f }) }
    if (veut) { postMessage({ base: voir(setup) }); return }
    const r = exec(setup, code)
    const attendu = exec(setup, solution)
    postMessage({ output: table(r), error: null, passed: cle(r, ordre) === cle(attendu, ordre) })
  } catch (err) {
    postMessage({ output: [], error: String(err && err.message || err), passed: false })
  }
}`

/** Exécute une requête SQL sur une base SQLite neuve (dans un Worker, timeout 15 s la première fois : chargement). */
export function runSql(code: string, solution: string, setup: string, ordre: boolean): Promise<RunResult> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(new Blob([sqlWorkerSrc], { type: 'text/javascript' }))
    const w = new Worker(url)
    const done = (r: RunResult) => { clearTimeout(t); w.terminate(); URL.revokeObjectURL(url); resolve(r) }
    const t = setTimeout(() => done({ output: [], error: 'Timeout', passed: false }), 15000)
    w.onmessage = (e) => done(e.data)
    w.onerror = (e) => done({ output: [], error: e.message, passed: false })
    w.postMessage({ setup, code, solution, ordre })
  })
}

export interface TableVue { nom: string; colonnes: string[]; lignes: (string | number | null)[][]; total: number }

/** Les tables de la base d'une leçon SQL avec leurs lignes (50 au plus par table) : pour les montrer à l'élève avant qu'il écrive sa requête. */
export function lireBase(setup: string): Promise<TableVue[]> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(new Blob([sqlWorkerSrc], { type: 'text/javascript' }))
    const w = new Worker(url)
    const done = (r: TableVue[]) => { clearTimeout(t); w.terminate(); URL.revokeObjectURL(url); resolve(r) }
    const t = setTimeout(() => done([]), 15000)
    w.onmessage = (e) => done(Array.isArray(e.data.base) ? e.data.base : [])
    w.onerror = () => done([])
    w.postMessage({ setup, voir: true })
  })
}

export interface TraceStep { ligne: number; evt: string; fn: string; vars: Record<string, string> }
export interface TraceResult { steps: TraceStep[]; output: string[]; error: string | null }

/** Exécute le code Python en enregistrant chaque ligne (max 600 étapes) pour le rejouer pas à pas. */
async function tracePythonBrut(code: string, packages: string[] = []): Promise<TraceResult> {
  try { await startPython(); await ensurePackages(packages) } catch (e) { return { steps: [], output: [], error: String((e as Error).message) } }
  const w = pyWorker!
  return new Promise<TraceResult>((resolve) => {
    const t = setTimeout(() => { reset(); resolve({ steps: [], output: [], error: 'Timeout (boucle infinie ?)' }) }, 20000)
    w.onmessage = (e) => { if (e.data.type === 'traced') { clearTimeout(t); resolve({ steps: e.data.steps, output: e.data.output, error: e.data.error }) } }
    w.onerror = (e) => { clearTimeout(t); reset(); resolve({ steps: [], output: [], error: e.message }) }
    w.postMessage({ type: 'trace', code, files: fichiersProjet.courant })
  })
}
