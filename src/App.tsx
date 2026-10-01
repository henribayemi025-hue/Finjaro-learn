import { useState } from 'react'
import { ui, type Lang } from './i18n'
import { lessons } from './lessons'
import { runCode, type RunResult } from './runner'

const pre = 'rounded-lg bg-ink text-cream p-3 text-sm overflow-x-auto whitespace-pre-wrap font-mono'

function getLang(): Lang {
  try {
    const s = localStorage.getItem('lang')
    if (s === 'fr' || s === 'en') return s
  } catch { /* stockage indisponible */ }
  return navigator.language.startsWith('en') ? 'en' : 'fr'
}

function load(key: string, fallback: string) {
  try { return localStorage.getItem(key) ?? fallback } catch { return fallback }
}
function save(key: string, v: string) {
  try { localStorage.setItem(key, v) } catch { /* ignoré */ }
}

export default function App() {
  const [lang, setLang] = useState<Lang>(getLang)
  const [idx, setIdx] = useState(0)
  const [done, setDone] = useState<string[]>(() => JSON.parse(load('done', '[]')))
  const lesson = lessons[idx]
  const [code, setCode] = useState(() => load('code:' + lesson.id, lesson.starter))
  const [res, setRes] = useState<RunResult | null>(null)
  const [showHint, setShowHint] = useState(false)
  const t = ui[lang]

  const go = (i: number) => {
    setIdx(i)
    setCode(load('code:' + lessons[i].id, lessons[i].starter))
    setRes(null)
    setShowHint(false)
  }

  const run = async () => {
    const r = await runCode(code, lesson.checks)
    setRes(r)
    if (r.passed && !done.includes(lesson.id)) {
      const d = [...done, lesson.id]
      setDone(d)
      save('done', JSON.stringify(d))
    }
  }

  return (
    <div className="min-h-screen">
      <header className="bg-paper border-b-2 border-brass">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div>
            <h1 className="font-bold text-2xl">Finjaro Learn</h1>
            <p className="text-sm text-ink/60">{t.tagline}</p>
          </div>
          <button
            className="text-sm border border-ink/30 rounded-md px-3 py-1.5"
            onClick={() => { const l = lang === 'fr' ? 'en' : 'fr'; setLang(l); save('lang', l) }}
          >
            {lang === 'fr' ? 'EN' : 'FR'}
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-4 grid gap-4 md:grid-cols-[220px_1fr]">
        <nav aria-label={t.lessons}>
          <h2 className="text-xs uppercase tracking-wide text-ink/60 mb-2">{t.lessons}</h2>
          <ol className="flex md:flex-col gap-2 overflow-x-auto">
            {lessons.map((l, i) => (
              <li key={l.id} className="shrink-0">
                <button
                  onClick={() => go(i)}
                  className={`w-full text-left rounded-md px-3 py-2 text-sm border ${
                    i === idx ? 'bg-terracotta text-white border-terracotta' : 'bg-paper border-brass/50'
                  }`}
                >
                  {i + 1}. {l.title[lang]} {done.includes(l.id) && <span aria-label={t.done}>✓</span>}
                </button>
              </li>
            ))}
          </ol>
        </nav>

        <main className="space-y-4 min-w-0">
          <h2 className="text-xl font-bold">{lesson.title[lang]}</h2>
          <section>
            <h3 className="font-semibold mb-1">{t.explain}</h3>
            <p>{lesson.explain[lang]}</p>
          </section>
          <section>
            <h3 className="font-semibold mb-1">{t.example}</h3>
            <pre className={pre}>{lesson.example}</pre>
          </section>
          <section className="space-y-2">
            <h3 className="font-semibold">{t.exercise}</h3>
            <p className="font-medium text-terracotta-dark">{lesson.task[lang]}</p>
            <textarea
              value={code}
              onChange={(e) => { setCode(e.target.value); save('code:' + lesson.id, e.target.value) }}
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
              rows={8}
              className="w-full rounded-lg border border-ink/30 bg-paper p-3 font-mono text-sm"
              aria-label={t.exercise}
            />
            <div className="flex flex-wrap gap-2">
              <button onClick={run} className="bg-terracotta hover:bg-terracotta-dark text-white rounded-md px-4 py-2 text-sm font-medium">
                {t.run}
              </button>
              <button onClick={() => setShowHint(true)} className="border border-ink/30 rounded-md px-4 py-2 text-sm">
                {t.hint}
              </button>
              <button
                onClick={() => { setCode(lesson.solution); save('code:' + lesson.id, lesson.solution) }}
                className="border border-ink/30 rounded-md px-4 py-2 text-sm"
              >
                {t.solution}
              </button>
            </div>
            {showHint && <p className="rounded-md bg-brass/15 border border-brass p-3 text-sm">💡 {lesson.hint[lang]}</p>}
            {res && (
              <div className="space-y-2" aria-live="polite">
                <h4 className="text-sm font-semibold">{t.output}</h4>
                <pre className={pre}>{res.output.length ? res.output.join('\n') : t.noOutput}</pre>
                {res.error && <p className="text-terracotta-dark text-sm">{t.error} {res.error}</p>}
                {res.passed === true && <p className="text-ink font-medium">✅ {t.ok}</p>}
                {res.passed === false && !res.error && <p className="text-terracotta-dark">{t.ko}</p>}
                {res.passed && idx < lessons.length - 1 && (
                  <button onClick={() => go(idx + 1)} className="bg-ink text-white rounded-md px-4 py-2 text-sm font-medium">
                    {t.next} →
                  </button>
                )}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  )
}
