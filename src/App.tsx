import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import Espaces from './Espaces'
import Curriculum from './Curriculum'
import Outils from './outils/Outils'
import Entraide from './entraide/Entraide'
import { eu as entraideUi } from './entraide/i18n'
import { o as outilsUi } from './outils/i18n'
import { AuthBox } from './Auth'
import { supabase } from './supabase'
import { ui, type Lang } from './i18n'
import { lessons } from './lessons'
import AgentPanel from './AgentPanel'
import DiffModal from './DiffModal'
import { askFix, type FixProposal } from './tutor'
import { playError, playSuccess } from './sounds'
import { runLesson, type RunResult } from './runner'

const pre = 'rounded-lg bg-ink text-cream p-3 text-sm overflow-x-auto whitespace-pre-wrap font-mono'

const GROUPS = {
  js: { fr: 'JavaScript', en: 'JavaScript' },
  'py-bases': { fr: 'Python · bases', en: 'Python · basics' },
  'py-algo': { fr: 'Python · algorithmes et structures', en: 'Python · algorithms and structures' },
} as const

function getLang(): Lang {
  try {
    const s = localStorage.getItem('learn:lang')
    if (s === 'fr' || s === 'en') return s
  } catch { /* stockage indisponible */ }
  return navigator.language.startsWith('en') ? 'en' : 'fr'
}

function load(key: string, fallback: string) {
  try { return localStorage.getItem('learn:' + key) ?? fallback } catch { return fallback }
}
function save(key: string, v: string) {
  try { localStorage.setItem('learn:' + key, v) } catch { /* ignoré */ }
}

export default function App() {
  const [lang, setLang] = useState<Lang>(getLang)
  const [session, setSession] = useState<Session | null>(null)
  const [view, setView] = useState<'lecons' | 'espaces' | 'outils' | 'entraide'>(() => (new URLSearchParams(window.location.search).has('join') ? 'espaces' : 'lecons'))
  const [ai, setAi] = useState(() => load('ai', '0') === '1')
  const [idx, setIdx] = useState(0)
  const [done, setDone] = useState<string[]>(() => JSON.parse(load('done', '[]')))
  const lesson = lessons[idx]
  const [code, setCode] = useState(() => load('code:' + lesson.id, lesson.starter))
  const [res, setRes] = useState<RunResult | null>(null)
  const [sound, setSound] = useState(() => load('sound', '1') === '1')
  const [fix, setFix] = useState<FixProposal | null>(null)
  const [fixBusy, setFixBusy] = useState(false)
  const [fixNote, setFixNote] = useState('')
  const [showHint, setShowHint] = useState(false)
  const t = ui[lang]

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  // Progression : rechargée depuis learn_progress à la connexion (fusion avec le local).
  useEffect(() => {
    if (!supabase || !session) return
    supabase.from('learn_progress').select('lesson_id,status').then(({ data }) => {
      const remote = (data ?? []).filter((r) => r.status === 'done').map((r) => r.lesson_id as string)
      setDone((d) => { const m = [...new Set([...d, ...remote])]; save('done', JSON.stringify(m)); return m })
    })
  }, [session])

  const go = (i: number) => {
    setIdx(i)
    setCode(load('code:' + lessons[i].id, lessons[i].starter))
    setRes(null)
    setShowHint(false)
  }

  const run = async () => {
    const r = await runLesson(lesson, code)
    setRes(r)
    if (sound && r.passed !== null) (r.passed ? playSuccess : playError)()
    if (r.passed && !done.includes(lesson.id)) {
      const d = [...done, lesson.id]
      setDone(d)
      save('done', JSON.stringify(d))
    }
    if (r.passed && supabase && session) {
      await supabase.from('learn_progress').upsert(
        { user_id: session.user.id, lesson_id: lesson.id, status: 'done', code, updated_at: new Date().toISOString() },
        { onConflict: 'user_id,lesson_id' },
      )
    }
  }

  const proposeFix = async () => {
    setFixBusy(true); setFixNote('')
    const r = await askFix({ code, lesson: lesson.title[lang] + ' — ' + lesson.task[lang], output: (res?.output.join('\n') ?? '') + (res?.error ? '\n' + res.error : ''), lang })
    setFixBusy(false)
    if (r.fix) setFix(r.fix)
    else setFixNote(r.error === 'quota' ? t.quota : t.aiError)
  }

  return (
    <div className="min-h-screen">
      <header className="relative bg-paper border-b-2 border-brass">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div>
            <h1 className="font-bold text-2xl">Finjaro Learn</h1>
            <p className="text-sm text-ink/60">{t.tagline}</p>
          </div>
          <div className="flex items-center gap-2">
          <AuthBox lang={lang} session={session} />
          <div role="group" aria-label={t.aiHelp} title={t.aiHelp} className="flex rounded-md border border-ink/30 overflow-hidden text-sm">
            {[false, true].map((v) => (
              <button
                key={String(v)}
                aria-pressed={ai === v}
                onClick={() => { setAi(v); save('ai', v ? '1' : '0') }}
                className={`px-3 py-1.5 ${ai === v ? 'bg-terracotta text-white' : ''}`}
              >
                {v ? t.aiOn : t.aiOff}
              </button>
            ))}
          </div>
          <button
            className="text-sm border border-ink/30 rounded-md px-3 py-1.5"
            onClick={() => { const l = lang === 'fr' ? 'en' : 'fr'; setLang(l); save('lang', l) }}
          >
            {lang === 'fr' ? 'EN' : 'FR'}
          </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 pt-3 flex gap-2" role="tablist">
        {(['lecons', 'espaces', 'outils', 'entraide'] as const).map((v) => (
          <button key={v} role="tab" aria-selected={view === v} onClick={() => setView(v)}
            className={`px-4 py-1.5 rounded-md text-sm border ${view === v ? 'bg-ink text-cream border-ink' : 'border-ink/30'}`}>
            {v === 'lecons' ? t.lessonsTab : v === 'espaces' ? t.spaces : v === 'entraide' ? entraideUi(lang).tab : outilsUi[lang].tab}
          </button>
        ))}
      </div>
      {view === 'outils' && <div className="max-w-5xl mx-auto px-4 py-4"><Outils lang={lang} session={session} /></div>}
      {view === 'entraide' && <div className="max-w-5xl mx-auto px-4 py-4"><Entraide lang={lang} session={session} /></div>}
      {view === 'espaces' && <div className="max-w-5xl mx-auto px-4 py-4"><Espaces lang={lang} session={session} /></div>}
      {view === 'lecons' && <div className="max-w-5xl mx-auto px-4 pt-3"><Curriculum lang={lang} done={done} /></div>}
      <div className={`max-w-5xl mx-auto px-4 py-4 grid gap-4 md:grid-cols-[220px_1fr] ${view !== 'lecons' ? 'hidden' : ''}`}>
        <nav aria-label={t.lessons}>
          <h2 className="text-xs uppercase tracking-wide text-ink/60 mb-2">{t.lessons}</h2>
          <ol className="flex md:flex-col gap-2 overflow-x-auto">
            {lessons.map((l, i) => (
              <li key={l.id} className="shrink-0 flex md:block items-center gap-2">
                {(i === 0 || lessons[i - 1].group !== l.group) && (
                  <span className="text-[11px] uppercase tracking-wide text-ink/50 md:block md:mt-2 md:mb-1 whitespace-nowrap">
                    {GROUPS[l.group ?? 'js'][lang]}
                  </span>
                )}
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
          <h2 className="text-xl font-bold">{lesson.title[lang]} <span className="text-xs font-sans font-normal text-ink/50">{lesson.lang === 'py' ? 'Python' : 'JavaScript'}</span></h2>
          {ai && <AgentPanel lang={lang} signedIn={!!session} ctx={{ title: (lesson.lang === 'py' ? '[Python] ' : '[JavaScript] ') + lesson.title[lang], code, output: res?.output.join('\n') ?? '' }} />}
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
            <div className="grid gap-3 lg:grid-cols-2 items-start">
            <div className="space-y-2 min-w-0">
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
              {ai && session && (
                <button onClick={proposeFix} disabled={fixBusy || !code.trim()} className="border border-terracotta text-terracotta-dark rounded-md px-4 py-2 text-sm disabled:opacity-40">
                  {fixBusy ? t.thinking : '✨ ' + t.aiFix}
                </button>
              )}
              <button onClick={() => { setSound(!sound); save('sound', sound ? '0' : '1') }} aria-pressed={sound} className="border border-ink/30 rounded-md px-3 py-2 text-sm" title={t.sound}>
                {sound ? '🔊' : '🔇'}
              </button>
            </div>
            {fixNote && <p className="text-sm text-terracotta-dark" role="status">{fixNote}</p>}
            {showHint && <p className="rounded-md bg-brass/15 border border-brass p-3 text-sm">💡 {lesson.hint[lang]}</p>}
            </div>
            <div className="min-w-0">
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
            </div>
            </div>
          </section>
          {fix && (
            <DiffModal lang={lang} original={code} fix={fix} onClose={() => setFix(null)}
              onAccept={() => { setCode(fix.fixed_code); save('code:' + lesson.id, fix.fixed_code); setFix(null); setRes(null) }} />
          )}
        </main>
      </div>
    </div>
  )
}
