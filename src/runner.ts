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
