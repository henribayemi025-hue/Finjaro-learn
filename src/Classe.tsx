import { useEffect, useRef, useState } from 'react'
import { agents } from './agents'
import AgentFace from './AgentFace'
import { askTutor, type Orientation } from './tutor'
import { lessons } from './lessons'
import { TRACKS } from './tracks'
import { supabase } from './supabase'
import type { Lang } from './i18n'

/**
 * LA CLASSE, en haut de chaque leçon (Beau, 02/10 : « les agents en haut, c'était bien ; elle parle, ok let's start,
 * elle explique, puis elle dit fais ça »). Les profs sont là ; celui de la matière mène la leçon pas à pas :
 * bonjour → explication → exemple → « à toi » → réaction au résultat (indice si ça bloque, bravo si c'est bon).
 * Le guidage est écrit à l'avance (pas d'IA, marche sans compte) ; les questions libres passent par learn-tutor.
 */

export type Etat = 'rien' | 'ok' | 'ko' | 'erreur'
const lire = (k: string) => { try { return localStorage.getItem(k) ?? '' } catch { return '' } }
const ecrire = (k: string, v: string) => { try { localStorage.setItem(k, v) } catch { /* ignoré */ } }
type Echange = { q: string; a: string; prof: string; ok?: boolean; orienter?: Orientation }
const lireFil = (k: string): Echange[] => {
  try {
    const v = JSON.parse(lire(k) || '[]')
    return Array.isArray(v) ? v.filter((e) => e && typeof e.q === 'string' && typeof e.a === 'string' && typeof e.prof === 'string').slice(-20) : []
  } catch { return [] }
}

/** Le prof de la matière : Maya pour JavaScript, Idris pour l'IA et Python, Finia ailleurs. */
export function profDe(track: string, langage: 'js' | 'py') {
  if (langage === 'js' && (track === 'prog' || track === 'projets')) return 'js'
  if (['dl', 'data', 'prompt', 'nlp', 'eng', 'outils'].includes(track)) return 'ia'
  return 'finia'
}

export default function Classe({ lang, titre, pos, total, parcours, track, langage, tache, indice, etat, erreur, aExemple, signedIn, ai, code, sortie, aller }: {
  lang: Lang; titre: string; pos: number; total: number; parcours: string; track: string; langage: 'js' | 'py'
  tache: string; indice: string; etat: Etat; erreur: string; aExemple: boolean; signedIn: boolean; ai: boolean; code: string; sortie: string
  aller: (id: 'explication' | 'exemple' | 'exercice') => void
}) {
  const fr = lang === 'fr'
  const prets = agents.filter((a) => a.ready)
  const [profId, setProfId] = useState(() => lire('learn:prof:' + track) || profDe(track, langage))
  const prof = prets.find((a) => a.id === profId) ?? prets[0]
  const [prenom, setPrenom] = useState(() => lire('learn:prenom'))
  const [saisie, setSaisie] = useState('')
  const [etape, setEtape] = useState(0)
  const [voirIndice, setVoirIndice] = useState(false)
  const [question, setQuestion] = useState('')
  const [parQuestions, setParQuestions] = useState(() => lire('learn:socratique') === '1')
  // La conversation avec le prof reste affichée et gardée par leçon (Beau, 07/10 : « il m'a répondu,
  // mais dès que je suis revenu écrire, ça avait disparu »). Le prof la reçoit aussi : il s'en souvient.
  const cleFil = `learn:fil:${track}:${titre}`
  const [fil, setFil] = useState<Echange[]>(() => lireFil(cleFil))
  useEffect(() => { setFil(lireFil(cleFil)) }, [cleFil])
  const [attente, setAttente] = useState('')
  // Une messagerie (Beau, 07/10 : « pour lire il faut descendre, puis remonter pour écrire ») :
  // les messages au-dessus, la saisie en bas, la boîte défile seule vers le dernier message —
  // sauf si l'élève est remonté relire, qu'on ne ramène pas de force.
  const boite = useRef<HTMLDivElement>(null)
  const saisie2 = useRef<HTMLTextAreaElement>(null)
  const formulaire = useRef<HTMLFormElement>(null)
  const enBas = useRef(true)
  useEffect(() => {
    const b = boite.current
    if (b && enBas.current) b.scrollTop = b.scrollHeight
  }, [fil, attente])
  // La question vient de partir : la saisie reste à l'écran, sous la conversation qui a grandi.
  useEffect(() => { if (attente) formulaire.current?.scrollIntoView({ block: 'nearest' }) }, [attente])
  const [busy, setBusy] = useState(false)
  const rangee = useRef<HTMLUListElement>(null)
  // Au téléphone, la rangée des profs défile : on montre le prof de la leçon.
  useEffect(() => { const el = rangee.current?.querySelector<HTMLElement>('[aria-pressed="true"]'); if (el && rangee.current) rangee.current.scrollLeft = el.offsetLeft - 8 }, [profId])

  // Le résultat de l'exercice fait réagir le prof.
  useEffect(() => { if (etat !== 'rien') setEtape(4) }, [etat])

  const choisir = (id: string) => { setProfId(id); ecrire('learn:prof:' + track, id) }
  const p = prenom ? (fr ? ` ${prenom}` : ` ${prenom}`) : ''
  const nom = prof.name

  let bulle: React.ReactNode
  let actions: React.ReactNode = null
  if (!prenom && etape === 0) {
    bulle = fr ? `Bonjour ! Je suis ${nom}, ton prof pour cette leçon. Comment tu vas ? Avant de commencer : comment tu t’appelles ?` : `Hello! I’m ${nom}, your teacher for this lesson. How are you? Before we start: what’s your name?`
    actions = (
      <form className="flex flex-wrap gap-2" onSubmit={(e) => { e.preventDefault(); const v = saisie.trim().slice(0, 30); if (v) { ecrire('learn:prenom', v); setPrenom(v) } }}>
        <input value={saisie} onChange={(e) => setSaisie(e.target.value)} maxLength={30} autoComplete="given-name" aria-label={fr ? 'Ton prénom' : 'Your first name'} placeholder={fr ? 'Ton prénom' : 'Your first name'}
          className="flex-1 min-w-0 basis-40 min-h-11 rounded-xl border border-brass bg-paper px-3" />
        <button className="btn btn-primary" disabled={!saisie.trim()}>{fr ? 'C’est moi' : 'That’s me'}</button>
        <button type="button" className="btn" onClick={() => setEtape(1)}>{fr ? 'Plus tard' : 'Later'}</button>
      </form>
    )
  } else if (etape <= 1) {
    bulle = fr
      ? <>Bonjour{p}, j’espère que tu vas bien ! OK, on commence. Aujourd’hui en <strong>{parcours}</strong>, leçon {pos} sur {total} : <strong>« {titre} »</strong>. D’abord, je t’explique l’idée : lis l’explication juste en dessous.</>
      : <>Hi{p}, I hope you’re well! OK, let’s start. Today in <strong>{parcours}</strong>, lesson {pos} of {total}: <strong>“{titre}”</strong>. First, I explain the idea: read the explanation just below.</>
    actions = <button className="btn btn-primary" onClick={() => { aller('explication'); setEtape(2) }}>{fr ? 'C’est parti →' : 'Let’s go →'}</button>
  } else if (etape === 2) {
    bulle = aExemple
      ? (fr ? 'Bien. Maintenant regarde l’exemple : essaie de deviner ce qu’il affiche avant de continuer.' : 'Good. Now look at the example: try to guess what it prints before moving on.')
      : (fr ? 'Bien. Relis la dernière phrase de l’explication : c’est elle qui va te servir.' : 'Good. Re-read the last sentence of the explanation: that’s what you’ll need.')
    actions = <div className="flex flex-wrap gap-2">
      {aExemple && <button className="btn" onClick={() => aller('exemple')}>{fr ? 'Voir l’exemple' : 'See the example'}</button>}
      <button className="btn btn-primary" onClick={() => setEtape(3)}>{fr ? 'J’ai compris, la suite →' : 'Got it, next →'}</button>
    </div>
  } else if (etape === 3) {
    bulle = <>{fr ? 'À toi maintenant ! ' : 'Your turn now! '}<strong>{tache}</strong> {fr ? 'Écris ton code dans l’éditeur, puis appuie sur ▶ Lancer. Je regarde le résultat avec toi.' : 'Write your code in the editor, then press ▶ Run. I’ll check the result with you.'}</>
    actions = <button className="btn btn-primary" onClick={() => aller('exercice')}>{fr ? 'J’y vais →' : 'On it →'}</button>
  } else {
    if (etat === 'ok') bulle = fr ? `Bravo${p} ! C’est exactement ça. Tu peux passer à la leçon suivante quand tu veux.` : `Well done${p}! That’s exactly it. Move on to the next lesson whenever you like.`
    else {
      bulle = <>{etat === 'erreur'
        ? (fr ? 'Pas grave, une erreur, ça s’apprend. Lis ce qu’elle dit : ' : 'No problem, errors are how we learn. Read what it says: ')
        : (fr ? 'Presque ! Le code tourne mais le résultat n’est pas encore le bon. ' : 'Almost! The code runs but the result isn’t right yet. ')}
        {erreur && <em>« {erreur} » </em>}{fr ? 'Corrige, puis relance.' : 'Fix it, then run again.'}
        {voirIndice && <span className="block mt-2 rounded-lg bg-paper border border-brass p-2">💡 {indice}</span>}</>
      actions = <div className="flex flex-wrap gap-2">
        {!voirIndice && <button className="btn btn-primary" onClick={() => setVoirIndice(true)}>💡 {fr ? 'Un indice' : 'A hint'}</button>}
        <button className="btn" onClick={() => aller('exercice')}>{fr ? 'Retour au code' : 'Back to the code'}</button>
      </div>
    }
  }

  const poser = async () => {
    const q = question.trim()
    if (!q || busy) return
    enBas.current = true
    setBusy(true); setAttente(q); setQuestion('')
    if (saisie2.current) { saisie2.current.style.height = ''; saisie2.current.focus() }
    const history = fil.filter((e) => e.prof === prof.id).slice(-3).flatMap((e) => [{ role: 'user' as const, text: e.q }, { role: 'model' as const, text: e.a }])
    const r = await askTutor({ question: q, code, lesson: `[${langage === 'py' ? 'Python' : 'JavaScript'}] ${titre}`, output: sortie, lang, agentId: prof.id, socratique: parQuestions, history })
    const a = r.answer ?? (r.error === 'quota' ? (fr ? 'Limite de questions atteinte pour aujourd’hui.' : 'Question limit reached for today.') : (fr ? `${nom} est indisponible pour l’instant, réessaie plus tard.` : `${nom} is unavailable right now, try again later.`))
    setFil((f) => {
      // Un refus (quota, panne) s'affiche mais ne se garde pas : il ne doit pas revenir au prof comme une vraie réponse.
      const suite = [...f, { q, a, prof: prof.id, ok: !!r.answer, orienter: r.orienter }].slice(-20)
      ecrire(cleFil, JSON.stringify(suite.filter((e) => e.ok)))
      return suite
    })
    setAttente(''); setBusy(false)
  }

  return (
    <section aria-label={fr ? 'Ta classe' : 'Your class'} className="rounded-2xl border border-terracotta/30 bg-gradient-to-br from-terracotta/8 to-amber/10 p-4 sm:p-5 space-y-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-terracotta-dark mb-2">{fr ? 'Tes profs' : 'Your teachers'}</p>
        <ul ref={rangee} className="flex sm:grid sm:grid-cols-3 lg:grid-cols-5 gap-2 overflow-x-auto -mx-1 px-1 pb-1 [scrollbar-width:none]">
          {agents.map((a) => (
            <li key={a.id} className="shrink-0 w-44 sm:w-auto">
              <button disabled={!a.ready} onClick={() => choisir(a.id)} aria-pressed={a.id === prof.id}
                className={`w-full h-full min-h-14 text-left rounded-xl border p-2 flex gap-2 items-center bg-paper ${a.id === prof.id ? 'border-terracotta ring-1 ring-terracotta' : 'border-brass/60'} ${a.ready ? 'hover:border-terracotta' : 'opacity-50'}`}>
                <span className="shrink-0"><AgentFace src={a.face} initial={a.name[0]} size="sm" /></span>
                <span className="min-w-0">
                  <span className="block font-semibold text-sm">{a.name}</span>
                  <span className="block text-[11px] leading-tight text-ink/65">{a.role[lang]}{a.ready ? '' : fr ? ' · bientôt' : ' · soon'}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex gap-3 items-start">
        <span className="shrink-0 hidden sm:block"><AgentFace src={prof.face} initial={prof.name[0]} size="md" /></span><span className="shrink-0 sm:hidden"><AgentFace src={prof.face} initial={prof.name[0]} size="sm" /></span>
        <div className="min-w-0 flex-1 space-y-2.5">
          <p className="text-xs font-bold text-terracotta-dark">{nom}</p>
          <div className="rounded-2xl rounded-tl-sm bg-paper border border-brass/60 px-4 py-3 leading-relaxed" aria-live="polite">{bulle}</div>
          {actions}
        </div>
      </div>

      <div className="rounded-xl border border-brass/60 bg-paper p-3 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold">{fr ? `Une question ? Demande à ${nom}` : `A question? Ask ${nom}`}</p>
          {fil.length > 0 && !busy && (
            <button type="button" className="text-xs text-ink/60 underline underline-offset-2 min-h-9 px-1"
              onClick={() => { setFil([]); ecrire(cleFil, '[]'); saisie2.current?.focus() }}>
              {fr ? 'Nouvelle conversation' : 'New conversation'}
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm" role="radiogroup" aria-label={fr ? 'Façon de répondre' : 'How to answer'}>
          {([false, true] as const).map((q) => (
            <label key={String(q)} className="flex items-center gap-1.5 cursor-pointer min-h-9">
              <input type="radio" name="facon" checked={parQuestions === q} className="accent-[var(--color-terracotta)] size-4" onChange={() => { setParQuestions(q); ecrire('learn:socratique', q ? '1' : '0') }} />
              {q ? (fr ? 'Par questions (sans donner la réponse)' : 'With questions (no answer given)') : (fr ? 'Normal (explique avec un exemple)' : 'Normal (explains with an example)')}
            </label>
          ))}
        </div>
        {(fil.length > 0 || attente) && (
          <div ref={boite} onScroll={(e) => { const b = e.currentTarget; enBas.current = b.scrollHeight - b.scrollTop - b.clientHeight < 48 }}
            className="max-h-[min(55vh,30rem)] overflow-y-auto overscroll-contain rounded-lg bg-cream/30 border border-brass/30 p-2.5 space-y-3" aria-live="polite">
            {fil.map((e, i) => {
              const qui = agents.find((a) => a.id === e.prof) ?? prof
              return (
                <div key={i} className="space-y-2">
                  <p className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-tr-sm bg-terracotta/10 border border-terracotta/25 px-3 py-2 text-sm whitespace-pre-wrap break-words">{e.q}</p>
                  <div className="flex gap-2 items-start"><span className="shrink-0"><AgentFace src={qui.face} initial={qui.name[0]} size="sm" /></span><p className="min-w-0 rounded-2xl rounded-tl-sm bg-paper border border-brass/60 px-3 py-2 text-sm whitespace-pre-wrap break-words">{e.a}</p></div>
                  {e.orienter && <Orienter o={e.orienter} lang={lang} />}
                </div>
              )
            })}
            {attente && (
              <div className="space-y-2">
                <p className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-tr-sm bg-terracotta/10 border border-terracotta/25 px-3 py-2 text-sm whitespace-pre-wrap break-words">{attente}</p>
                <div className="flex gap-2 items-center"><span className="shrink-0"><AgentFace src={prof.face} initial={prof.name[0]} size="sm" /></span><p className="text-sm text-ink/65 italic" role="status">{fr ? `${nom} réfléchit…` : `${nom} is thinking…`}</p></div>
              </div>
            )}
          </div>
        )}
        {!supabase || (ai && signedIn) ? (
          <form ref={formulaire} className="flex gap-2 items-end scroll-mb-28 sm:scroll-mb-4" onSubmit={(e) => { e.preventDefault(); void poser() }}>
            {/* Plusieurs lignes possibles : Entrée envoie, Maj+Entrée va à la ligne. */}
            <textarea ref={saisie2} rows={1} value={question} placeholder={fr ? `Écris à ${nom}…` : `Message ${nom}…`} aria-label={fr ? 'Ta question' : 'Your question'}
              onChange={(e) => { setQuestion(e.target.value); const t = e.currentTarget; t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight, 128) + 'px' }}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); void poser() } }}
              className="flex-1 min-w-0 min-h-11 max-h-32 resize-none rounded-xl border border-brass bg-cream/40 px-3 py-2.5 text-sm leading-snug" />
            <button className="btn btn-primary" disabled={!question.trim() || busy}>{busy ? '…' : fr ? 'Envoyer' : 'Send'}</button>
          </form>
        ) : !signedIn ? (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="flex-1 text-ink/70">{fr ? 'Connecte-toi pour poser tes questions aux profs.' : 'Sign in to ask the teachers your questions.'}</span>
            <button className="btn btn-primary" onClick={() => window.dispatchEvent(new Event('learn:login'))}>{fr ? 'Se connecter' : 'Sign in'}</button>
          </div>
        ) : (
          <p className="text-sm text-ink/70">{fr ? 'Les réponses des profs sont désactivées : active « Finia » en haut de la page.' : 'Teacher answers are off: turn on “Finia” at the top of the page.'}</p>
        )}
      </div>
    </section>
  )
}

/** Le bouton « va voir tel prof, telle leçon » : ouvre la leçon de départ avec le prof qui s'en occupe. */
function Orienter({ o, lang }: { o: Orientation; lang: Lang }) {
  const fr = lang === 'fr'
  const lecon = lessons.find((l) => l.id === o.lesson)
  const qui = agents.find((a) => a.id === o.prof && a.ready)
  const track = lecon?.group && TRACKS.find((t) => t.groups.includes(lecon.group!))?.key
  if (!lecon || !qui || !track) return null
  return (
    <div className="sm:ml-10 flex flex-wrap items-center gap-2 rounded-xl border border-terracotta/40 bg-paper px-3 py-2">
      <span className="shrink-0"><AgentFace src={qui.face} initial={qui.name[0]} size="sm" /></span>
      <span className="flex-1 min-w-0 basis-40 text-sm">{fr ? 'Leçon proposée : ' : 'Suggested lesson: '}<strong>{lecon.title[lang]}</strong>{fr ? `, avec ${qui.name}` : `, with ${qui.name}`}</span>
      <button className="btn btn-primary" onClick={() => { ecrire('learn:prof:' + track, qui.id); window.location.hash = '#/lecon/' + lecon.id }}>{fr ? 'J’y vais →' : 'Take me there →'}</button>
    </div>
  )
}
