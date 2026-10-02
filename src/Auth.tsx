import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase, redirectTo } from './supabase'
import { ui, type Lang } from './i18n'

export function AuthBox({ lang, session }: { lang: Lang; session: Session | null }) {
  const t = ui[lang]
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState('')
  // Les autres écrans (espaces, outils, entraide) peuvent ouvrir ce formulaire.
  useEffect(() => {
    const h = () => setOpen(true)
    window.addEventListener('learn:login', h)
    return () => window.removeEventListener('learn:login', h)
  }, [])
  if (!supabase) return null

  if (session) {
    return (
      <button className="btn px-3" onClick={() => supabase!.auth.signOut({ scope: 'local' })} title={(session.user.email ?? '') + ' — ' + t.signOut} aria-label={t.signOut}>
        <span aria-hidden="true" className="sm:hidden">⏻</span><span className="hidden sm:inline">{t.signOut}</span>
      </button>
    )
  }
  if (!open) {
    return (
      <button className="btn btn-dark" onClick={() => setOpen(true)}>
        {t.signIn}
      </button>
    )
  }

  const withPassword = async () => {
    const { error } = await supabase!.auth.signInWithPassword({ email, password })
    setMsg(error ? t.authError : '')
  }
  const magic = async () => {
    const { error } = await supabase!.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo } })
    setMsg(error ? t.authError : t.linkSent)
  }

  return (
    <div role="dialog" aria-label={t.signIn} className="card fixed left-3 right-3 top-20 sm:left-auto sm:right-6 sm:w-80 z-40 p-4 space-y-2.5 shadow-2xl rise">
      <p className="font-bold">{t.signIn}</p>
      <p className="text-xs text-ink/70">{t.accountHelp}</p>
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email" aria-label="email"
        className="w-full rounded-lg border border-ink/30 px-3 py-2 text-sm" />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t.password} aria-label={t.password}
        className="w-full rounded-lg border border-ink/30 px-3 py-2 text-sm" />
      <div className="flex gap-2">
        <button onClick={withPassword} disabled={!email || !password} className="btn btn-primary flex-1">{t.signIn}</button>
        <button onClick={magic} disabled={!email} className="btn flex-1">{t.magicLink}</button>
      </div>
      {msg && <p className="text-xs" role="status">{msg}</p>}
      <button className="text-xs underline text-ink/70" onClick={() => setOpen(false)}>{t.close}</button>
    </div>
  )
}
