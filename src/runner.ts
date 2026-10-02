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
  figures?: Figure[]
}

const workerSrc = `
onmessage = (e) => {
  const { code, checks } = e.data
  const __out = []
  const console = { log: (...a) => __out.push(a.map(String).join(' ')) }
  try {
    const run = new Function('console', '__out', code + '\\n;return [' + checks.join(',') + ']')
    const res = run(console, __out)
    postMessage({ output: __out, error: null, passed: checks.length === 0 ? null : res.every(Boolean) })
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

const pyWorkerSrc = `
const HELPERS = ${JSON.stringify(PY_HELPERS)}
const TRACE = ${JSON.stringify(PY_TRACE)}
const figures = (py, ns, from, to) => { try { return JSON.parse(py.runPython('import json\\njson.dumps(__figs[' + (from || 0) + ':' + (to === undefined ? '' : to) + '])', { globals: ns })) } catch (e) { return [] } }
const nfigs = (py, ns) => { try { return py.runPython('len(__figs)', { globals: ns }) } catch (e) { return 0 } }
let py = null
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
    if (d.type === 'load') { await py.loadPackage(d.packages); postMessage({ type: 'loaded' }); return }
    const out = []
    py.setStdout({ batched: (s) => out.push(s) })
    py.setStderr({ batched: (s) => out.push(s) })
    const ns = py.globals.get('dict')()
    try {
      py.runPython(HELPERS, { globals: ns })
      py.runPython(d.code, { globals: ns })
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
      postMessage({ type: 'done', output: out, error: null, passed: d.checks.length === 0 ? null : results.every(Boolean), figures: shown })
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

export async function runPython(code: string, checks: string[], packages: string[] = []): Promise<RunResult> {
  try { await startPython(); await ensurePackages(packages) } catch (e) { return { output: [], error: String((e as Error).message), passed: false } }
  const w = pyWorker!
  return new Promise<RunResult>((resolve) => {
    const t = setTimeout(() => { reset(); resolve({ output: [], error: 'Timeout (boucle infinie ?)', passed: false }) }, 20000)
    w.onmessage = (e) => { if (e.data.type === 'done') { clearTimeout(t); resolve({ output: e.data.output, error: e.data.error, passed: e.data.passed, figures: e.data.figures }) } }
    w.onerror = (e) => { clearTimeout(t); reset(); resolve({ output: [], error: e.message, passed: false }) }
    w.postMessage({ type: 'run', code, checks })
  })
}

/** Lance le code d'une leçon dans le bon langage. */
export function runLesson(lesson: { lang?: 'js' | 'py'; checks: string[]; packages?: string[] }, code: string): Promise<RunResult> {
  return lesson.lang === 'py' ? runPython(code, lesson.checks, lesson.packages) : runCode(code, lesson.checks)
}

export interface TraceStep { ligne: number; evt: string; fn: string; vars: Record<string, string> }
export interface TraceResult { steps: TraceStep[]; output: string[]; error: string | null }

/** Exécute le code Python en enregistrant chaque ligne (max 600 étapes) pour le rejouer pas à pas. */
export async function tracePython(code: string, packages: string[] = []): Promise<TraceResult> {
  try { await startPython(); await ensurePackages(packages) } catch (e) { return { steps: [], output: [], error: String((e as Error).message) } }
  const w = pyWorker!
  return new Promise<TraceResult>((resolve) => {
    const t = setTimeout(() => { reset(); resolve({ steps: [], output: [], error: 'Timeout (boucle infinie ?)' }) }, 20000)
    w.onmessage = (e) => { if (e.data.type === 'traced') { clearTimeout(t); resolve({ steps: e.data.steps, output: e.data.output, error: e.data.error }) } }
    w.onerror = (e) => { clearTimeout(t); reset(); resolve({ steps: [], output: [], error: e.message }) }
    w.postMessage({ type: 'trace', code })
  })
}
