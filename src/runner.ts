export interface RunResult {
  output: string[]
  error: string | null
  passed: boolean | null
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

const pyWorkerSrc = `
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
    if (d.type === 'load') { await py.loadPackage(d.packages); postMessage({ type: 'loaded' }); return }
    const out = []
    py.setStdout({ batched: (s) => out.push(s) })
    py.setStderr({ batched: (s) => out.push(s) })
    const ns = py.globals.get('dict')()
    try {
      py.runPython(d.code, { globals: ns })
      ns.set('__out', out.join('\\n'))
      for (const mod of ['numpy as np', 'pandas as pd']) { try { py.runPython('import ' + mod, { globals: ns }) } catch (e) { /* bibliothèque non chargée */ } }
      py.runPython('def __raises(f, e=Exception):\\n    try:\\n        f()\\n    except e:\\n        return True\\n    return False', { globals: ns })
      const results = d.checks.map((c) => !!py.runPython(c, { globals: ns }))
      postMessage({ type: 'done', output: out, error: null, passed: d.checks.length === 0 ? null : results.every(Boolean) })
    } catch (err) {
      const msg = String(err && err.message ? err.message : err).trim().split('\\n').slice(-3).join('\\n')
      postMessage({ type: 'done', output: out, error: msg, passed: false })
    } finally { ns.destroy() }
  } catch (err) {
    postMessage({ type: 'fatal', error: String(err && err.message ? err.message : err) })
  }
}`

let pyWorker: Worker | null = null
let pyReady: Promise<void> | null = null

function startPython(): Promise<void> {
  if (pyReady) return pyReady
  const url = URL.createObjectURL(new Blob([pyWorkerSrc], { type: 'text/javascript' }))
  const w = new Worker(url)
  pyWorker = w
  pyReady = new Promise<void>((resolve, reject) => {
    const t = setTimeout(() => { reset(); reject(new Error('Python : chargement trop long (réseau ?)')) }, 90000)
    w.onmessage = (e) => { if (e.data.type === 'ready') { clearTimeout(t); resolve() } else if (e.data.type === 'fatal') { clearTimeout(t); reset(); reject(new Error(e.data.error)) } }
    w.onerror = (e) => { clearTimeout(t); reset(); reject(new Error(e.message)) }
    w.postMessage({ type: 'init' })
  })
  return pyReady
}

function reset() { pyWorker?.terminate(); pyWorker = null; pyReady = null; loadedPkgs.clear() }

/** Exécute du Python dans un Worker isolé (Pyodide). Boucle infinie : le Worker est arrêté après 6 s. */
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
    const t = setTimeout(() => { reset(); resolve({ output: [], error: 'Timeout (boucle infinie ?)', passed: false }) }, 6000)
    w.onmessage = (e) => { if (e.data.type === 'done') { clearTimeout(t); resolve({ output: e.data.output, error: e.data.error, passed: e.data.passed }) } }
    w.onerror = (e) => { clearTimeout(t); reset(); resolve({ output: [], error: e.message, passed: false }) }
    w.postMessage({ type: 'run', code, checks })
  })
}

/** Lance le code d'une leçon dans le bon langage. */
export function runLesson(lesson: { lang?: 'js' | 'py'; checks: string[]; packages?: string[] }, code: string): Promise<RunResult> {
  return lesson.lang === 'py' ? runPython(code, lesson.checks, lesson.packages) : runCode(code, lesson.checks)
}
