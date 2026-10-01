import { useEffect, useRef, useState } from 'react'
import { tracePython, type TraceResult } from './runner'
import type { Lang } from './i18n'

const T = {
  fr: {
    title: 'Débogueur temporel', help: 'Rejoue ton code ligne par ligne et regarde les variables changer. Ajoute un appel pour tracer une fonction.',
    call: 'Appel à tracer (ex. somme(4))', go: 'Rejouer pas à pas', busy: 'Préparation…', step: 'Étape', of: 'sur', prev: 'Précédent', next: 'Suivant', play: 'Lecture', pause: 'Pause',
    vars: 'Variables', noVars: '(aucune variable simple)', fn: 'dans', empty: 'Aucune étape : ajoute un appel de fonction ci-dessus.', output: 'Affichage', close: 'Fermer',
  },
  en: {
    title: 'Time-travel debugger', help: 'Replays your code line by line and shows variables changing. Add a call to trace a function.',
    call: 'Call to trace (e.g. somme(4))', go: 'Replay step by step', busy: 'Preparing…', step: 'Step', of: 'of', prev: 'Previous', next: 'Next', play: 'Play', pause: 'Pause',
    vars: 'Variables', noVars: '(no simple variable)', fn: 'in', empty: 'No step: add a function call above.', output: 'Output', close: 'Close',
  },
} as const

/** Rejoue l'exécution d'un code Python : curseur de temps, ligne courante, variables. */
export default function StepDebugger({ lang, code, packages, onClose }: { lang: Lang; code: string; packages?: string[]; onClose: () => void }) {
  const t = T[lang]
  const [call, setCall] = useState('')
  const [busy, setBusy] = useState(false)
  const [res, setRes] = useState<TraceResult | null>(null)
  const [full, setFull] = useState('')
  const [i, setI] = useState(0)
  const [playing, setPlaying] = useState(false)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  const run = async () => {
    setBusy(true); setPlaying(false)
    const src = call.trim() ? code.replace(/\s+$/, '') + '\n' + call.trim() : code
    setFull(src)
    const r = await tracePython(src, packages)
    setRes(r); setI(0); setBusy(false)
  }

  const n = res?.steps.length ?? 0
  useEffect(() => {
    if (!playing) return
    timer.current = setInterval(() => setI((x) => { if (x >= n - 1) { setPlaying(false); return x } return x + 1 }), 600)
    return () => { if (timer.current) clearInterval(timer.current) }
  }, [playing, n])

  const step = res?.steps[i]
  const lines = full.split('\n')
  return (
    <section className="rounded-xl border-2 border-brass bg-paper p-3 space-y-3" aria-label={t.title}>
      <div className="flex items-center gap-2">
        <h3 className="font-serif font-bold text-lg flex-1">🕰 {t.title}</h3>
        <button className="text-sm underline" onClick={onClose}>{t.close}</button>
      </div>
      <p className="text-xs text-ink/70">{t.help}</p>
      <div className="flex gap-2 flex-wrap">
        <input value={call} onChange={(e) => setCall(e.target.value)} placeholder={t.call} aria-label={t.call} spellCheck={false}
          className="flex-1 min-w-48 rounded-md border border-ink/30 bg-white/60 px-2 py-1.5 text-sm font-mono" />
        <button onClick={run} disabled={busy} className="rounded-md bg-terracotta text-white px-3 py-1.5 text-sm disabled:opacity-40">{busy ? t.busy : t.go}</button>
      </div>
      {res && res.error && <p className="text-sm text-terracotta-dark" role="status">{res.error}</p>}
      {res && n === 0 && !res.error && <p className="text-sm text-ink/70">{t.empty}</p>}
      {res && n > 0 && step && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <button className="rounded-md border border-ink/30 px-2 py-1 text-sm" onClick={() => { setPlaying(false); setI(Math.max(0, i - 1)) }} aria-label={t.prev}>◀</button>
            <input type="range" min={0} max={n - 1} value={i} onChange={(e) => { setPlaying(false); setI(Number(e.target.value)) }} aria-label={t.step} className="flex-1 min-w-32 accent-[var(--color-terracotta)]" />
            <button className="rounded-md border border-ink/30 px-2 py-1 text-sm" onClick={() => { setPlaying(false); setI(Math.min(n - 1, i + 1)) }} aria-label={t.next}>▶</button>
            <button className="rounded-md border border-ink/30 px-2 py-1 text-sm" onClick={() => { if (i >= n - 1) setI(0); setPlaying(!playing) }}>{playing ? '⏸ ' + t.pause : '⏵ ' + t.play}</button>
            <span className="text-xs text-ink/60" aria-live="polite">{t.step} {i + 1} {t.of} {n}</span>
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            <pre className="rounded-lg bg-code text-code-fg p-2 text-sm overflow-x-auto font-mono leading-6" aria-label="code">
              {lines.map((l, k) => (
                <div key={k} className={k + 1 === step.ligne ? 'bg-terracotta/40 -mx-2 px-2' : ''}>
                  <span className="inline-block w-6 text-right mr-2 opacity-50 select-none">{k + 1}</span>{l || ' '}
                </div>
              ))}
            </pre>
            <div className="rounded-lg border border-brass/50 p-2 text-sm">
              <p className="text-xs text-ink/60 mb-1">{t.vars}{step.fn !== '<module>' ? ` · ${t.fn} ${step.fn}()` : ''}</p>
              {Object.keys(step.vars).length === 0 ? <p className="text-ink/50">{t.noVars}</p> : (
                <table className="w-full font-mono text-xs"><tbody>
                  {Object.entries(step.vars).map(([k, v]) => (
                    <tr key={k} className="border-t border-ink/10"><th className="text-left pr-2 py-0.5 font-semibold">{k}</th><td className="break-all">{v}</td></tr>
                  ))}
                </tbody></table>
              )}
            </div>
          </div>
          {i === n - 1 && res.output.length > 0 && (
            <pre className="rounded-lg bg-code text-code-fg p-2 text-sm font-mono whitespace-pre-wrap"><span className="opacity-50">{t.output} : </span>{res.output.join('\n')}</pre>
          )}
        </div>
      )}
    </section>
  )
}
