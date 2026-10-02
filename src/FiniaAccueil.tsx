import { useState } from 'react'
import type { Lang } from './i18n'

const lire = () => { try { return localStorage.getItem('learn:prenom') ?? '' } catch { return '' } }

/**
 * Finia ouvre chaque leçon comme une prof : elle salue, demande le prénom (gardé sur l'appareil seulement),
 * annonce la leçon du jour et le plan (expliquer, montrer, pratiquer, corriger). Texte écrit à l'avance : pas d'IA, rien d'envoyé.
 */
export default function FiniaAccueil({ lang, titre, pos, total, parcours, onGo }: {
  lang: Lang; titre: string; pos: number; total: number; parcours: string; onGo: () => void
}) {
  const [prenom, setPrenom] = useState(lire)
  const [saisie, setSaisie] = useState('')
  const [plusTard, setPlusTard] = useState(false)
  const fr = lang === 'fr'
  const enregistrer = () => {
    const p = saisie.trim().slice(0, 30)
    if (!p) return
    try { localStorage.setItem('learn:prenom', p) } catch { /* l'appareil refuse : on garde le prénom pour cette visite */ }
    setPrenom(p)
  }
  const demande = !prenom && !plusTard

  return (
    <section aria-label={fr ? 'Finia, ta prof' : 'Finia, your teacher'} className="rounded-2xl border border-terracotta/30 bg-gradient-to-br from-terracotta/10 to-amber/10 p-4 sm:p-5 flex gap-3 sm:gap-4 items-start">
      <span aria-hidden="true" className="size-11 sm:size-12 shrink-0 rounded-full grad text-white grid place-items-center font-extrabold text-lg shadow-md">F</span>
      <div className="min-w-0 flex-1 space-y-2.5">
        <p className="text-xs font-bold uppercase tracking-wider text-terracotta-dark">Finia</p>
        {demande ? (
          <>
            <p className="leading-relaxed">{fr ? 'Bonjour ! Je suis Finia, ta prof ici. Comment tu vas ? Avant de commencer : comment tu t’appelles ?' : 'Hello! I’m Finia, your teacher here. How are you? Before we start: what’s your name?'}</p>
            <form className="flex flex-wrap gap-2" onSubmit={(e) => { e.preventDefault(); enregistrer() }}>
              <input value={saisie} onChange={(e) => setSaisie(e.target.value)} maxLength={30} autoComplete="given-name"
                aria-label={fr ? 'Ton prénom' : 'Your first name'} placeholder={fr ? 'Ton prénom' : 'Your first name'}
                className="flex-1 min-w-0 basis-40 min-h-11 rounded-xl border border-brass bg-paper px-3" />
              <button className="btn btn-primary" disabled={!saisie.trim()}>{fr ? 'C’est moi' : 'That’s me'}</button>
              <button type="button" className="btn" onClick={() => setPlusTard(true)}>{fr ? 'Plus tard' : 'Later'}</button>
            </form>
            <p className="text-xs text-ink/55">{fr ? 'Ton prénom reste sur cet appareil.' : 'Your name stays on this device.'}</p>
          </>
        ) : (
          <>
            <p className="leading-relaxed">
              {fr
                ? <>Bonjour{prenom ? ` ${prenom}` : ''}, j’espère que tu vas bien ! Aujourd’hui, en <strong>{parcours}</strong>, leçon {pos} sur {total} : <strong>« {titre} »</strong>.</>
                : <>Hi{prenom ? ` ${prenom}` : ''}, I hope you’re doing well! Today in <strong>{parcours}</strong>, lesson {pos} of {total}: <strong>“{titre}”</strong>.</>}
            </p>
            <ol className="text-sm space-y-1 list-none">
              <li>① {fr ? 'Je t’explique l’idée.' : 'I explain the idea.'}</li>
              <li>② {fr ? 'Je te montre un exemple.' : 'I show you an example.'}</li>
              <li>③ {fr ? 'Tu pratiques, et je corrige ton code.' : 'You practise, and I check your code.'}</li>
            </ol>
            <p className="text-sm">{fr ? 'Reste avec moi jusqu’au bout, on y va !' : 'Stay with me until the end, let’s go!'}</p>
            <button className="btn btn-primary" onClick={onGo}>{fr ? 'C’est parti →' : 'Let’s go →'}</button>
          </>
        )}
      </div>
    </section>
  )
}
