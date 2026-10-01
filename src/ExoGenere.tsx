import { useState } from 'react'
import { runPython, type RunResult } from './runner'
import type { ExoGenere } from './exos'
import type { Lang } from './i18n'

const T = {
  fr: { title: 'Exercice sur mesure', tag: 'généré par l’IA, solution vérifiée', run: 'Lancer', sol: 'Voir la solution', ok: 'Bravo, ça marche !', ko: 'Pas encore.', output: 'Résultat', close: 'Fermer', err: 'Erreur dans ton code :' },
  en: { title: 'Tailored exercise', tag: 'AI-generated, solution verified', run: 'Run', sol: 'Show solution', ok: 'Well done, it works!', ko: 'Not yet.', output: 'Output', close: 'Close', err: 'Error in your code:' },
} as const

/** Exercice généré : le navigateur a déjà vérifié que la solution de référence passe les tests. */
export default function ExoGenereModal({ lang, exo, packages, onClose }: { lang: Lang; exo: ExoGenere; packages?: string[]; onClose: () => void }) {
  const t = T[lang]
  const [code, setCode] = useState(exo.starter)
  const [res, setRes] = useState<RunResult | null>(null)
  const [busy, setBusy] = useState(false)
  return (
    <div className="fixed inset-0 z-50 bg-ink/60 p-3 flex items-center justify-center" role="dialog" aria-modal="true" aria-label={t.title}>
      <div className="bg-paper rounded-xl border-2 border-brass w-full max-w-2xl max-h-[92vh] overflow-y-auto p-4 space-y-3">
        <div className="flex items-baseline gap-2">
          <h3 className="font-serif font-bold text-lg flex-1">✨ {exo.titre}</h3>
          <button className="text-sm underline" onClick={onClose}>{t.close}</button>
        </div>
        <p className="text-xs text-ink/60">{t.title} · {t.tag}</p>
        <p className="text-sm font-medium text-terracotta-dark whitespace-pre-wrap">{exo.consigne}</p>
        <textarea value={code} onChange={(e) => setCode(e.target.value)} rows={8} spellCheck={false} aria-label={exo.titre}
          className="w-full rounded-lg border border-ink/30 bg-white/70 p-3 font-mono text-sm" />
        <div className="flex gap-2 flex-wrap">
          <button disabled={busy} onClick={async () => { setBusy(true); setRes(await runPython(code, exo.tests, packages)); setBusy(false) }}
            className="bg-terracotta text-white rounded-md px-4 py-2 text-sm font-medium disabled:opacity-40">{t.run}</button>
          <button onClick={() => setCode(exo.solution)} className="border border-ink/30 rounded-md px-4 py-2 text-sm">{t.sol}</button>
        </div>
        {res && (
          <div aria-live="polite" className="space-y-1">
            {res.output.length > 0 && <pre className="rounded-lg bg-code text-code-fg p-2 text-sm font-mono whitespace-pre-wrap">{res.output.join('\n')}</pre>}
            {res.error && <p className="text-sm text-terracotta-dark">{t.err} {res.error}</p>}
            {res.passed === true && <p className="font-medium">✅ {t.ok}</p>}
            {res.passed === false && !res.error && <p className="text-terracotta-dark">{t.ko}</p>}
          </div>
        )}
      </div>
    </div>
  )
}
