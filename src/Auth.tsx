import { useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase, redirectTo } from './supabase'
import { ui, type Lang } from './i18n'

export function AuthBox({ lang, session }: { lang: Lang; session: Session | null }) {
  const t = ui[lang]
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState('')
  if (!supabase) return null

  if (session) {
    return (
      <button className="text-sm underline" onClick={() => supabase!.auth.signOut()} title={session.user.email ?? ''}>
        {t.signOut}
      </button>
    )
  }
  if (!open) {
    return (
      <button className="text-sm border border-ink/30 rounded-md px-3 py-1.5" onClick={() => setOpen(true)}>
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
    <div className="absolute right-4 top-16 z-10 w-72 rounded-xl border-2 border-brass bg-paper p-3 space-y-2 shadow-lg">
      <p className="text-xs text-ink/70">{t.accountHelp}</p>
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email" aria-label="email"
        className="w-full rounded-md border border-ink/30 bg-white/60 px-2 py-1.5 text-sm" />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t.password} aria-label={t.password}
        className="w-full rounded-md border border-ink/30 bg-white/60 px-2 py-1.5 text-sm" />
      <div className="flex gap-2">
        <button onClick={withPassword} disabled={!email || !password} className="flex-1 rounded-md bg-terracotta text-white text-sm py-1.5 disabled:opacity-40">{t.signIn}</button>
        <button onClick={magic} disabled={!email} className="flex-1 rounded-md border border-ink/30 text-sm py-1.5 disabled:opacity-40">{t.magicLink}</button>
      </div>
      {msg && <p className="text-xs" role="status">{msg}</p>}
      <button className="text-xs underline" onClick={() => setOpen(false)}>{t.close}</button>
    </div>
  )
}
