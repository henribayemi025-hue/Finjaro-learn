import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { agents } from '../agents'
import AgentFace from '../AgentFace'
import { askTutor } from '../tutor'
import { profDe } from '../Classe'
import { Md } from '../Md'
import type { Lesson } from '../lessons'
import { lireBase, type RunResult, type TableVue } from '../runner'
import { contexteSql, tablesDe } from '../sqlBase'
import { expliqueErreur } from '../explainError'
import { contexteCours } from '../contexteCours'
import type { Lang } from '../i18n'

// TRAVAILLER UN SUJET AVEC LES AGENTS IA, dans le même cadre que l'Atelier de code (Beau, 14/10 : « quand je choisis de faire avec
// les agents IA, ça ouvre une page comme l'atelier de code ; si c'est neurosciences, c'est ça »). Plein écran sombre :
// à gauche la leçon · au milieu ce que demande le sujet (code et console, bac à prompts, notes) · à droite l'agent du sujet,
// discussion de hauteur fixe, saisie toujours en bas. Au téléphone : une vue à la fois, onglets en bas.
// La discussion est la même que celle de la classe (même clé locale) : on la retrouve en revenant à la leçon.

type Centre = 'code' | 'prompts' | 'notes' | 'base'
type Vue = 'lecon' | 'travail' | 'agent'
type Echange = { q: string; a: string; prof: string; ok?: boolean }

const T = {
  fr: {
    close: 'Revenir à la leçon', lesson: 'Leçon', explain: 'Explication', example: 'Exemple', task: 'À faire', hint: 'Indice', showHint: 'Voir l’indice',
    code: 'Code', prompts: 'Bac à prompts', notes: 'Notes', run: 'Lancer', running: 'Exécution…', output: 'Console', noRun: 'Lance le code pour voir le résultat ici.',
    ok: 'Ça marche !', ko: 'Pas encore : regarde la console, ou demande à l’agent.', noOutput: '(aucune sortie)',
    prompt: 'Ton prompt', send: 'Envoyer', answer: (n: string) => `Réponse de ${n}`, promptHelp: 'Écris un prompt, envoie-le, compare la réponse, puis améliore-le.',
    notesHelp: 'Tes notes et schémas pour ce sujet (gardés sur cet appareil).', ask: 'Pose ta question…', hello: (n: string, s: string) => `Bonjour ! Je suis ${n}. On travaille « ${s} » ensemble : demande-moi une explication, un exemple ou un indice.`,
    thinking: 'réfléchit…', aiOff: 'Active l’IA dans les réglages de Learn pour parler à l’agent.', needLogin: 'Connecte-toi pour parler à l’agent.',
    quota: 'Limite de questions atteinte pour aujourd’hui.', down: (n: string) => `${n} est indisponible pour l’instant, réessaie plus tard.`,
    prev: 'Leçon précédente', next: 'Leçon suivante', login: 'Connexion', tabs: { lecon: 'Leçon', travail: 'Travail', agent: 'Agent' }, points: 'Les points de la page',
    base: 'Base de données', tables: 'Tables', viewRows: 'Voir les données', baseHelp: 'La base de l’exercice est déjà prête : voici ses tables et leurs lignes. Écris ta requête dans l’onglet Code.',
    baseLoading: 'Chargement de la base…', baseFail: 'La base n’a pas pu se charger : vérifie ta connexion puis rouvre cet onglet.',
    rows: (n: number) => `${n} ligne${n > 1 ? 's' : ''}`, tryIt: 'Essayer : SELECT *',
    baseHello: 'La base de l’exercice est déjà prête : ouvre l’onglet « Base de données » pour voir ses tables avant d’écrire ta requête.',
    widen: 'Agrandir le chat', narrow: 'Réduire le chat', resize: 'Glisse pour changer la taille du chat',
  },
  en: {
    close: 'Back to the lesson', lesson: 'Lesson', explain: 'Explanation', example: 'Example', task: 'Your task', hint: 'Hint', showHint: 'Show the hint',
    code: 'Code', prompts: 'Prompt lab', notes: 'Notes', run: 'Run', running: 'Running…', output: 'Console', noRun: 'Run the code to see the result here.',
    ok: 'It works!', ko: 'Not yet: check the console, or ask the agent.', noOutput: '(no output)',
    prompt: 'Your prompt', send: 'Send', answer: (n: string) => `${n}’s answer`, promptHelp: 'Write a prompt, send it, compare the answer, then improve it.',
    notesHelp: 'Your notes and sketches for this topic (kept on this device).', ask: 'Ask your question…', hello: (n: string, s: string) => `Hi! I’m ${n}. Let’s work on “${s}” together: ask me for an explanation, an example or a hint.`,
    thinking: 'is thinking…', aiOff: 'Turn on AI in Learn’s settings to talk to the agent.', needLogin: 'Sign in to talk to the agent.',
    quota: 'Question limit reached for today.', down: (n: string) => `${n} is unavailable right now, try again later.`,
    prev: 'Previous lesson', next: 'Next lesson', login: 'Sign in', tabs: { lecon: 'Lesson', travail: 'Work', agent: 'Agent' }, points: 'The points on this page',
    base: 'Database', tables: 'Tables', viewRows: 'See the data', baseHelp: 'The exercise database is already set up: here are its tables and rows. Write your query in the Code tab.',
    baseLoading: 'Loading the database…', baseFail: 'The database could not load: check your connection, then reopen this tab.',
    rows: (n: number) => `${n} row${n === 1 ? '' : 's'}`, tryIt: 'Try: SELECT *',
    baseHello: 'The exercise database is already set up: open the “Database” tab to see its tables before writing your query.',
    widen: 'Make the chat wider', narrow: 'Make the chat narrower', resize: 'Drag to resize the chat',
  },
} as const

const lire = (k: string) => { try { return localStorage.getItem(k) ?? '' } catch { return '' } }
const ecrire = (k: string, v: string) => { try { localStorage.setItem(k, v) } catch { /* ignoré */ } }
const lireFil = (k: string): Echange[] => {
  try { const v = JSON.parse(lire(k) || '[]'); return Array.isArray(v) ? v.filter((e) => e && typeof e.q === 'string' && typeof e.a === 'string').slice(-20) : [] } catch { return [] }
}
/** Sujets où l'on travaille des prompts (le bac à prompts y est proposé). */
const PROMPTS = new Set(['prompt', 'nlp', 'eng', 'outils'])

export default function TravailSujet({ lang, lesson, track, code, onCode, onRun, res, running, ai, signedIn, onClose, onPrev, onNext }: {
  lang: Lang; lesson: Lesson; track: string; code: string; onCode: (v: string) => void; onRun: () => unknown
  res: RunResult | null; running: boolean; ai: boolean; signedIn: boolean; onClose: () => void; onPrev?: () => void; onNext?: () => void
}) {
  const t = T[lang]
  const titre = lesson.title[lang]
  const aCode = !lesson.predict && !lesson.lecture
  const aPrompts = PROMPTS.has(track) || lesson.group === 'pe'
  // SQL : la base de l'exercice existe déjà ; on la montre (tables et lignes) et on la décrit au prof.
  const estSql = lesson.lang === 'sql' && !!lesson.sql
  const setupSql = lesson.sql?.setup ?? ''
  const tables = useMemo(() => (estSql ? tablesDe(setupSql) : []), [estSql, setupSql])
  const [baseLue, setBaseLue] = useState<{ setup: string; tables: TableVue[] } | null>(null)
  const base = baseLue && baseLue.setup === setupSql ? baseLue.tables : null // null = pas encore lue pour cette leçon
  useEffect(() => {
    if (!estSql) return
    let ok = true
    void lireBase(setupSql).then((b) => { if (ok) setBaseLue({ setup: setupSql, tables: b }) })
    return () => { ok = false }
  }, [estSql, setupSql])
  // Largeur du chat de l'agent, réglable (Beau, 26/10 : « je dois pouvoir augmenter la taille du chat ») et gardée sur l'appareil.
  const bornesLarg = () => [300, Math.max(320, Math.min(900, Math.round((typeof window !== 'undefined' ? window.innerWidth : 1400) * 0.65)))] as const
  const [largChoisie, setLargChoisie] = useState(() => { const v = Number(lire('learn:agentW')); return v >= 300 ? v : (typeof window !== 'undefined' && window.innerWidth >= 1536 ? 440 : 380) })
  const larg = Math.min(largChoisie, bornesLarg()[1])
  const fixerLarg = (w: number) => { const [a, b] = bornesLarg(); const v = Math.round(Math.min(b, Math.max(a, w))); setLargChoisie(v); ecrire('learn:agentW', String(v)) }
  const glisser = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault()
    const x0 = e.clientX, w0 = larg, el = e.currentTarget
    el.setPointerCapture(e.pointerId)
    const mv = (ev: PointerEvent) => fixerLarg(w0 + (x0 - ev.clientX))
    const fin = () => { el.removeEventListener('pointermove', mv); el.removeEventListener('pointerup', fin); el.removeEventListener('pointercancel', fin) }
    el.addEventListener('pointermove', mv); el.addEventListener('pointerup', fin); el.addEventListener('pointercancel', fin)
  }
  const large = larg >= 560
  const [centre, setCentre] = useState<Centre>(aCode ? 'code' : 'notes')
  const [vue, setVue] = useState<Vue>('travail')
  const [voirIndice, setVoirIndice] = useState(false)
  const prets = agents.filter((a) => a.ready)
  const prof = prets.find((a) => a.id === (lire('learn:prof:' + track) || profDe(track, lesson.lang ?? 'js'))) ?? prets[0]
  const cleFil = `learn:fil:${track}:${titre}`
  const [fil, setFil] = useState<Echange[]>(() => lireFil(cleFil))
  const [question, setQuestion] = useState('')
  const [busy, setBusy] = useState(false)
  const [notes, setNotes] = useState(() => lire('learn:notes:' + lesson.id))
  const [prompt, setPrompt] = useState('')
  const [reponse, setReponse] = useState('')
  const [promptBusy, setPromptBusy] = useState(false)
  const boite = useRef<HTMLDivElement>(null)
  const enBas = useRef(true)
  const langage = lesson.langue === 'c' ? 'C' : lesson.langue === 'cpp' ? 'C++' : lesson.lang === 'py' ? 'Python' : lesson.lang === 'sql' ? 'SQL' : 'JavaScript'

  const fermer = useRef(onClose)
  useEffect(() => { fermer.current = onClose })
  useEffect(() => {
    const avant = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') fermer.current() }
    window.addEventListener('keydown', esc)
    return () => { document.body.style.overflow = avant; window.removeEventListener('keydown', esc) }
  }, [])

  useEffect(() => { const el = boite.current; if (el && enBas.current) el.scrollTop = el.scrollHeight }, [fil, busy, vue])

  const poser = async () => {
    const q = question.trim()
    if (!q || busy || !ai || !signedIn) return
    enBas.current = true; setBusy(true); setQuestion('')
    setFil((f) => [...f, { q, a: '', prof: prof.id }])
    const history = fil.filter((e) => e.prof === prof.id && e.ok !== false && e.a).slice(-3).flatMap((e) => [{ role: 'user' as const, text: e.q }, { role: 'model' as const, text: e.a }])
    const r = await askTutor({ question: q, code: aCode ? code : notes, lesson: contexteCours(lesson, lang, (() => { try { return JSON.parse(localStorage.getItem('learn:done') ?? '[]') as string[] } catch { return [] } })(), (estSql ? contexteSql(titre, setupSql, lang) : '') + '\n' + (lang === 'fr' ? 'Où il en est : ' : 'Where he is: ') + (!res ? (lang === 'fr' ? 'il n’a pas encore lancé son code' : 'he has not run his code yet') : res.passed ? (lang === 'fr' ? 'exercice réussi' : 'exercise passed') : res.error ? (lang === 'fr' ? 'son code a une erreur : ' : 'his code has an error: ') + res.error.slice(0, 200) : (lang === 'fr' ? 'il a lancé son code, le résultat n’est pas bon' : 'he ran his code, the result is wrong'))), output: res?.output.join('\n') ?? '', lang, agentId: prof.id, history })
    const a = r.answer ?? (r.error === 'quota' ? t.quota : t.down(prof.name))
    setFil((f) => {
      const suite = [...f.slice(0, -1), { q, a, prof: prof.id, ok: !!r.answer }].slice(-20)
      // Un refus (quota, panne) s'affiche mais ne se garde pas, comme dans la classe.
      ecrire(cleFil, JSON.stringify(suite.filter((e) => e.ok)))
      return suite
    })
    setBusy(false)
  }

  const envoyerPrompt = async () => {
    const p = prompt.trim()
    if (!p || promptBusy || !ai || !signedIn) return
    setPromptBusy(true); setReponse('')
    const r = await askTutor({ question: p, code: '', lesson: `[Prompt] ${titre}`, output: '', lang, agentId: prof.id })
    setReponse(r.answer ?? (r.error === 'quota' ? t.quota : t.down(prof.name)))
    setPromptBusy(false)
  }

  const btnTab = (actif: boolean) => `px-3 min-h-8 rounded-md text-[13px] font-semibold ${actif ? 'bg-white/10 text-white' : 'text-[#93A1B8] hover:text-white'}`
  const zoneTexte = 'w-full resize-none rounded-lg border border-white/12 bg-[#0B1120] p-3 text-[16px] lg:text-[13.5px] text-white placeholder:text-[#64748B]'

  // ───────── Gauche : la leçon ─────────
  const colonneLecon = (
    <div className="h-full overflow-y-auto p-4 space-y-4 text-[13.5px] leading-relaxed">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-[#93A1B8]">{t.lesson} · {langage}</p>
        <h2 className="mt-1 text-[17px] font-bold text-white leading-snug">{titre}</h2>
      </div>
      <section><p className="text-[11px] font-bold uppercase tracking-wider text-[#93A1B8] mb-1">{t.explain}</p><p className="text-[#C9D4E5]">{lesson.explain[lang]}</p></section>
      {lesson.example && <section><p className="text-[11px] font-bold uppercase tracking-wider text-[#93A1B8] mb-1">{t.example}</p>
        <pre className="rounded-lg bg-[#0A0F1C] border border-white/10 p-3 text-[12px] text-[#EDF1F8] overflow-x-auto whitespace-pre font-mono">{lesson.example}</pre></section>}
      {lesson.lecture && <section><p className="text-[11px] font-bold uppercase tracking-wider text-[#93A1B8] mb-1">{t.points}</p>
        <ul className="list-disc pl-5 space-y-1 text-[#C9D4E5]">{lesson.lecture[lang].map((x) => <li key={x}>{x}</li>)}</ul></section>}
      <section className="rounded-xl border border-[#FF8A3D]/40 bg-[#FF8A3D]/8 p-3">
        <p className="text-[11px] font-bold uppercase tracking-wider text-[#FF8A3D] mb-1">{t.task}</p>
        <p className="font-semibold text-white">{lesson.task[lang]}</p>
        {lesson.hint[lang] && (voirIndice
          ? <p className="mt-2 text-[#C9D4E5]">💡 {lesson.hint[lang]}</p>
          : <button onClick={() => setVoirIndice(true)} className="mt-2 text-[12px] font-semibold text-[#FF8A3D] underline">{t.showHint}</button>)}
      </section>
      {(onPrev || onNext) && (
        <div className="flex gap-2">
          {onPrev && <button onClick={onPrev} className="flex-1 rounded-full border border-white/15 min-h-10 text-[12px] text-[#C9D4E5] hover:bg-white/5">‹ {t.prev}</button>}
          {onNext && <button onClick={onNext} className="flex-1 rounded-full border border-white/15 min-h-10 text-[12px] text-[#C9D4E5] hover:bg-white/5">{t.next} ›</button>}
        </div>
      )}
    </div>
  )

  // ───────── Centre : ce que demande le sujet ─────────
  const onglets: Centre[] = [...(aCode ? ['code' as const] : []), ...(estSql ? ['base' as const] : []), ...(aPrompts ? ['prompts' as const] : []), 'notes']
  const colonneCentre = (
    <div className="h-full flex flex-col min-h-0">
      <div className="shrink-0 flex items-center gap-1 h-11 px-2 border-b border-white/10" role="tablist" aria-label={titre}>
        {onglets.map((k) => (
          <button key={k} role="tab" aria-selected={centre === k} onClick={() => setCentre(k)} className={btnTab(centre === k)}>
            {k === 'code' ? '‹/› ' + t.code : k === 'base' ? '🗄️ ' + t.base : k === 'prompts' ? '✦ ' + t.prompts : '✎ ' + t.notes}
          </button>
        ))}
        <span className="flex-1" />
        {centre === 'code' && (
          <button onClick={() => void onRun()} disabled={running} className="rounded-full bg-[#FF8A3D] px-4 min-h-9 text-[13px] font-bold text-[#0B1120] disabled:opacity-60">
            {running ? '⏳ ' + t.running : '▶ ' + t.run}
          </button>
        )}
      </div>
      {centre === 'code' && (
        <div className="flex-1 min-h-0 flex flex-col">
          {estSql && tables.length > 0 && (
            <div className="shrink-0 flex flex-wrap items-center gap-x-4 gap-y-1 px-3 py-2 border-b border-white/10 bg-white/5 text-[12px] font-mono text-[#C9D4E5]">
              <span className="font-sans text-[11px] font-bold uppercase tracking-wider text-[#93A1B8]">{t.tables}</span>
              {tables.map((x) => <span key={x.nom}><span className="text-[#FF8A3D]">{x.nom}</span>({x.colonnes.join(', ')})</span>)}
              <button onClick={() => setCentre('base')} className="ml-auto font-sans text-[12px] font-semibold text-[#FF8A3D] underline min-h-8">{t.viewRows}</button>
            </div>
          )}
          <textarea value={code} onChange={(e) => onCode(e.target.value)} spellCheck={false} autoCapitalize="off" autoCorrect="off" aria-label={t.code}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); void onRun() }
              if (e.key === 'Tab' && !e.shiftKey) {
                e.preventDefault()
                const el = e.currentTarget, a = el.selectionStart, b = el.selectionEnd
                onCode(code.slice(0, a) + '    ' + code.slice(b))
                requestAnimationFrame(() => { el.selectionStart = el.selectionEnd = a + 4 })
              }
            }}
            className="flex-1 min-h-40 w-full resize-none bg-[#0B1120] p-4 font-mono text-[14px] leading-6 text-[#EDF1F8] outline-none" />
          <div className="shrink-0 h-[38%] min-h-32 border-t border-white/10 flex flex-col">
            <p className="shrink-0 px-3 pt-2 text-[11px] font-bold uppercase tracking-wider text-[#93A1B8]">›_ {t.output}</p>
            <div className="flex-1 min-h-0 overflow-y-auto px-3 pb-3 font-mono text-[12.5px] leading-relaxed" aria-live="polite">
              {!res ? <p className="text-[#64748B]">{t.noRun}</p> : <>
                <pre className="whitespace-pre-wrap text-[#EDF1F8]">{res.output.length ? res.output.join('\n') : t.noOutput}</pre>
                {res.error && <pre className="whitespace-pre-wrap text-[#FDA4AF]">{res.error}</pre>}
                {res.error && expliqueErreur(res.error, lang, code) && <p className="mt-2 rounded-lg border border-[#FF8A3D]/40 bg-[#FF8A3D]/10 p-2 font-sans text-[13px] text-[#EDF1F8]">💡 {expliqueErreur(res.error, lang, code)}</p>}
                {res.passed === true && <p className="mt-1 font-sans font-semibold text-[#5FC8C0]">✅ {t.ok}</p>}
                {res.passed === false && <p className="mt-1 font-sans text-[#FDA4AF]">{t.ko}</p>}
              </>}
            </div>
          </div>
        </div>
      )}
      {centre === 'base' && (
        <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-4">
          <p className="text-[12px] text-[#93A1B8]">{t.baseHelp}</p>
          {base === null ? <p className="text-[13px] text-[#93A1B8]" role="status">{t.baseLoading}</p>
            : base.length === 0 ? <p className="text-[13px] text-[#FDA4AF]" role="alert">{t.baseFail}</p>
            : base.map((tb) => (
              <section key={tb.nom} className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <h3 className="font-mono text-[14px] font-bold text-[#FF8A3D]">{tb.nom}</h3>
                  <span className="text-[11px] text-[#93A1B8]">{t.rows(tb.total)}</span>
                  <button onClick={() => { onCode(`SELECT * FROM ${tb.nom};`); setCentre('code') }}
                    className="ml-auto rounded-full border border-white/15 px-3 min-h-9 text-[12px] font-semibold text-[#C9D4E5] hover:bg-white/5">{t.tryIt}</button>
                </div>
                <div className="overflow-x-auto rounded-lg border border-white/10">
                  <table className="w-full text-left text-[12.5px] font-mono">
                    <thead><tr className="bg-white/10 text-[#93A1B8]">{tb.colonnes.map((c) => <th key={c} className="px-2.5 py-1.5 font-semibold whitespace-nowrap">{c}</th>)}</tr></thead>
                    <tbody>{tb.lignes.map((l, i) => (
                      <tr key={i} className="border-t border-white/10">{l.map((v, j) => <td key={j} className="px-2.5 py-1.5 whitespace-nowrap text-[#EDF1F8]">{v === null ? <span className="text-[#64748B]">NULL</span> : String(v)}</td>)}</tr>
                    ))}</tbody>
                  </table>
                </div>
              </section>
            ))}
        </div>
      )}
      {centre === 'prompts' && (
        <div className="flex-1 min-h-0 overflow-y-auto p-3 grid gap-3 xl:grid-cols-2 content-start">
          <p className="xl:col-span-2 text-[12px] text-[#93A1B8]">{t.promptHelp}</p>
          <label className="space-y-1.5 min-w-0"><span className="text-[11px] font-bold uppercase tracking-wider text-[#93A1B8]">{t.prompt}</span>
            <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={12} maxLength={4000} className={zoneTexte + ' font-mono'} />
            <button onClick={() => void envoyerPrompt()} disabled={!prompt.trim() || promptBusy || !ai || !signedIn}
              className="rounded-full bg-[#FF8A3D] px-4 min-h-10 text-[13px] font-bold text-[#0B1120] disabled:opacity-40">{promptBusy ? '⏳' : '➤ ' + t.send}</button>
          </label>
          <div className="space-y-1.5 min-w-0"><p className="text-[11px] font-bold uppercase tracking-wider text-[#93A1B8]">{t.answer(prof.name)}</p>
            <div className="min-h-48 rounded-lg border border-white/12 bg-white/5 p-3 text-[13.5px] text-[#EDF1F8]" aria-live="polite">
              {promptBusy ? <span className="text-[#93A1B8]">{prof.name} {t.thinking}</span> : reponse ? <Md text={reponse} className="md-sombre" /> : null}
            </div>
          </div>
        </div>
      )}
      {centre === 'notes' && (
        <div className="flex-1 min-h-0 flex flex-col p-3 gap-2">
          <p className="text-[12px] text-[#93A1B8]">{t.notesHelp}</p>
          <textarea value={notes} onChange={(e) => { setNotes(e.target.value); ecrire('learn:notes:' + lesson.id, e.target.value) }} aria-label={t.notes}
            className={zoneTexte + ' flex-1 min-h-40 leading-6'} />
        </div>
      )}
    </div>
  )

  // ───────── Droite : l'agent du sujet (hauteur fixe) ─────────
  const colonneAgent = (
    <div className="h-full flex flex-col min-h-0">
      <div className="shrink-0 flex items-center gap-2.5 h-14 px-3 border-b border-white/10">
        <span className="scale-75 -m-1.5"><AgentFace src={prof.face} initial={prof.name[0]} size="sm" thinking={busy} /></span>
        <div className="min-w-0 flex-1"><p className="text-[13px] font-bold text-white">{prof.name}</p><p className="text-[11px] text-[#93A1B8] truncate">{prof.role[lang]}</p></div>
        <button onClick={() => fixerLarg(large ? 380 : 640)} aria-label={large ? t.narrow : t.widen} title={large ? t.narrow : t.widen}
          className="hidden lg:grid size-9 shrink-0 place-items-center rounded-full text-[16px] text-[#C9D4E5] hover:bg-white/10">{large ? '⤡' : '⤢'}</button>
      </div>
      <div ref={boite} onScroll={(e) => { const el = e.currentTarget; enBas.current = el.scrollHeight - el.scrollTop - el.clientHeight < 48 }}
        className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3 text-[13.5px] leading-relaxed" aria-live="polite">
        <div className="rounded-2xl rounded-tl-sm bg-white/6 px-3 py-2 text-[#EDF1F8]">{t.hello(prof.name, titre)}</div>
        {estSql && <div className="rounded-2xl rounded-tl-sm bg-white/6 px-3 py-2 text-[#EDF1F8]">{t.baseHello}</div>}
        {fil.map((e, i) => (
          <div key={i} className="space-y-2">
            <div className="flex justify-end"><p className="max-w-[85%] rounded-2xl rounded-tr-sm bg-[#FF8A3D] text-[#0B1120] px-3 py-2 font-medium whitespace-pre-wrap break-words">{e.q}</p></div>
            {e.a ? <div className={`rounded-2xl rounded-tl-sm px-3 py-2 ${e.ok === false ? 'bg-[#FB7185]/12 text-[#FDA4AF]' : 'bg-white/6 text-[#EDF1F8]'}`}><Md text={e.a} className="md-sombre" /></div>
              : <p className="text-[12px] text-[#93A1B8]" role="status">{prof.name} {t.thinking}</p>}
          </div>
        ))}
      </div>
      <div className="shrink-0 border-t border-white/10 p-3 space-y-2">
        {!ai ? <p className="text-[12px] text-[#93A1B8]">{t.aiOff}</p>
          : !signedIn ? <div className="flex items-center gap-2 text-[12px] text-[#93A1B8]"><span className="flex-1">{t.needLogin}</span>
            <button className="rounded-full bg-[#FF8A3D] px-3 min-h-9 font-bold text-[#0B1120]" onClick={() => window.dispatchEvent(new Event('learn:login'))}>{t.login}</button></div>
          : null}
        <div className="flex gap-2 items-end">
          <textarea value={question} onChange={(e) => setQuestion(e.target.value)} rows={2} maxLength={2000} placeholder={t.ask} aria-label={t.ask} disabled={!ai || !signedIn}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void poser() } }}
            className={zoneTexte + ' rounded-xl py-2 disabled:opacity-50'} />
          <button onClick={() => void poser()} disabled={!question.trim() || busy || !ai || !signedIn} aria-label={t.send}
            className="size-11 shrink-0 grid place-items-center rounded-full bg-[#FF8A3D] text-[#0B1120] font-bold disabled:opacity-40">➤</button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0B1120] text-[#EDF1F8]" role="region" aria-label={titre}>
      <div className="shrink-0 flex items-center gap-2 px-3 py-2 border-b border-white/10 bg-[#0F172A]" style={{ paddingTop: 'max(0.5rem, env(safe-area-inset-top))' }}>
        <button onClick={onClose} aria-label={t.close} className="size-10 grid place-items-center rounded-full text-xl text-[#C9D4E5] hover:bg-white/10">✕</button>
        <p className="min-w-0 flex-1 font-semibold text-white truncate">{titre}</p>
        <span className="hidden sm:inline rounded-full border border-white/12 px-3 py-1 text-[12px] text-[#C9D4E5]">{langage}</span>
      </div>
      <div className="flex-1 min-h-0 lg:grid lg:grid-cols-[300px_minmax(0,1fr)_var(--aw)] 2xl:grid-cols-[340px_minmax(0,1fr)_var(--aw)]" style={{ '--aw': larg + 'px' } as CSSProperties}>
        <div className={`${vue === 'lecon' ? 'block' : 'hidden'} lg:block h-full min-h-0 bg-[#0F172A] lg:border-r border-white/10`}>{colonneLecon}</div>
        <div className={`${vue === 'travail' ? 'flex' : 'hidden'} lg:flex h-full min-h-0 flex-col`}>{colonneCentre}</div>
        <div className={`${vue === 'agent' ? 'block' : 'hidden'} lg:block relative h-full min-h-0 bg-[#0F172A] lg:border-l border-white/10`}>
          <div role="separator" aria-orientation="vertical" tabIndex={0} aria-label={t.resize} aria-valuenow={larg} aria-valuemin={300} aria-valuemax={bornesLarg()[1]}
            onPointerDown={glisser}
            onKeyDown={(e) => { if (e.key === 'ArrowLeft') { e.preventDefault(); fixerLarg(larg + 32) } else if (e.key === 'ArrowRight') { e.preventDefault(); fixerLarg(larg - 32) } }}
            className="hidden lg:block absolute inset-y-0 -left-1 z-10 w-2 cursor-col-resize touch-none hover:bg-[#FF8A3D]/40 focus-visible:bg-[#FF8A3D]/60 outline-none" />
          {colonneAgent}
        </div>
      </div>
      <nav className="lg:hidden shrink-0 grid grid-cols-3 border-t border-white/10 bg-[#0F172A]" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }} role="tablist" aria-label={titre}>
        {(['lecon', 'travail', 'agent'] as const).map((k) => (
          <button key={k} role="tab" aria-selected={vue === k} onClick={() => setVue(k)}
            className={`min-h-12 flex flex-col items-center justify-center gap-0.5 text-[11px] font-semibold ${vue === k ? 'text-[#FF8A3D]' : 'text-[#93A1B8]'}`}>
            <span aria-hidden="true" className="text-base">{k === 'lecon' ? '📖' : k === 'travail' ? (aCode ? '‹/›' : '✎') : '💬'}</span>{t.tabs[k]}
          </button>
        ))}
      </nav>
    </div>
  )
}
