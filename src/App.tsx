import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import Espaces from './Espaces'
import { TRACK_ICON } from './Curriculum'
import Accueil from './Accueil'
import Lettre from './Lettre'
import LoginGate from './LoginGate'
import Chrono from './Chrono'
import { TRACKS } from './tracks'
import Progress, { recordDay, loadDays, streaks } from './Progress'
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
import Chart from './Chart'
import StepDebugger from './StepDebugger'
import Predict from './Predict'
import Burst from './Burst'
import Access from './Access'
import ExoGenereModal from './ExoGenere'
import { genereExo, type ExoGenere } from './exos'
import { agents } from './agents'
import AgentFace from './AgentFace'
import { runLesson, pythonPret, type RunResult } from './runner'
import { expliqueErreur } from './explainError'

const pre = 'rounded-xl bg-code text-code-fg p-4 text-sm overflow-x-auto whitespace-pre-wrap font-mono'
const trackOf = (g: string | undefined) => TRACKS.find((tr) => (tr.groups as string[]).includes(g ?? 'js'))?.key ?? 'prog'
const VIEWS = ['lecons', 'progression', 'espaces', 'outils', 'entraide'] as const
const VIEW_ICON = { lecons: '📚', progression: '📈', espaces: '👥', outils: '🧰', entraide: '🤝' } as const

const GROUPS = {
  js: { fr: 'JavaScript', en: 'JavaScript' },
  'py-bases': { fr: 'Python · bases', en: 'Python · basics' },
  'py-algo': { fr: 'Python · algorithmes et structures', en: 'Python · algorithms and structures' },
  'py-lecture': { fr: 'Python · lire du code', en: 'Python · reading code' },
  'py-projets': { fr: 'Python · projets', en: 'Python · projects' },
  'ds-numpy': { fr: 'Data science · NumPy', en: 'Data science · NumPy' },
  'ds-pandas': { fr: 'Data science · pandas', en: 'Data science · pandas' },
  'ds-ml': { fr: 'Data science · statistiques et apprentissage', en: 'Data science · statistics and learning' },
  'ds-viz': { fr: 'Data science · graphiques et projet', en: 'Data science · charts and project' },
  dl: { fr: 'Deep learning · les bases', en: 'Deep learning · the basics' },
  'dl-reseaux': { fr: 'Deep learning · réseaux de neurones', en: 'Deep learning · neural networks' },
  'ai-rag': { fr: 'AI engineering · recherche et RAG', en: 'AI engineering · retrieval and RAG' },
  'ai-agents': { fr: 'AI engineering · agents et production', en: 'AI engineering · agents and production' },
  pe: { fr: 'Prompt engineering', en: 'Prompt engineering' },
  compil: { fr: 'Compilateurs', en: 'Compilers' },
  nlp: { fr: 'NLP et Transformers', en: 'NLP and Transformers' },
  quant: { fr: 'Informatique quantique', en: 'Quantum computing' },
  algo: { fr: 'Algorithmique avancée', en: 'Advanced algorithms' },
  robo: { fr: 'Robotique', en: 'Robotics' },
  c: { fr: 'C', en: 'C' },
  cpp: { fr: 'C++', en: 'C++' },
  'ia-api': { fr: 'Outils IA · API et agents', en: 'AI tools · APIs and agents' },
  git: { fr: 'Outils IA · Git et GitHub', en: 'AI tools · Git and GitHub' },
  'pg-calc': { fr: 'Projet guidé · calculatrice', en: 'Guided project · calculator' },
  'pg-robot': { fr: 'Projet guidé · robot explorateur', en: 'Guided project · explorer robot' },
  'pg-faq': { fr: 'Projet guidé · assistant FAQ', en: 'Guided project · FAQ assistant' },
  archi: { fr: 'Ordinateurs', en: 'Computers' },
  crypto: { fr: 'Cryptographie', en: 'Cryptography' },
  maths: { fr: 'Maths pour l\'IA', en: 'Maths for AI' },
} as const

function acuName(lang: Lang, key: string) {
  return TRACKS.find((tr) => tr.key === key)?.name[lang] ?? ''
}

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
  const lireLettre = () => { const m = window.location.hash.match(/^#lettre(?:\/(\d{4}-\d{2}-\d{2}))?$/); return m ? (m[1] ?? '') : null }
  const [lettreDate, setLettreDate] = useState<string | null>(lireLettre)
  const [view, setView] = useState<'lecons' | 'progression' | 'espaces' | 'outils' | 'entraide' | 'lettre'>(() => (lireLettre() !== null ? 'lettre' : new URLSearchParams(window.location.search).has('join') ? 'espaces' : 'lecons'))
  // Adresse directe stable : #lettre (dernier numéro) ou #lettre/AAAA-MM-JJ.
  useEffect(() => {
    const h = () => { const d = lireLettre(); if (d !== null) { setLettreDate(d); setView('lettre'); window.scrollTo({ top: 0 }) } }
    window.addEventListener('hashchange', h)
    return () => window.removeEventListener('hashchange', h)
  }, [])
  useEffect(() => { if (view !== 'lettre' && window.location.hash.startsWith('#lettre')) history.replaceState(null, '', window.location.pathname + window.location.search) }, [view])
  const [theme, setTheme] = useState<'finjaro' | 'noir'>(() => (load('theme', 'finjaro') === 'noir' ? 'noir' : 'finjaro'))
  useEffect(() => { document.documentElement.dataset.theme = theme }, [theme])
  const [ai, setAi] = useState(() => load('ai', '0') === '1')
  const [idx, setIdx] = useState(() => Math.max(0, lessons.findIndex((l) => l.id === load('last', ''))))
  const [done, setDone] = useState<string[]>(() => JSON.parse(load('done', '[]')))
  const lesson = lessons[idx]
  const [code, setCode] = useState(() => load('code:' + lesson.id, lesson.starter))
  const [res, setRes] = useState<RunResult | null>(null)
  const [sound, setSound] = useState(() => load('sound', '1') === '1')
  const [fix, setFix] = useState<FixProposal | null>(null)
  const [fails, setFails] = useState(0)
  const [stuckHint, setStuckHint] = useState(false)
  const [exo, setExo] = useState<ExoGenere | null>(null)
  const [exoBusy, setExoBusy] = useState(false)
  const [exoNote, setExoNote] = useState('')
  const [burst, setBurst] = useState(0)
  const [golf, setGolf] = useState<{ n: number; best: number } | null>(null)
  const [debug, setDebug] = useState(false)
  const [fixBusy, setFixBusy] = useState(false)
  const [fixNote, setFixNote] = useState('')
  const [showHint, setShowHint] = useState(false)
  const [chrono, setChrono] = useState(false)
  const [running, setRunning] = useState<'' | 'run' | 'py'>('')
  const [menu, setMenu] = useState(false)
  const t = ui[lang]
  // Le débogueur s'ouvre sous l'exercice : on l'amène à l'écran, sinon on croit que le bouton ne fait rien.
  useEffect(() => { if (debug) requestAnimationFrame(() => document.getElementById('debug')?.scrollIntoView({ behavior: 'smooth', block: 'start' })) }, [debug])

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

  const go = (i: number, scroll = false) => {
    setIdx(i)
    save('last', lessons[i].id)
    if (scroll) requestAnimationFrame(() => document.getElementById('lecon')?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
    setCode(load('code:' + lessons[i].id, lessons[i].starter))
    setRes(null)
    setFails(0)
    setStuckHint(false)
    setExoNote('')
    setGolf(null)
    setDebug(false)
    setShowHint(false)
  }

  /** Leçon réussie : jour actif, progression locale, progression en base si connecté. */
  const markPassed = async (codeText: string) => {
    recordDay()
    if (!done.includes(lesson.id)) {
      const d = [...done, lesson.id]
      setDone(d)
      save('done', JSON.stringify(d))
    }
    if (supabase && session) {
      await supabase.from('learn_progress').upsert(
        { user_id: session.user.id, lesson_id: lesson.id, status: 'done', code: codeText, updated_at: new Date().toISOString() },
        { onConflict: 'user_id,lesson_id' },
      )
    }
  }

  const run = async () => {
    if (running) return
    setRunning(lesson.lang === 'py' && !pythonPret(lesson.packages) ? 'py' : 'run')
    const r = await runLesson(lesson, code).finally(() => setRunning(''))
    setRes(r)
    // Sur téléphone le résultat est sous l'éditeur : on l'amène à l'écran (au-dessus de la barre d'onglets du bas).
    setTimeout(() => {
      const el = document.getElementById('resultat')
      if (!el) return
      const r2 = el.getBoundingClientRect()
      const bas = window.innerHeight - (window.innerWidth < 1024 ? 96 : 16)
      if (r2.bottom > bas) el.scrollIntoView({ block: r2.height > bas - 80 ? 'start' : 'end', behavior: 'smooth' })
    }, 60)
    if (sound && r.passed !== null) (r.passed ? playSuccess : playError)()
    if (r.passed === false) setFails((f) => f + 1)
    if (r.passed) {
      setBurst((b) => b + 1)
      if (lesson.lang === 'py') {
        // Code golf : nombre de caractères du code (sans commentaires ni lignes vides), meilleur score gardé sur l'appareil.
        const n = code.split('\n').map((l) => l.replace(/#.*$/, '').trimEnd()).filter((l) => l.trim()).join('\n').length
        const prev = Number(load('golf:' + lesson.id, '0')) || 0
        const best = prev && prev < n ? prev : n
        save('golf:' + lesson.id, String(best))
        setGolf({ n, best })
      }
      await markPassed(code)
    }
  }

  // Après 3 échecs, l'agent propose de lui-même un indice, puis un exercice sur mesure (si connecté et IA activée).
  const stuck = fails >= 3 && !res?.passed
  const helper = agents.find((a) => a.id === (lesson.lang === 'py' && lesson.group !== 'py-bases' && lesson.group !== 'py-algo' && lesson.group !== 'py-projets' ? 'ia' : 'js')) ?? agents[0]
  const makeExo = async () => {
    setExoBusy(true); setExoNote('')
    const r = await genereExo({ lecon: lesson.title[lang] + ' — ' + lesson.task[lang], sujet: lesson.title[lang], erreurs: res?.error ?? res?.output.join(' ') ?? '', lang, packages: lesson.packages })
    setExoBusy(false)
    if (r.exo) setExo(r.exo)
    else setExoNote(r.error === 'quota' ? t.quota : r.error === 'invalide' ? t.exoInvalid : t.aiError)
  }

  const proposeFix = async () => {
    setFixBusy(true); setFixNote('')
    const r = await askFix({ code, lesson: lesson.title[lang] + ' — ' + lesson.task[lang], output: (res?.output.join('\n') ?? '') + (res?.error ? '\n' + res.error : ''), lang })
    setFixBusy(false)
    if (r.fix) setFix(r.fix)
    else setFixNote(r.error === 'quota' ? t.quota : t.aiError)
  }

  const track = trackOf(lesson.group)
  const trackLessons = lessons.map((l, i) => ({ l, i })).filter(({ l }) => trackOf(l.group) === track)
  const tabLabel = (v: typeof VIEWS[number]) => v === 'lecons' ? t.lessonsTab : v === 'progression' ? t.progressTab : v === 'espaces' ? t.spaces : v === 'entraide' ? entraideUi(lang).tab : outilsUi[lang].tab
  const serie = streaks(loadDays()).cur
  const G = {
    espaces: lang === 'fr'
      ? { title: 'Apprendre à plusieurs', text: t.spacesLogin, points: ['Un salon de discussion par groupe', 'Coder ensemble en direct', 'Des défis de groupe'] }
      : { title: 'Learn together', text: t.spacesLogin, points: ['A chat room per group', 'Code together live', 'Group challenges'] },
    outils: lang === 'fr'
      ? { title: 'Tes outils IA', text: outilsUi[lang].login, points: ['Fiches de révision et quiz', 'CV et lettres de motivation', 'Les nouveautés de l’IA'] }
      : { title: 'Your AI tools', text: outilsUi[lang].login, points: ['Revision sheets and quizzes', 'CVs and cover letters', 'What’s new in AI'] },
    entraide: lang === 'fr'
      ? { title: 'Entraide', text: entraideUi(lang).login, points: ['Pose une question', 'Aide les autres', 'Modération bienveillante'] }
      : { title: 'Help each other', text: entraideUi(lang).login, points: ['Ask a question', 'Help others', 'Kind moderation'] },
  }

  return (
    <div className="min-h-screen pb-[calc(5.5rem+env(safe-area-inset-bottom))] lg:pb-0">
      <a href="#contenu" className="skip-link">{t.skip}</a>
      <header className="sticky top-0 z-30 border-b border-brass bg-[color-mix(in_srgb,var(--color-cream)_82%,transparent)] backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span aria-hidden="true" className="size-9 shrink-0 rounded-xl grad text-white grid place-items-center font-extrabold text-lg shadow-md">F</span>
            <h1 className="text-lg font-extrabold whitespace-nowrap hidden sm:block lg:hidden xl:block" title={t.tagline}>Finjaro <span className="grad-text">Learn</span></h1>
            <h1 className="sr-only sm:hidden lg:block lg:sr-only xl:hidden">Finjaro Learn</h1>
          </div>
          <nav aria-label={t.lessonsTab} className="hidden lg:flex items-center gap-1 rounded-2xl bg-ink/5 p-1" role="tablist">
            {VIEWS.map((v) => (
              <button key={v} role="tab" aria-selected={view === v} onClick={() => setView(v)}
                className={`whitespace-nowrap min-h-11 px-3 py-1.5 rounded-xl text-sm font-semibold ${view === v ? 'bg-paper shadow text-ink' : 'text-ink/60 hover:text-ink'}`}>
                <span aria-hidden="true">{VIEW_ICON[v]}</span> {tabLabel(v)}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-1.5">
            {serie > 0 && <span className="chip hidden md:inline-flex text-sm py-1.5" title={lang === 'fr' ? 'Jours d’affilée avec au moins une leçon réussie (sur cet appareil)' : 'Days in a row with at least one lesson passed (on this device)'}>🔥 {serie} {lang === 'fr' ? (serie > 1 ? 'jours' : 'jour') : (serie > 1 ? 'days' : 'day')}</span>}
            <button onClick={() => { setAi(!ai); save('ai', ai ? '0' : '1') }} aria-pressed={ai} title={t.aiHelp} aria-label={lang === 'fr' ? 'Tuteur IA' : 'AI tutor'}
              className={`icon-btn ${ai ? 'grad text-white border-transparent' : ''}`}>🤖<span className="ml-1 text-xs sm:text-sm lg:hidden 2xl:inline">{lang === 'fr' ? 'Tuteur' : 'Tutor'}<span className="hidden sm:inline 2xl:inline"> IA</span></span></button>
            <span className="hidden sm:contents">
              <Access lang={lang} />
              <button onClick={() => { const n = theme === 'noir' ? 'finjaro' : 'noir'; setTheme(n); save('theme', n) }} aria-label={t.theme} title={t.theme} className="icon-btn">
                {theme === 'noir' ? '☀' : '☾'}
              </button>
              <button className="icon-btn" aria-label={lang === 'fr' ? 'English' : 'Français'} title={lang === 'fr' ? 'English' : 'Français'} onClick={() => { const l = lang === 'fr' ? 'en' : 'fr'; setLang(l); save('lang', l) }}>
                {lang === 'fr' ? 'EN' : 'FR'}
              </button>
            </span>
            <button className="icon-btn sm:hidden" aria-expanded={menu} aria-label={lang === 'fr' ? 'Réglages' : 'Settings'} onClick={() => setMenu(!menu)}>
              ⚙<span className="ml-1 text-xs">{lang === 'fr' ? 'Réglages' : 'Settings'}</span>
            </button>
            <AuthBox lang={lang} session={session} />
          </div>
          {menu && (
            <div role="dialog" aria-label={lang === 'fr' ? 'Réglages' : 'Settings'} className="card fixed left-3 right-3 top-[4.5rem] z-40 p-4 space-y-4 shadow-2xl rise sm:hidden">
              <div>
                <p className="text-xs uppercase tracking-wide text-ink/55 font-bold mb-1">{t.theme}</p>
                <div className="grid grid-cols-2 gap-2">
                  {(['finjaro', 'noir'] as const).map((th) => (
                    <button key={th} aria-pressed={theme === th} onClick={() => { setTheme(th); save('theme', th) }} className={`btn ${theme === th ? 'ring-2 ring-terracotta' : ''}`}>{th === 'noir' ? '☾ Noir' : '☀ Finjaro'}</button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-ink/55 font-bold mb-1">{lang === 'fr' ? 'Langue' : 'Language'}</p>
                <div className="grid grid-cols-2 gap-2">
                  {(['fr', 'en'] as const).map((l) => (
                    <button key={l} aria-pressed={lang === l} onClick={() => { setLang(l); save('lang', l) }} className={`btn ${lang === l ? 'ring-2 ring-terracotta' : ''}`}>{l === 'fr' ? 'Français' : 'English'}</button>
                  ))}
                </div>
              </div>
              <Access lang={lang} inline />
              <button className="btn w-full" onClick={() => setMenu(false)}>{lang === 'fr' ? 'Fermer' : 'Close'}</button>
            </div>
          )}
        </div>
      </header>

      <nav className="bottom-nav lg:hidden" role="tablist" aria-label={t.lessonsTab}>
        {VIEWS.map((v) => (
          <button key={v} role="tab" aria-selected={view === v} onClick={() => { setView(v); window.scrollTo({ top: 0 }) }}>
            <span className="ico" aria-hidden="true">{VIEW_ICON[v]}</span>{tabLabel(v)}
          </button>
        ))}
      </nav>

      {view === 'lettre' && <div id="contenu" tabIndex={-1} className="max-w-6xl mx-auto px-4 py-6 outline-none"><Lettre lang={lang} date={lettreDate || null} onDate={(d) => { window.location.hash = 'lettre/' + d }} /></div>}
      {view === 'outils' && <div id="contenu" tabIndex={-1} className="max-w-6xl mx-auto px-4 py-6 outline-none">{session ? <Outils lang={lang} session={session} /> : <LoginGate lang={lang} icon="🧰" {...G.outils} />}</div>}
      {view === 'progression' && <div id="contenu" tabIndex={-1} className="max-w-6xl mx-auto px-4 py-6 outline-none"><Progress lang={lang} done={done} onOpen={(id) => { go(lessons.findIndex((l) => l.id === id)); setView('lecons') }} /></div>}
      {view === 'entraide' && <div id="contenu" tabIndex={-1} className="max-w-6xl mx-auto px-4 py-6 outline-none">{session ? <Entraide lang={lang} session={session} /> : <LoginGate lang={lang} icon="🤝" {...G.entraide} />}</div>}
      {view === 'espaces' && <div id="contenu" tabIndex={-1} className="max-w-6xl mx-auto px-4 py-6 outline-none">{session ? <Espaces lang={lang} session={session} /> : <LoginGate lang={lang} icon="👥" {...G.espaces} />}</div>}
      {view === 'lecons' && (
        <div className="max-w-6xl mx-auto px-4 pt-5 space-y-5">
          <Accueil lang={lang} done={done} idx={idx} onOpen={(i) => go(i, true)} onChrono={() => setChrono(true)} onLettre={() => { window.location.hash = 'lettre' }}
            onResume={() => document.getElementById('lecon')?.scrollIntoView({ behavior: 'smooth', block: 'start' })} />
        </div>
      )}
      {burst > 0 && <Burst key={burst} />}
      {chrono && <Chrono lang={lang} sound={sound} onClose={() => setChrono(false)} onPlayed={recordDay} />}
      <div id="lecon" className={`scroll-mt-20 max-w-6xl mx-auto px-4 py-5 grid gap-5 md:grid-cols-[250px_1fr] ${view !== 'lecons' ? 'hidden' : ''}`}>
        <nav aria-label={t.lessons} className="min-w-0 md:sticky md:top-20 md:self-start md:max-h-[calc(100vh-6rem)] md:overflow-y-auto md:pr-1">
          <h2 className="text-xs uppercase tracking-wider text-ink/55 mb-2 font-bold">{TRACK_ICON[track]} {acuName(lang, track)}</h2>
          <select
            className="md:hidden w-full rounded-xl border border-ink/30 px-3 py-2.5 text-sm font-medium"
            aria-label={t.lessons}
            value={idx}
            onChange={(e) => go(Number(e.target.value))}
          >
            {trackLessons.map(({ l, i }) => <option key={l.id} value={i}>{i + 1}. {l.title[lang]}{done.includes(l.id) ? ' ✓' : ''}</option>)}
          </select>
          <ol className="hidden md:flex md:flex-col gap-1">
            {trackLessons.map(({ l, i }, k) => (
              <li key={l.id}>
                {(k === 0 || trackLessons[k - 1].l.group !== l.group) && (
                  <span className="block text-[11px] uppercase tracking-wide text-ink/45 mt-3 mb-1 font-semibold">{GROUPS[l.group ?? 'js'][lang]}</span>
                )}
                <button
                  onClick={() => go(i)}
                  aria-current={i === idx ? 'step' : undefined}
                  className={`w-full min-h-11 text-left rounded-xl px-2.5 py-2.5 text-sm flex items-start gap-2 ${i === idx ? 'bg-paper shadow-sm ring-1 ring-terracotta/50 font-semibold' : 'hover:bg-ink/5 text-ink/80'}`}
                >
                  <span className={`shrink-0 size-5 mt-px rounded-full grid place-items-center text-[10px] font-bold ${done.includes(l.id) ? 'grad text-white' : i === idx ? 'bg-terracotta/15 text-terracotta-dark' : 'bg-ink/8 text-ink/55'}`}>
                    {done.includes(l.id) ? <span aria-label={t.done}>✓</span> : i + 1}
                  </span>
                  <span className="min-w-0">{l.title[lang]}</span>
                </button>
              </li>
            ))}
          </ol>
        </nav>

        <main id="contenu" tabIndex={-1} className="space-y-4 min-w-0 outline-none">
          <div className="card p-5 sm:p-6 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-xl sm:text-2xl leading-tight">{lesson.title[lang]}</h2>
            <span className="chip shrink-0">{lesson.langue === 'c' ? '⚙️ C' : lesson.langue === 'cpp' ? '⚙️ C++' : lesson.lang === 'py' ? '🐍 Python' : '⚡ JavaScript'}</span>
          </div>
          {ai && <AgentPanel lang={lang} signedIn={!!session} ctx={{ title: (lesson.langue === 'c' ? '[C] ' : lesson.langue === 'cpp' ? '[C++] ' : lesson.lang === 'py' ? '[Python] ' : '[JavaScript] ') + lesson.title[lang], code, output: res?.output.join('\n') ?? '' }} />}
          <section>
            <h3 className="text-sm uppercase tracking-wide text-ink/55 mb-1.5">{t.explain}</h3>
            <p className="leading-relaxed text-[15px]">{lesson.explain[lang]}</p>
          </section>
          {lesson.example && (
            <section>
              <h3 className="text-sm uppercase tracking-wide text-ink/55 mb-1.5">{t.example}</h3>
              <pre className={pre}>{lesson.example}</pre>
            </section>
          )}
          </div>
          {lesson.predict && (
            <div className="card p-5 sm:p-6">
            <Predict key={lesson.id} lesson={lesson} lang={lang} hasNext={idx < lessons.length - 1}
              onCorrect={() => { if (sound) playSuccess(); void markPassed(lesson.predict!.answer) }} onNext={() => go(idx + 1)} />
            </div>
          )}
          {!lesson.predict && <section className="card p-5 sm:p-6 space-y-3">
            <h3 className="text-sm uppercase tracking-wide text-ink/55">{t.exercise}</h3>
            <p className="font-semibold text-[15px] rounded-xl border-l-4 border-terracotta bg-terracotta/8 px-3 py-2">{lesson.task[lang]}</p>
            <div className="grid gap-3 xl:grid-cols-2 items-start">
            <div className="space-y-3 min-w-0">
            <div className="ide">
              <div className="ide-bar">
                <span className="ide-dot bg-[#ff5f57]" /><span className="ide-dot bg-[#febc2e]" /><span className="ide-dot bg-[#28c840]" />
                <span className="ml-2 font-mono">{lesson.lang === 'py' ? 'main.py' : 'main.js'}</span>
                <button onClick={run} disabled={!!running} className="ml-auto btn btn-primary py-1 px-3 text-xs">▶ {t.run}</button>
              </div>
              <div className="md:hidden flex gap-1 overflow-x-auto px-2 py-1.5 border-b border-white/10" role="toolbar" aria-label={lang === 'fr' ? 'Symboles' : 'Symbols'}>
                {(lesson.lang === 'py' ? ['⇥', '(', ')', ':', '=', '"', "'", '[', ']', '{', '}', '#', '+', '-', '*', '/', '<', '>', '_', ','] : ['⇥', '(', ')', '{', '}', ';', '=', '"', "'", '[', ']', '.', '+', '-', '*', '/', '<', '>', '`', ',']).map((sym) => (
                  <button key={sym} type="button" className="shrink-0 min-w-9 h-9 rounded-lg bg-white/10 font-mono text-sm text-code-fg active:bg-white/25"
                    aria-label={sym === '⇥' ? 'Tab' : sym}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      const el = document.getElementById('editeur') as HTMLTextAreaElement | null
                      if (!el) return
                      const ins = sym === '⇥' ? '    ' : sym
                      const a = el.selectionStart, b = el.selectionEnd
                      const v = code.slice(0, a) + ins + code.slice(b)
                      setCode(v); save('code:' + lesson.id, v)
                      requestAnimationFrame(() => { el.focus(); el.selectionStart = el.selectionEnd = a + ins.length })
                    }}>{sym}</button>
                ))}
              </div>
              <textarea
                id="editeur"
                value={code}
                onChange={(e) => { setCode(e.target.value); save('code:' + lesson.id, e.target.value) }}
                onKeyDown={(e) => {
                  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); void run() }
                  if (e.key === 'Tab' && !e.shiftKey) {
                    e.preventDefault()
                    const el = e.currentTarget, a = el.selectionStart, b = el.selectionEnd
                    const v = code.slice(0, a) + '    ' + code.slice(b)
                    setCode(v); save('code:' + lesson.id, v)
                    requestAnimationFrame(() => { el.selectionStart = el.selectionEnd = a + 4 })
                  }
                }}
                spellCheck={false}
                autoCapitalize="off"
                autoCorrect="off"
                rows={10}
                className="p-4 font-mono text-sm leading-6"
                aria-label={t.exercise}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={run} disabled={!!running} className="btn btn-primary">{running ? '⏳' : '▶'} {t.run}</button>
              <button onClick={() => setShowHint(true)} className="btn">💡 {t.hint}</button>
              <button
                onClick={() => { setCode(lesson.solution); save('code:' + lesson.id, lesson.solution) }}
                className="btn"
              >
                {t.solution}
              </button>
              {lesson.lang === 'py' && (
                <button onClick={() => setDebug(!debug)} aria-pressed={debug} className="btn">🕰 {t.debug}</button>
              )}
              {ai && session && (
                <button onClick={proposeFix} disabled={fixBusy || !code.trim()} className="btn border-terracotta text-terracotta-dark">
                  {fixBusy ? t.thinking : '✨ ' + t.aiFix}
                </button>
              )}
              <button onClick={() => { setSound(!sound); save('sound', sound ? '0' : '1') }} aria-pressed={sound} className="icon-btn" title={t.sound} aria-label={t.sound}>
                {sound ? '🔊' : '🔇'}
              </button>
            </div>
            {stuck && !lesson.predict && (
              <div className="rounded-xl border-2 border-terracotta/60 bg-terracotta/10 p-3 flex gap-3 items-start" role="status">
                <AgentFace src={helper.face} initial={helper.name[0]} size="sm" />
                <div className="space-y-2 min-w-0">
                  <p className="text-sm"><strong>{helper.name} :</strong> {t.stuck}</p>
                  <div className="flex gap-2 flex-wrap">
                    <button className="btn py-1.5" onClick={() => { setShowHint(true); setStuckHint(true) }}>{t.hint}</button>
                    {ai && session && lesson.lang === 'py' && (
                      <button disabled={exoBusy} className="btn btn-primary py-1.5" onClick={makeExo}>{exoBusy ? t.thinking : '✨ ' + t.exoAsk}</button>
                    )}
                  </div>
                  {exoNote && <p className="text-sm text-terracotta-dark">{exoNote}</p>}
                  {stuckHint && <p className="sr-only">hint</p>}
                </div>
              </div>
            )}
            {fixNote && <p className="text-sm text-terracotta-dark" role="status">{fixNote}</p>}
            {showHint && <p className="rounded-xl bg-amber/12 border border-amber/50 p-3 text-sm">💡 {lesson.hint[lang]}</p>}
            </div>
            <div className="min-w-0">
            {running === 'py' ? (
              <div id="resultat" className="scroll-mt-20 scroll-mb-28 lg:scroll-mb-4 rounded-2xl border border-dashed border-terracotta/50 p-6 text-center text-sm" role="status">
                <p className="font-semibold">⏳ {lang === 'fr' ? 'Chargement de Python… (une seule fois)' : 'Loading Python… (only once)'}</p>
                <p className="text-ink/60 text-xs mt-1">{lang === 'fr' ? 'Quelques secondes la première fois ; ensuite c’est instantané.' : 'A few seconds the first time; instant afterwards.'}</p>
              </div>
            ) : res ? (
              <div id="resultat" className="space-y-2 scroll-mt-20 scroll-mb-28 lg:scroll-mb-4" aria-live="polite">
                <div className="ide">
                  <div className="ide-bar"><span>›_ {t.output}</span></div>
                  <pre className="p-4 text-sm whitespace-pre-wrap font-mono overflow-x-auto">{res.output.length ? res.output.join('\n') : t.noOutput}</pre>
                </div>
                {res.figures?.map((f, i) => <Chart key={i} fig={f} />)}
                {res.error && (() => {
                  const simple = expliqueErreur(res.error, lang)
                  return (
                    <div className="rounded-xl bg-terracotta/10 border border-terracotta/40 p-3 text-sm space-y-1">
                      <p className="font-semibold text-terracotta-dark">⚠️ {simple ?? t.error + ' ' + res.error}</p>
                      {simple && (
                        <details>
                          <summary className="cursor-pointer text-xs text-ink/65">{lang === 'fr' ? 'Détail technique' : 'Technical detail'}</summary>
                          <pre className="mt-1 text-xs font-mono whitespace-pre-wrap">{res.error}</pre>
                        </details>
                      )}
                    </div>
                  )
                })()}
                {res.passed === true && <p className="rounded-xl p-3 font-semibold bg-[color-mix(in_srgb,#22c55e_14%,transparent)] border border-[color-mix(in_srgb,#22c55e_45%,transparent)]">✅ {t.ok}</p>}
                {res.passed === true && golf && <p className="text-xs text-ink/70">⛳ {t.golf} : {golf.n} {t.chars} · {t.bestGolf} : {golf.best}</p>}
                {res.passed === false && !res.error && <p className="rounded-xl bg-terracotta/10 border border-terracotta/40 p-3 text-sm text-terracotta-dark">{t.ko}</p>}
                {res.passed && idx < lessons.length - 1 && (
                  <button onClick={() => go(idx + 1, true)} className="btn btn-dark">
                    {t.next} →
                  </button>
                )}
              </div>
            ) : (
              <div className="hidden xl:grid place-items-center rounded-2xl border border-dashed border-ink/20 p-8 text-center text-sm text-ink/55 min-h-48">
                <p>▶ {lang === 'fr' ? 'Lance ton code : le résultat et la correction s’affichent ici.' : 'Run your code: output and checks appear here.'}<br /><span className="text-xs">Ctrl + Entrée</span></p>
              </div>
            )}
            </div>
            </div>
          </section>}
          {exo && <ExoGenereModal lang={lang} exo={exo} packages={lesson.packages} onClose={() => setExo(null)} />}
          {debug && lesson.lang === 'py' && <div id="debug" className="scroll-mt-20"><StepDebugger lang={lang} code={code} packages={lesson.packages} onClose={() => setDebug(false)} /></div>}
          {fix && (
            <DiffModal lang={lang} original={code} fix={fix} onClose={() => setFix(null)}
              onAccept={() => { setCode(fix.fixed_code); save('code:' + lesson.id, fix.fixed_code); setFix(null); setRes(null) }} />
          )}
        </main>
      </div>
    </div>
  )
}
