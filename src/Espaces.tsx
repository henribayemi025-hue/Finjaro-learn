import { useCallback, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'
import AtelierEspace, { type Espace } from './espace/AtelierEspace'
import { ui, type Lang } from './i18n'


const btn = 'rounded-md bg-terracotta text-white px-3 py-1.5 text-sm disabled:opacity-40'
const inp = 'rounded-md border border-ink/30 bg-white/60 px-2 py-1.5 text-sm'

export default function Espaces({ lang, session }: { lang: Lang; session: Session | null }) {
  const t = ui[lang]
  const [list, setList] = useState<Espace[]>([])
  const [current, setCurrent] = useState<Espace | null>(null)
  const [nom, setNom] = useState('')
  const [type, setType] = useState('amis')
  const [note, setNote] = useState('')

  const load = useCallback(async () => {
    if (!supabase || !session) return
    const { data } = await supabase.from('learn_espaces').select('id,nom,type').order('created_at', { ascending: false })
    setList((data ?? []) as Espace[])
  }, [session])

  // Rejoindre via un lien d'invitation (?join=jeton), même si la connexion vient après.
  useEffect(() => {
    if (!supabase || !session) return
    const q = new URLSearchParams(window.location.search).get('join')
    let token = q
    try { if (q) sessionStorage.setItem('learn:join', q); else token = sessionStorage.getItem('learn:join') } catch { /* ignoré */ }
    ;(async () => {
      if (token) {
        const { data, error } = await supabase!.rpc('learn_rejoindre', { p_token: token })
        try { sessionStorage.removeItem('learn:join') } catch { /* ignoré */ }
        window.history.replaceState({}, '', window.location.pathname)
        setNote(error ? t.joinError : t.joined)
        await load()
        if (data) {
          const { data: e } = await supabase!.from('learn_espaces').select('id,nom,type').eq('id', data).single()
          if (e) setCurrent(e as Espace)
        }
      } else await load()
    })()
  }, [session, load, t.joinError, t.joined])

  if (!supabase) return null
  if (!session) return <p className="rounded-md bg-brass/15 border border-brass p-3 text-sm">{t.spacesLogin}</p>
  // Un espace ouvert prend tout l'écran, comme un projet de l'Atelier.
  if (current) return <AtelierEspace key={current.id} lang={lang} session={session} espace={current} espaces={list.length ? list : [current]} onSwitch={setCurrent} onBack={() => { setCurrent(null); void load() }} />

  const create = async () => {
    const { data, error } = await supabase!.rpc('learn_creer_espace', { p_nom: nom, p_type: type })
    if (error) { setNote(t.aiError); return }
    setNom(''); await load()
    const e = { id: data as string, nom, type }
    setCurrent(e)
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">{t.spaces}</h2>
      {note && <p className="text-sm rounded-md bg-brass/15 border border-brass p-2" role="status">{note}</p>}
      <div className="flex flex-wrap gap-2 items-center">
        <input value={nom} onChange={(e) => setNom(e.target.value)} maxLength={80} placeholder={t.spaceName} aria-label={t.spaceName} className={inp + ' flex-1 min-w-40'} />
        <select value={type} onChange={(e) => setType(e.target.value)} className={inp} aria-label="type">
          <option value="amis">{t.typeAmis}</option>
          <option value="equipe">{t.typeEquipe}</option>
          <option value="classe">{t.typeClasse}</option>
        </select>
        <button className={btn} disabled={!nom.trim()} onClick={create}>{t.createSpace}</button>
      </div>
      {list.length === 0 ? <p className="text-sm text-ink/70">{t.noSpaces}</p> : (
        <ul className="grid gap-2 sm:grid-cols-2">
          {list.map((e) => (
            <li key={e.id}>
              <button onClick={() => setCurrent(e)} className="w-full text-left rounded-lg border border-brass/50 bg-paper p-3">
                <span className="font-serif font-bold">{e.nom}</span>
                <span className="block text-xs text-ink/60">{e.type}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
