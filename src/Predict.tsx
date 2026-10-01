import { useState } from 'react'
import type { Lesson } from './lessons'
import type { Lang } from './i18n'

const T = {
  fr: { code: 'Le programme', yourAnswer: 'Ta réponse (la sortie exacte, une ligne par affichage)', check: 'Vérifier', ok: 'Exact !', ko: 'Pas tout à fait. Relis le code ligne par ligne et réessaie.', why: 'Explication', reveal: 'Voir la réponse', next: 'Leçon suivante' },
  en: { code: 'The program', yourAnswer: 'Your answer (the exact output, one line per print)', check: 'Check', ok: 'Correct!', ko: 'Not quite. Re-read the code line by line and try again.', why: 'Explanation', reveal: 'Show the answer', next: 'Next lesson' },
} as const

const norm = (s: string) => s.split('\n').map((l) => l.trimEnd()).join('\n').trim()

/** Exercice de lecture : on lit un code et on prédit sa sortie, sans l'exécuter. */
export default function Predict({ lesson, lang, onCorrect, onNext, hasNext }: { lesson: Lesson; lang: Lang; onCorrect: () => void; onNext: () => void; hasNext: boolean }) {
  const t = T[lang]
  const p = lesson.predict!
  const [val, setVal] = useState('')
  const [state, setState] = useState<'idle' | 'ok' | 'ko'>('idle')
  const [shown, setShown] = useState(false)

  const check = () => {
    const good = norm(val) === norm(p.answer)
    setState(good ? 'ok' : 'ko')
    if (good) onCorrect()
  }

  return (
    <section className="space-y-2">
      <h3 className="font-semibold">{t.code}</h3>
      <pre className="rounded-lg bg-code text-code-fg p-3 text-sm overflow-x-auto font-mono leading-6">{p.code}</pre>
      <label className="block text-sm font-medium">{t.yourAnswer}
        <textarea value={val} onChange={(e) => { setVal(e.target.value); setState('idle') }} rows={Math.max(3, p.answer.split('\n').length)} spellCheck={false}
          className="mt-1 w-full rounded-lg border border-ink/30 bg-paper p-3 font-mono text-sm" />
      </label>
      <div className="flex gap-2 flex-wrap">
        <button onClick={check} disabled={!val.trim()} className="bg-terracotta text-white rounded-md px-4 py-2 text-sm font-medium disabled:opacity-40">{t.check}</button>
        <button onClick={() => setShown(true)} className="border border-ink/30 rounded-md px-4 py-2 text-sm">{t.reveal}</button>
      </div>
      <div aria-live="polite" className="space-y-2">
        {state === 'ok' && <p className="font-medium">✅ {t.ok}</p>}
        {state === 'ko' && <p className="text-terracotta-dark">{t.ko}</p>}
        {(state === 'ok' || shown) && (
          <div className="rounded-md bg-brass/15 border border-brass p-3 text-sm space-y-2">
            {shown && <pre className="rounded bg-code text-code-fg p-2 font-mono whitespace-pre-wrap">{p.answer}</pre>}
            <p><strong>{t.why} : </strong>{p.why[lang]}</p>
          </div>
        )}
        {state === 'ok' && hasNext && <button onClick={onNext} className="bg-ink text-cream rounded-md px-4 py-2 text-sm font-medium">{t.next} →</button>}
      </div>
    </section>
  )
}
