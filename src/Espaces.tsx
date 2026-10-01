import { useCallback, useEffect, useRef, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { askTutor } from './tutor'
import { agents } from './agents'
import { ui, type Lang } from './i18n'

interface Espace { id: string; nom: string; type: string }
interface Msg { id: number; user_id: string | null; agent_id: string | null; texte: string; created_at: string }

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
    try { if (q) sessionStorage.setItem('join', q); else token = sessionStorage.getItem('join') } catch { /* ignoré */ }
    ;(async () => {
      if (token) {
        const { data, error } = await supabase!.rpc('learn_rejoindre', { p_token: token })
        try { sessionStorage.removeItem('join') } catch { /* ignoré */ }
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
  if (current) return <Salon lang={lang} session={session} espace={current} onBack={() => setCurrent(null)} />

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

function Salon({ lang, session, espace, onBack }: { lang: Lang; session: Session; espace: Espace; onBack: () => void }) {
  const t = ui[lang]
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [text, setText] = useState('')
  const [invite, setInvite] = useState('')
  const [online, setOnline] = useState(1)
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState('')
  const chan = useRef<ReturnType<NonNullable<typeof supabase>['channel']> | null>(null)
  const bottom = useRef<HTMLDivElement>(null)

  const fetchMsgs = useCallback(async () => {
    const { data } = await supabase!.from('learn_messages').select('id,user_id,agent_id,texte,created_at')
      .eq('espace_id', espace.id).order('id', { ascending: false }).limit(100)
    setMsgs(((data ?? []) as Msg[]).reverse())
  }, [espace.id])

  useEffect(() => {
    fetchMsgs()
    // Canal Realtime privé (autorisé aux membres par RLS) : diffusion + présence.
    const ch = supabase!.channel(`learn:espace:${espace.id}`, { config: { private: true, presence: { key: session.user.id } } })
    ch.on('broadcast', { event: 'msg' }, () => fetchMsgs())
      .on('presence', { event: 'sync' }, () => setOnline(Object.keys(ch.presenceState()).length))
      .subscribe((s) => { if (s === 'SUBSCRIBED') ch.track({ at: Date.now() }) })
    chan.current = ch
    return () => { supabase!.removeChannel(ch) }
  }, [espace.id, session.user.id, fetchMsgs])

  useEffect(() => { bottom.current?.scrollIntoView?.({ block: 'end' }) }, [msgs])

  const ping = () => chan.current?.send({ type: 'broadcast', event: 'msg', payload: {} })

  const send = async () => {
    const q = text.trim()
    if (!q || busy) return
    setBusy(true); setText(''); setNote('')
    const { error } = await supabase!.from('learn_messages').insert({ espace_id: espace.id, user_id: session.user.id, texte: q })
    if (error) { setNote(t.aiError); setBusy(false); return }
    await fetchMsgs(); ping()
    // Un agent répond quand on le nomme (@Maya, @Idris).
    const agent = agents.find((a) => a.ready && q.toLowerCase().includes('@' + a.name.toLowerCase()))
    if (agent) {
      const r = await askTutor({ question: q, code: '', lesson: espace.nom, output: '', lang, agentId: agent.id, espaceId: espace.id })
      if (!r.answer) setNote(r.error === 'quota' ? t.quota : t.aiError)
      await fetchMsgs(); ping()
    }
    setBusy(false)
  }

  const makeInvite = async () => {
    const { data, error } = await supabase!.rpc('learn_creer_invitation', { p_espace: espace.id })
    setInvite(error ? '' : `${window.location.origin}/?join=${data}`)
    if (error) setNote(t.inviteError)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <button className="text-sm underline" onClick={onBack}>← {t.spaces}</button>
        <h2 className="text-xl font-bold flex-1">{espace.nom}</h2>
        <span className="text-xs text-ink/70" aria-live="polite">{online} {t.online}</span>
        <button className="text-sm border border-ink/30 rounded-md px-3 py-1.5" onClick={makeInvite}>{t.invite}</button>
      </div>
      {invite && (
        <div className="rounded-md bg-brass/15 border border-brass p-2 text-sm break-all">
          <p className="text-xs mb-1">{t.inviteHelp}</p>
          <input readOnly value={invite} onFocus={(e) => e.target.select()} className={inp + ' w-full'} aria-label={t.invite} />
        </div>
      )}
      <div className="rounded-xl border-2 border-brass bg-paper h-80 overflow-y-auto p-3 space-y-2" aria-live="polite">
        {msgs.length === 0 && <p className="text-sm text-ink/60">{t.saloonEmpty}</p>}
        {msgs.map((m) => {
          const ag = m.agent_id ? agents.find((a) => a.id === m.agent_id) : null
          const mine = m.user_id === session.user.id
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-end' : ''}`}>
              <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${m.agent_id ? 'bg-brass/20' : mine ? 'bg-terracotta text-white' : 'bg-white/70 border border-ink/10'}`}>
                {m.agent_id && <strong>{ag?.name ?? m.agent_id} : </strong>}{m.texte}
              </div>
            </div>
          )
        })}
        <div ref={bottom} />
      </div>
      {note && <p className="text-sm text-terracotta-dark" role="status">{note}</p>}
      <div className="flex gap-2">
        <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} maxLength={4000}
          placeholder={t.saloonPlaceholder} aria-label={t.saloonPlaceholder} className={inp + ' flex-1 min-w-0'} />
        <button className={btn} disabled={!text.trim() || busy} onClick={send}>{t.send}</button>
      </div>
    </div>
  )
}
