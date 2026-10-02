import { useEffect, useState } from 'react'
import type { Session, AuthError } from '@supabase/supabase-js'
import { supabase, redirectTo } from './supabase'
import { ui, type Lang } from './i18n'

const TX = {
  fr: {
    google: 'Continuer avec Google', apple: 'Continuer avec Apple', orEmail: 'ou avec ton e-mail',
    badPassword: 'E-mail ou mot de passe incorrect. Si tu t’es inscrit avec Google ou Apple, utilise ce bouton (ton compte n’a pas de mot de passe), ou reçois un lien par e-mail.',
    wait: 'Un lien vient déjà d’être envoyé : attends une minute avant d’en redemander un.',
    usedLink: 'Ce lien a déjà servi ou a expiré : un lien ne marche qu’une fois. Redemande-en un.',
    notConfirmed: 'Ton e-mail n’est pas encore confirmé : clique sur le lien reçu par e-mail.',
    oneClick: 'Un clic sur le lien reçu suffit : il ne sert qu’une fois.',
  },
  en: {
    google: 'Continue with Google', apple: 'Continue with Apple', orEmail: 'or with your email',
    badPassword: 'Wrong email or password. If you signed up with Google or Apple, use that button (your account has no password), or get an email link.',
    wait: 'A link was just sent: wait a minute before asking for another one.',
    usedLink: 'This link was already used or has expired: a link works only once. Ask for a new one.',
    notConfirmed: 'Your email is not confirmed yet: click the link you received by email.',
    oneClick: 'One click on the link you receive is enough: it works only once.',
  },
} as const

/** Message lisible pour une erreur d'authentification (jamais le code brut). */
export function messageAuth(e: Pick<AuthError, 'code' | 'message' | 'status'> | null, lang: Lang): string {
  const x = TX[lang]
  if (!e) return ''
  const code = e.code ?? ''
  if (code === 'invalid_credentials') return x.badPassword
  if (code === 'over_email_send_rate_limit' || e.status === 429) return x.wait
  if (code === 'otp_expired' || /expired|invalid/i.test(e.message ?? '') && /link|token|otp/i.test(e.message ?? '')) return x.usedLink
  if (code === 'email_not_confirmed') return x.notConfirmed
  return ui[lang].authError
}

/** Les façons de se connecter : Google, Apple, puis e-mail (mot de passe ou lien). Même compte que sur finjaro.net. */
export function Connexion({ lang }: { lang: Lang }) {
  const t = ui[lang]
  const x = TX[lang]
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState('')
  if (!supabase) return null
  // Retour sur la page où l'on était (Learn), pas sur l'accueil de la place de marché.
  // Le fournisseur ajoute ses jetons après « # » : on revient sur /learn/ puis l'appli rouvre la page mémorisée.
  const retour = () => { try { sessionStorage.setItem('learn:retour', window.location.hash) } catch { /* ignoré */ } return redirectTo }
  const oauth = async (provider: 'google' | 'apple') => {
    const { error } = await supabase!.auth.signInWithOAuth({ provider, options: { redirectTo: retour() } })
    if (error) setMsg(messageAuth(error, lang))
  }
  const withPassword = async () => {
    const { error } = await supabase!.auth.signInWithPassword({ email, password })
    setMsg(messageAuth(error, lang))
  }
  const magic = async () => {
    const { error } = await supabase!.auth.signInWithOtp({ email, options: { emailRedirectTo: retour() } })
    setMsg(error ? messageAuth(error, lang) : t.linkSent + ' ' + x.oneClick)
  }
  return (
    <div className="space-y-2.5">
      <button onClick={() => oauth('google')} className="btn w-full justify-center gap-2 bg-paper">
        <svg aria-hidden="true" viewBox="0 0 48 48" className="size-5"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" /><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" /><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" /><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C36.9 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" /></svg>
        {x.google}
      </button>
      <button onClick={() => oauth('apple')} className="btn btn-dark w-full justify-center gap-2">
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5 fill-current"><path d="M16.4 12.6c0-2.4 2-3.6 2.1-3.6-1.1-1.7-2.9-1.9-3.5-1.9-1.5-.2-2.9.9-3.7.9-.8 0-1.9-.9-3.2-.8-1.6 0-3.1 1-4 2.4-1.7 3-.4 7.3 1.2 9.7.8 1.2 1.8 2.5 3 2.4 1.2 0 1.7-.8 3.1-.8 1.5 0 1.9.8 3.2.8 1.3 0 2.2-1.2 3-2.4.9-1.4 1.3-2.7 1.3-2.8 0 0-2.5-1-2.5-3.9zM14 5.4c.7-.8 1.1-1.9 1-3-1 0-2.1.7-2.8 1.5-.6.7-1.2 1.8-1 2.9 1 .1 2.1-.6 2.8-1.4z" /></svg>
        {x.apple}
      </button>
      <p className="text-center text-xs text-ink/55">— {x.orEmail} —</p>
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email" aria-label="email" autoComplete="email"
        className="w-full min-h-11 rounded-lg border border-ink/30 px-3 text-sm" />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t.password} aria-label={t.password} autoComplete="current-password"
        className="w-full min-h-11 rounded-lg border border-ink/30 px-3 text-sm" />
      <div className="flex gap-2">
        <button onClick={withPassword} disabled={!email || !password} className="btn btn-primary flex-1">{t.signIn}</button>
        <button onClick={magic} disabled={!email} className="btn flex-1">{t.magicLink}</button>
      </div>
      {msg && <p className="text-xs leading-relaxed rounded-lg bg-brass/15 border border-brass p-2" role="status">{msg}</p>}
    </div>
  )
}

export function AuthBox({ lang, session }: { lang: Lang; session: Session | null }) {
  const t = ui[lang]
  const [open, setOpen] = useState(false)
  // Les autres écrans (espaces, outils, entraide, atelier) peuvent ouvrir ce formulaire.
  useEffect(() => {
    const h = () => setOpen(true)
    window.addEventListener('learn:login', h)
    return () => window.removeEventListener('learn:login', h)
  }, [])
  useEffect(() => { if (session) setOpen(false) }, [session])
  if (!supabase) return null

  if (session) {
    return (
      <button className="btn px-3" onClick={() => supabase!.auth.signOut({ scope: 'local' })} title={(session.user.email ?? '') + ' — ' + t.signOut} aria-label={t.signOut}>
        <span aria-hidden="true" className="sm:hidden">⏻</span><span className="hidden sm:inline">{t.signOut}</span>
      </button>
    )
  }
  return (
    <>
      <button className="btn btn-dark" onClick={() => setOpen(true)}>{t.signIn}</button>
      {open && (
        <div role="dialog" aria-label={t.signIn} className="card fixed left-3 right-3 top-20 sm:left-auto sm:right-6 sm:w-96 z-40 p-4 space-y-2.5 shadow-2xl rise">
          <p className="font-bold">{t.signIn}</p>
          <p className="text-xs text-ink/70">{t.accountHelp}</p>
          <Connexion lang={lang} />
          <button className="text-xs underline text-ink/70 min-h-11" onClick={() => setOpen(false)}>{t.close}</button>
        </div>
      )}
    </>
  )
}

/** À l'ouverture, si l'on n'est pas connecté : un écran d'accueil propose de se connecter (une fois par appareil). */
export function Bienvenue({ lang, session }: { lang: Lang; session: Session | null }) {
  const [vu, setVu] = useState(() => { try { return localStorage.getItem('learn:bienvenue') === '1' } catch { return true } })
  if (!supabase || session || vu) return null
  const fermer = () => { try { localStorage.setItem('learn:bienvenue', '1') } catch { /* ignoré */ } setVu(true) }
  const fr = lang === 'fr'
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/55 backdrop-blur-sm p-4" role="dialog" aria-modal="true" aria-label={fr ? 'Bienvenue' : 'Welcome'}>
      <div className="card w-full max-w-md max-h-[92vh] overflow-y-auto p-5 sm:p-6 space-y-4 rise">
        <div className="flex items-center gap-3">
          <span aria-hidden="true" className="size-11 rounded-xl grad text-white grid place-items-center font-extrabold text-xl shadow-md">F</span>
          <div>
            <p className="font-display text-2xl leading-tight">{fr ? 'Bienvenue sur Finjaro Learn' : 'Welcome to Finjaro Learn'}</p>
            <p className="text-sm text-ink/65">{fr ? 'Apprends à coder et l’IA, avec Finia.' : 'Learn to code and AI, with Finia.'}</p>
          </div>
        </div>
        <p className="text-sm text-ink/75">{fr ? 'Connecte-toi avec ton compte Finjaro (le même que sur finjaro.net) pour garder ta progression et tes projets partout.' : 'Sign in with your Finjaro account (the same as on finjaro.net) to keep your progress and projects everywhere.'}</p>
        <Connexion lang={lang} />
        <button className="btn w-full" onClick={fermer}>{fr ? 'Continuer sans compte' : 'Continue without an account'}</button>
      </div>
    </div>
  )
}
