import { supabase } from './supabase'
import type { Lang } from './i18n'

const T = {
  fr: { btn: 'Se connecter', off: 'La connexion n’est pas encore branchée sur cette adresse.', free: 'Les leçons restent ouvertes sans compte.' },
  en: { btn: 'Sign in', off: 'Sign-in is not connected on this address yet.', free: 'Lessons stay open without an account.' },
} as const

/** Écran d'accueil d'une section réservée aux comptes : explique, montre ce qu'on y fait, et ouvre la connexion. */
export default function LoginGate({ lang, icon, title, text, points }: { lang: Lang; icon: string; title: string; text: string; points: string[] }) {
  const t = T[lang]
  return (
    <div className="card p-6 sm:p-10 text-center max-w-2xl mx-auto rise">
      <div aria-hidden="true" className="size-16 mx-auto rounded-2xl grad grid place-items-center text-3xl shadow-lg">{icon}</div>
      <h2 className="text-2xl mt-4">{title}</h2>
      <p className="text-ink/70 mt-2">{text}</p>
      <ul className="mt-5 grid gap-2 sm:grid-cols-3 text-sm text-left">
        {points.map((p) => <li key={p} className="rounded-xl bg-terracotta/8 border border-brass p-3">✓ {p}</li>)}
      </ul>
      <div className="mt-6">
        {supabase
          ? <button className="btn btn-primary px-6 py-3 text-base" onClick={() => window.dispatchEvent(new Event('learn:login'))}>{t.btn}</button>
          : <p className="text-sm text-ink/70">{t.off}</p>}
        <p className="text-xs text-ink/60 mt-3">{t.free}</p>
      </div>
    </div>
  )
}
