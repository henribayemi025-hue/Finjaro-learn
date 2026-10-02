import { useEffect, useRef, useState } from 'react'
import { agents } from './agents'
import AgentFace from './AgentFace'
import { askTutor } from './tutor'
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
  const [reponse, setReponse] = useState('')
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
    setBusy(true); setReponse('')
    const r = await askTutor({ question: q, code, lesson: `[${langage === 'py' ? 'Python' : 'JavaScript'}] ${titre}`, output: sortie, lang, agentId: prof.id, socratique: parQuestions })
    setBusy(false)
    setReponse(r.answer ?? (r.error === 'quota' ? (fr ? 'Limite de questions atteinte pour aujourd’hui.' : 'Question limit reached for today.') : (fr ? `${nom} est indisponible pour l’instant, réessaie plus tard.` : `${nom} is unavailable right now, try again later.`)))
    setQuestion('')
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
        <p className="text-sm font-semibold">{fr ? `Une question ? Demande à ${nom}` : `A question? Ask ${nom}`}</p>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm" role="radiogroup" aria-label={fr ? 'Façon de répondre' : 'How to answer'}>
          {([false, true] as const).map((q) => (
            <label key={String(q)} className="flex items-center gap-1.5 cursor-pointer min-h-9">
              <input type="radio" name="facon" checked={parQuestions === q} className="accent-[var(--color-terracotta)] size-4" onChange={() => { setParQuestions(q); ecrire('learn:socratique', q ? '1' : '0') }} />
              {q ? (fr ? 'Par questions (sans donner la réponse)' : 'With questions (no answer given)') : (fr ? 'Normal (explique avec un exemple)' : 'Normal (explains with an example)')}
            </label>
          ))}
        </div>
        {!supabase || (ai && signedIn) ? (
          <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); void poser() }}>
            <input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder={fr ? `Pose ta question à ${nom}…` : `Ask ${nom} a question…`} aria-label={fr ? 'Ta question' : 'Your question'}
              className="flex-1 min-w-0 min-h-11 rounded-xl border border-brass bg-cream/40 px-3 text-sm" />
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
        {reponse && <div className="flex gap-2 items-start"><AgentFace src={prof.face} initial={prof.name[0]} size="sm" /><p className="rounded-2xl rounded-tl-sm bg-cream/60 border border-brass/60 px-3 py-2 text-sm whitespace-pre-wrap" role="status">{reponse}</p></div>}
      </div>
    </section>
  )
}
