import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import Espaces from './Espaces'
import { TRACK_ICON } from './Curriculum'
import Accueil from './Accueil'
import Parcours from './Parcours'
import Atelier from './Atelier'
import { nouvelId, sauverProjet } from './atelierStore'
import Lettre from './Lettre'
import LoginGate from './LoginGate'
import Chrono from './Chrono'
import { TRACKS, trackSlug, trackFromSlug } from './tracks'
import Progress, { recordDay, loadDays, streaks } from './Progress'
import Outils from './outils/Outils'
import Entraide from './entraide/Entraide'
import { eu as entraideUi } from './entraide/i18n'
import { o as outilsUi } from './outils/i18n'
import { AuthBox, Bienvenue, messageAuth } from './Auth'
import { supabase } from './supabase'
import { ui, type Lang } from './i18n'
import { lessons } from './lessons'
import AgentPanel from './AgentPanel'
import FiniaAccueil from './FiniaAccueil'
import DiffModal from './DiffModal'
import { askFix, type FixProposal } from './tutor'
import { playError, playSuccess } from './sounds'
import Chart from './Chart'
import StepDebugger from './StepDebugger'
import Predict from './Predict'
import Lecture from './Lecture'
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
const VIEWS = ['lecons', 'atelier', 'lettre', 'progression', 'espaces', 'outils', 'entraide'] as const
const BAS = ['lecons', 'atelier', 'lettre', 'progression'] as const
const PLUS = ['espaces', 'outils', 'entraide'] as const
const VIEW_ICON = { lecons: '📚', atelier: '🛠️', lettre: '📰', progression: '📈', espaces: '👥', outils: '🧰', entraide: '🤝' } as const
/** Vignettes de la barre des rubriques : photo si fournie (public/onglets/…, droits vérifiés), sinon pictogramme sur dégradé. */
const VIEW_IMG: Partial<Record<keyof typeof VIEW_ICON, string>> = {
  lecons: import.meta.env.BASE_URL + 'visages/02.jpg',
  ...Object.fromEntries((['atelier', 'lettre', 'progression', 'espaces', 'outils', 'entraide'] as const).map((v) => [v, import.meta.env.BASE_URL + 'images/onglets/' + v + '.jpg'])),
}


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

type Route = { v: 'accueil' } | { v: 'parcours'; k: string } | { v: 'lecon'; id: string } | { v: 'lettre'; date: string | null } | { v: 'atelier'; id: string | null } | { v: 'progression' | 'espaces' | 'outils' | 'entraide' }
function lireRoute(): Route {
  const h = decodeURIComponent(window.location.hash.replace(/^#\/?/, ''))
  const [a, b] = h.split('/')
  if (a === 'lettre') return { v: 'lettre', date: /^\d{4}-\d{2}-\d{2}$/.test(b ?? '') ? b : null }
  if (a === 'parcours' && b && trackFromSlug(b)) return { v: 'parcours', k: trackFromSlug(b)! }
  if (a === 'parcours') return { v: 'accueil' }
  if (a === 'lecon' && b && lessons.some((l) => l.id === b)) return { v: 'lecon', id: b }
  if (a === 'atelier') return { v: 'atelier', id: b && /^[a-z0-9]{4,40}$/.test(b) ? b : null }
  if (a === 'progression' || a === 'espaces' || a === 'outils' || a === 'entraide') return { v: a }
  if (!h && new URLSearchParams(window.location.search).has('join')) return { v: 'espaces' }
  return { v: 'accueil' }
}

export default function App() {
  const [lang, setLang] = useState<Lang>(getLang)
  const [session, setSession] = useState<Session | null>(null)
  // ───────── Une adresse par écran : #/ (accueil), #/parcours/<clé>, #/lecon/<id>, #/progression, #/espaces, #/outils, #/entraide, #/lettre[/AAAA-MM-JJ] ─────────
  const [route, setRoute] = useState<Route>(() => lireRoute())
  useEffect(() => {
    const h = () => { setRoute(lireRoute()); window.scrollTo({ top: 0 }) }
    window.addEventListener('hashchange', h)
    return () => window.removeEventListener('hashchange', h)
  }, [])
  const view = route.v === 'accueil' || route.v === 'parcours' || route.v === 'lecon' ? 'lecons' : route.v
  const lettreDate = route.v === 'lettre' ? route.date : null
  const nav = (h: string) => { if (window.location.hash !== h) window.location.hash = h; else window.scrollTo({ top: 0 }) }
  const setView = (v: typeof VIEWS[number]) => nav(v === 'lecons' ? '#/' : '#/' + v)
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
  const [plus, setPlus] = useState(false)
  const [authNote, setAuthNote] = useState('')
  const t = ui[lang]
  // Le débogueur s'ouvre sous l'exercice : on l'amène à l'écran, sinon on croit que le bouton ne fait rien.
  useEffect(() => { if (debug) requestAnimationFrame(() => document.getElementById('debug')?.scrollIntoView({ behavior: 'smooth', block: 'start' })) }, [debug])

  useEffect(() => {
    if (!supabase) return
    // Retour d'un lien de connexion refusé (déjà utilisé, expiré) : message clair au lieu d'une page muette.
    const h = window.location.hash
    if (h.startsWith('#error')) {
      const q = new URLSearchParams(h.slice(1))
      setAuthNote(messageAuth({ code: q.get('error_code') ?? '', message: q.get('error_description') ?? '', status: 403 }, lang))
      history.replaceState(null, '', window.location.pathname + '#/')
    }
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((e, s) => {
      setSession(s)
      // Après Google, Apple ou un lien e-mail : on rouvre la page où l'on était.
      if (e === 'SIGNED_IN') {
        let r = ''
        try { r = sessionStorage.getItem('learn:retour') ?? ''; sessionStorage.removeItem('learn:retour') } catch { /* ignoré */ }
        if (r.startsWith('#/')) window.location.hash = r
        setAuthNote('')
      }
    })
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

  /** Ouvre l'écran d'une leçon (nouvelle adresse : le retour du navigateur ramène où on était). */
  const ouvre = (i: number) => nav('#/lecon/' + lessons[i].id)
  useEffect(() => {
    if (route.v !== 'lecon') return
    const i = lessons.findIndex((l) => l.id === route.id)
    if (i >= 0 && i !== idx) go(i)
  }, [route]) // eslint-disable-line react-hooks/exhaustive-deps
  const go = (i: number) => {
    setIdx(i)
    save('last', lessons[i].id)
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
      const bas = window.innerHeight - (window.innerWidth < 1280 ? 96 : 16)
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
  const pos = trackLessons.findIndex(({ i }) => i === idx) + 1
  const tabLabel = (v: typeof VIEWS[number]) => v === 'lecons' ? t.lessonsTab : v === 'atelier' ? (lang === 'fr' ? 'Atelier' : 'Workshop') : v === 'lettre' ? (lang === 'fr' ? 'Lettre IA' : 'AI Letter') : v === 'progression' ? t.progressTab : v === 'espaces' ? t.spaces : v === 'entraide' ? entraideUi(lang).tab : outilsUi[lang].tab
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

  const tuiles = (compact: boolean) => (
    <ul className={`flex overflow-x-auto [scrollbar-width:none] ${compact ? 'gap-1 2xl:gap-2 py-1 px-1' : 'gap-3 sm:gap-4 pt-1.5 pb-1 -mx-1 px-1.5'}`}>
      {VIEWS.map((v) => (
        <li key={v} className="shrink-0">
          <button role="tab" aria-selected={view === v} onClick={() => setView(v)} className={`group flex flex-col items-center ${compact ? 'gap-1 w-[4.4rem] 2xl:w-[4.8rem]' : 'gap-1.5 w-[4.6rem] sm:w-20'}`}>
            <span className={`block ${compact ? 'size-10' : 'size-16 sm:size-[4.5rem]'} rounded-xl overflow-hidden transition ${view === v ? 'ring-[3px] ring-terracotta ring-offset-2 ring-offset-cream shadow-md' : 'ring-1 ring-brass group-hover:-translate-y-0.5 group-hover:shadow-md'}`}>
              {VIEW_IMG[v]
                ? <img src={VIEW_IMG[v]} alt="" loading="lazy" className="size-full object-cover" />
                : <span aria-hidden="true" className="size-full grid place-items-center text-2xl bg-gradient-to-br from-terracotta/20 to-amber/25">{VIEW_ICON[v]}</span>}
            </span>
            <span className={`${compact ? 'text-[11px]' : 'text-xs sm:text-[13px]'} leading-tight text-center whitespace-nowrap ${view === v ? 'font-bold text-ink' : 'font-semibold text-ink/70'}`}>{tabLabel(v)}</span>
          </button>
        </li>
      ))}
    </ul>
  )

  return (
    <div className="min-h-screen pb-[calc(5.5rem+env(safe-area-inset-bottom))] xl:pb-0">
      <a href="#contenu" className="skip-link">{t.skip}</a>
      <Bienvenue lang={lang} session={session} />
      {authNote && !session && (
        <div role="alert" className="fixed left-3 right-3 top-20 sm:left-auto sm:right-6 sm:w-96 z-40 card p-4 text-sm space-y-2 shadow-2xl">
          <p>{authNote}</p>
          <div className="flex gap-2"><button className="btn btn-primary flex-1" onClick={() => { setAuthNote(''); window.dispatchEvent(new Event('learn:login')) }}>{t.signIn}</button><button className="btn" onClick={() => setAuthNote('')}>{t.close}</button></div>
        </div>
      )}
      <header className="sticky top-0 z-30 border-b border-brass bg-[color-mix(in_srgb,var(--color-cream)_82%,transparent)] backdrop-blur-xl">
        <div className="max-w-6xl 2xl:max-w-7xl mx-auto px-4 h-16 xl:h-[4.75rem] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0 xl:shrink-0">
            <span aria-hidden="true" className="size-9 shrink-0 rounded-xl grad text-white grid place-items-center font-extrabold text-lg shadow-md">F</span>
            <h1 className="text-lg font-extrabold whitespace-nowrap hidden sm:block" title={t.tagline}>Finjaro <span className="grad-text">Learn</span></h1>
            <h1 className="sr-only sm:hidden">Finjaro Learn</h1>
          </div>
          <nav aria-label={lang === 'fr' ? 'Rubriques' : 'Sections'} className="hidden xl:block min-w-0" role="tablist">{tuiles(true)}</nav>
          <div className="flex items-center gap-1.5">
            {serie > 0 && <span className="chip hidden md:inline-flex text-sm py-1.5" title={lang === 'fr' ? 'Jours d’affilée avec au moins une leçon réussie (sur cet appareil)' : 'Days in a row with at least one lesson passed (on this device)'}>🔥 {serie} {lang === 'fr' ? (serie > 1 ? 'jours' : 'jour') : (serie > 1 ? 'days' : 'day')}</span>}
            <button onClick={() => { setAi(!ai); save('ai', ai ? '0' : '1') }} aria-pressed={ai} title={t.aiHelp} aria-label={lang === 'fr' ? 'Finia, ton assistante IA' : 'Finia, your AI assistant'}
              className={`icon-btn ${ai ? 'grad text-white border-transparent' : ''}`}>✨<span className="ml-1 text-xs sm:text-sm">Finia</span></button>
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

      {/* Sous 1280 px : la rangée de vignettes sous l'en-tête (pas dans une leçon ni un projet : la barre du bas suffit). */}
      {route.v !== 'lecon' && !(route.v === 'atelier' && route.id) && (
        <nav aria-label={lang === 'fr' ? 'Rubriques' : 'Sections'} className="xl:hidden max-w-6xl mx-auto px-4 pt-4" role="tablist">{tuiles(false)}</nav>
      )}

      <nav className="bottom-nav xl:hidden" role="tablist" aria-label={t.lessonsTab}>
        {BAS.map((v) => (
          <button key={v} role="tab" aria-selected={view === v} onClick={() => { setPlus(false); setView(v) }}>
            <span className="ico" aria-hidden="true">{VIEW_ICON[v]}</span>{tabLabel(v)}
          </button>
        ))}
        <button role="tab" aria-selected={(PLUS as readonly string[]).includes(view)} aria-expanded={plus} onClick={() => setPlus(!plus)}>
          <span className="ico" aria-hidden="true">⋯</span>{lang === 'fr' ? 'Plus' : 'More'}
        </button>
      </nav>
      {plus && (
        <div role="dialog" aria-label={lang === 'fr' ? 'Plus' : 'More'} className="card fixed left-3 right-3 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-40 p-2 shadow-2xl rise xl:hidden">
          {PLUS.map((v) => (
            <button key={v} onClick={() => { setPlus(false); setView(v) }} className={`w-full min-h-12 rounded-xl px-4 text-left font-semibold flex items-center gap-3 ${view === v ? 'bg-terracotta/12' : 'hover:bg-ink/5'}`}>
              <span aria-hidden="true" className="text-xl">{VIEW_ICON[v]}</span>{tabLabel(v)}
            </button>
          ))}
        </div>
      )}

      <main id="contenu" tabIndex={-1} className="outline-none">
      {route.v === 'atelier' && <div className="max-w-6xl mx-auto px-4 py-5"><Atelier lang={lang} id={route.id} ai={ai} signedIn={!!session} onOpen={(i) => nav('#/atelier/' + i)} onBack={() => nav('#/atelier')} /></div>}
      {view === 'lettre' && <div className="max-w-6xl mx-auto px-4 py-6 outline-none"><Lettre lang={lang} date={lettreDate} onDate={(d) => nav('#/lettre/' + d)} /></div>}
      {view === 'outils' && <div className="max-w-6xl mx-auto px-4 py-6 outline-none">{session ? <Outils lang={lang} session={session} /> : <LoginGate lang={lang} icon="🧰" {...G.outils} />}</div>}
      {view === 'progression' && <div className="max-w-6xl mx-auto px-4 py-6 outline-none"><Progress lang={lang} done={done} onOpen={(id) => nav('#/lecon/' + id)} /></div>}
      {view === 'entraide' && <div className="max-w-6xl mx-auto px-4 py-6 outline-none">{session ? <Entraide lang={lang} session={session} /> : <LoginGate lang={lang} icon="🤝" {...G.entraide} />}</div>}
      {view === 'espaces' && <div className="max-w-6xl mx-auto px-4 py-6 outline-none">{session ? <Espaces lang={lang} session={session} /> : <LoginGate lang={lang} icon="👥" {...G.espaces} />}</div>}
      {route.v === 'accueil' && (
        <div className="max-w-6xl mx-auto px-4 py-5 outline-none">
          <Accueil lang={lang} done={done} idx={idx} onOpen={ouvre} onTrack={(k) => nav('#/parcours/' + trackSlug(k))} onChrono={() => setChrono(true)} onLettre={() => nav('#/lettre')}
            onResume={() => ouvre(idx)} />
        </div>
      )}
      {route.v === 'parcours' && (
        <div className="max-w-4xl mx-auto px-4 py-5 outline-none">
          <Parcours lang={lang} k={route.k} done={done} current={lesson.id} onOpen={ouvre} onBack={() => nav('#/')} />
        </div>
      )}
      {burst > 0 && <Burst key={burst} />}
      {chrono && <Chrono lang={lang} sound={sound} onClose={() => setChrono(false)} onPlayed={recordDay} />}
      {route.v === 'lecon' && <div id="lecon" className="max-w-6xl mx-auto px-4 py-4">
        <div className="space-y-4 min-w-0">
          <div className="sticky top-16 xl:top-[4.75rem] z-20 -mx-4 px-4 py-2 bg-[color-mix(in_srgb,var(--color-cream)_88%,transparent)] backdrop-blur-xl border-b border-brass flex items-center gap-2">
            <button className="btn px-3" onClick={() => nav('#/parcours/' + trackSlug(track))} aria-label={(lang === 'fr' ? 'Retour au parcours ' : 'Back to track ') + acuName(lang, track)}>←<span className="hidden sm:inline"> {TRACK_ICON[track]} {acuName(lang, track)}</span></button>
            <span className="flex-1 text-center text-sm font-semibold text-ink/70 truncate">{lang === 'fr' ? 'Leçon' : 'Lesson'} {pos} / {trackLessons.length}</span>
            <button className="icon-btn" disabled={pos <= 1} onClick={() => ouvre(trackLessons[pos - 2].i)} aria-label={lang === 'fr' ? 'Leçon précédente' : 'Previous lesson'}>‹</button>
            <button className="icon-btn" disabled={pos >= trackLessons.length} onClick={() => ouvre(trackLessons[pos].i)} aria-label={lang === 'fr' ? 'Leçon suivante' : 'Next lesson'}>›</button>
          </div>
          <div className="card p-5 sm:p-6 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-xl sm:text-2xl leading-tight">{lesson.title[lang]}</h2>
            <span className="chip shrink-0">{lesson.langue === 'c' ? '⚙️ C' : lesson.langue === 'cpp' ? '⚙️ C++' : lesson.lang === 'py' ? '🐍 Python' : '⚡ JavaScript'}</span>
          </div>
          <FiniaAccueil key={lesson.id} lang={lang} titre={lesson.title[lang]} pos={pos} total={trackLessons.length} parcours={acuName(lang, track)}
            onGo={() => document.getElementById('explication')?.scrollIntoView({ behavior: 'smooth', block: 'start' })} />
          <section id="explication" className="scroll-mt-32">
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
              onCorrect={() => { if (sound) playSuccess(); void markPassed(lesson.predict!.answer) }} onNext={() => ouvre(idx + 1)} />
            </div>
          )}
          {lesson.lecture && <Lecture key={lesson.id} lang={lang} points={lesson.lecture[lang]} fait={done.includes(lesson.id)} hasNext={idx < lessons.length - 1}
            onOk={() => { if (sound) playSuccess(); void markPassed('') }} onNext={() => ouvre(idx + 1)} />}
          {!lesson.predict && !lesson.lecture && <section className="card p-5 sm:p-6 space-y-3">
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
              <button className="btn" onClick={async () => {
                const ext = lesson.lang === 'py' ? 'py' : 'js'
                const id = nouvelId()
                await sauverProjet({ id, titre: lesson.title[lang], lang: lesson.lang === 'py' ? 'py' : 'js', principal: 'main.' + ext, fichiers: [{ chemin: 'main.' + ext, contenu: code }], maj: new Date().toISOString() })
                nav('#/atelier/' + id)
              }}>🛠️ {lang === 'fr' ? 'Ouvrir dans l’éditeur' : 'Open in the editor'}</button>
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
              <div id="resultat" className="scroll-mt-20 scroll-mb-28 xl:scroll-mb-4 rounded-2xl border border-dashed border-terracotta/50 p-6 text-center text-sm" role="status">
                <p className="font-semibold">⏳ {lang === 'fr' ? 'Chargement de Python… (une seule fois)' : 'Loading Python… (only once)'}</p>
                <p className="text-ink/60 text-xs mt-1">{lang === 'fr' ? 'Quelques secondes la première fois ; ensuite c’est instantané.' : 'A few seconds the first time; instant afterwards.'}</p>
              </div>
            ) : res ? (
              <div id="resultat" className="space-y-2 scroll-mt-20 scroll-mb-28 xl:scroll-mb-4" aria-live="polite">
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
                  <button onClick={() => ouvre(idx + 1)} className="btn btn-dark">
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
          {ai && <AgentPanel lang={lang} signedIn={!!session} ctx={{ title: (lesson.langue === 'c' ? '[C] ' : lesson.langue === 'cpp' ? '[C++] ' : lesson.lang === 'py' ? '[Python] ' : '[JavaScript] ') + lesson.title[lang], code, output: res?.output.join('\n') ?? '' }} />}
          {exo && <ExoGenereModal lang={lang} exo={exo} packages={lesson.packages} onClose={() => setExo(null)} />}
          {debug && lesson.lang === 'py' && <div id="debug" className="scroll-mt-20"><StepDebugger lang={lang} code={code} packages={lesson.packages} onClose={() => setDebug(false)} /></div>}
          {fix && (
            <DiffModal lang={lang} original={code} fix={fix} onClose={() => setFix(null)}
              onAccept={() => { setCode(fix.fixed_code); save('code:' + lesson.id, fix.fixed_code); setFix(null); setRes(null) }} />
          )}
        </div>
      </div>}
      </main>
    </div>
  )
}
