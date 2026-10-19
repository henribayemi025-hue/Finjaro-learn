import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../supabase'
import { askTutor } from '../tutor'
import { agents } from '../agents'
import AgentFace from '../AgentFace'
import CoCode from '../CoCode'
import Defis from '../Defis'
import { Md } from '../Md'
import type { CoEvent } from '../coop'
import type { Lang } from '../i18n'

// UN ESPACE OUVERT, sur le modèle de l'Atelier de code (Beau, 14/10 : « un truc comme l'espace code de Léo, avec les agents IA » ;
// « plus je parle, plus le truc grossit »). Plein écran sombre ; trois colonnes à l'ordinateur :
// l'espace (espaces, présents, agents, invitation) · le travail (Coder ensemble, Défis) · la discussion du groupe et des agents,
// de hauteur fixe, défilement interne, zone d'écriture toujours en bas. Au téléphone : une vue à la fois, onglets en bas.
// Rien de nouveau côté serveur : mêmes tables (learn_messages…), même canal Realtime privé, même fonction learn-tutor.

export interface Espace { id: string; nom: string; type: string }
interface Msg { id: number; user_id: string | null; agent_id: string | null; texte: string; created_at: string }
type Vue = 'espace' | 'discussion' | 'code' | 'defis'

const T = {
  fr: {
    close: 'Fermer l’espace', spaces: 'Mes espaces', all: 'Tous les espaces', present: 'Présents', agents: 'Agents IA', callAgent: (n: string) => `Appeler ${n} dans la discussion`,
    invite: 'Inviter', inviteHelp: 'Envoie ce lien (valable 7 jours) :', copy: 'Copier', copied: 'Copié', inviteError: 'Seul un animateur peut inviter.',
    chat: 'Discussion', code: 'Coder ensemble', defis: 'Défis', online: 'en ligne', empty: 'Écris le premier message. Nomme un agent (@Maya, @Idris…) pour qu’il réponde.',
    placeholder: 'Écris au groupe… (@ pour un agent)', send: 'Envoyer', thinking: 'réfléchit…', you: 'Toi', member: 'Membre', newMsgs: 'Nouveaux messages ↓',
    aiError: 'Réponse impossible pour l’instant.', quota: 'Les agents ont atteint leur limite du jour.', sendError: 'Message non envoyé.',
    tabs: { espace: 'Espace', discussion: 'Discussion', code: 'Code', defis: 'Défis' }, types: { amis: 'Entre amis', equipe: 'Équipe', classe: 'Classe' } as Record<string, string>,
  },
  en: {
    close: 'Close the space', spaces: 'My spaces', all: 'All spaces', present: 'Present', agents: 'AI agents', callAgent: (n: string) => `Call ${n} into the chat`,
    invite: 'Invite', inviteHelp: 'Send this link (valid 7 days):', copy: 'Copy', copied: 'Copied', inviteError: 'Only a host can invite.',
    chat: 'Chat', code: 'Code together', defis: 'Challenges', online: 'online', empty: 'Write the first message. Mention an agent (@Maya, @Idris…) to get a reply.',
    placeholder: 'Write to the group… (@ for an agent)', send: 'Send', thinking: 'is thinking…', you: 'You', member: 'Member', newMsgs: 'New messages ↓',
    aiError: 'No answer right now.', quota: 'The agents have reached today’s limit.', sendError: 'Message not sent.',
    tabs: { espace: 'Space', discussion: 'Chat', code: 'Code', defis: 'Challenges' }, types: { amis: 'Friends', equipe: 'Team', classe: 'Class' } as Record<string, string>,
  },
} as const

const prets = agents.filter((a) => a.ready)

export default function AtelierEspace({ lang, session, espace, espaces, onSwitch, onBack }: {
  lang: Lang; session: Session; espace: Espace; espaces: Espace[]; onSwitch: (e: Espace) => void; onBack: () => void
}) {
  const t = T[lang]
  const me = session.user.id
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [names, setNames] = useState<Record<string, string>>({})
  const [text, setText] = useState('')
  const [invite, setInvite] = useState('')
  const [copied, setCopied] = useState(false)
  const [present, setPresent] = useState<{ id: string; name: string }[]>([])
  const [busy, setBusy] = useState<string>('')
  const [note, setNote] = useState('')
  const [myName, setMyName] = useState('')
  const [vue, setVue] = useState<Vue>('discussion')
  const [centre, setCentre] = useState<'code' | 'defis'>('code')
  const [unseen, setUnseen] = useState(false)
  const chan = useRef<ReturnType<NonNullable<typeof supabase>['channel']> | null>(null)
  const coHandler = useRef<((ev: CoEvent) => void) | null>(null)
  const fil = useRef<HTMLDivElement>(null)
  const zone = useRef<HTMLTextAreaElement>(null)
  const collé = useRef(true) // la discussion suit les nouveaux messages tant qu'on est en bas
  const nomRef = useRef('')

  // La page derrière ne défile plus : tout se passe dans l'atelier.
  useEffect(() => {
    const avant = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = avant }
  }, [])

  const fetchMsgs = useCallback(async () => {
    const { data } = await supabase!.from('learn_messages').select('id,user_id,agent_id,texte,created_at')
      .eq('espace_id', espace.id).order('id', { ascending: false }).limit(100)
    setMsgs(((data ?? []) as Msg[]).reverse())
  }, [espace.id])

  // Les pseudos des personnes qui ont écrit (une seule lecture par personne).
  useEffect(() => {
    const manque = [...new Set(msgs.map((m) => m.user_id).filter((id): id is string => !!id && !(id in names)))]
    if (!manque.length) return
    supabase!.from('learn_profils').select('user_id,pseudo').in('user_id', manque).then(({ data }) => {
      const lus = Object.fromEntries((data ?? []).map((p) => [p.user_id as string, (p.pseudo as string) || '']))
      setNames((n) => ({ ...n, ...Object.fromEntries(manque.map((id) => [id, lus[id] ?? ''])) }))
    })
  }, [msgs, names])

  useEffect(() => {
    let vivant = true
    void fetchMsgs()
    supabase!.from('learn_profils').select('pseudo').eq('user_id', me).maybeSingle()
      .then(({ data }) => { if (vivant) setMyName((data?.pseudo as string) || t.member) })
    // Canal Realtime privé (autorisé aux membres par RLS) : diffusion + présence (avec le pseudo).
    const ch = supabase!.channel(`learn:espace:${espace.id}`, { config: { private: true, presence: { key: me } } })
    ch.on('broadcast', { event: 'msg' }, () => void fetchMsgs())
      .on('broadcast', { event: 'co' }, ({ payload }) => coHandler.current?.(payload as CoEvent))
      .on('presence', { event: 'sync' }, () => {
        const st = ch.presenceState() as Record<string, { name?: string }[]>
        setPresent(Object.entries(st).map(([id, v]) => ({ id, name: v[0]?.name || '' })))
      })
      .subscribe((s) => { if (s === 'SUBSCRIBED' && nomRef.current) void ch.track({ at: Date.now(), name: nomRef.current }) })
    chan.current = ch
    return () => { vivant = false; void supabase!.removeChannel(ch) }
  }, [espace.id, me, fetchMsgs, t.member])

  // Le pseudo arrive après l'abonnement : on (re)déclare sa présence quand on le connaît.
  useEffect(() => { nomRef.current = myName; if (myName) void chan.current?.track({ at: Date.now(), name: myName }) }, [myName, espace.id])

  // Nouveaux messages : on descend si on était en bas, sinon un bouton le propose (on ne vous arrache pas votre lecture).
  useEffect(() => {
    const el = fil.current
    if (!el) return
    const dernier = msgs[msgs.length - 1]
    const cache = el.offsetParent === null // téléphone, onglet Discussion fermé
    if (cache) { if (dernier && dernier.user_id !== me) setUnseen(true); return }
    if (collé.current || dernier?.user_id === me) { el.scrollTop = el.scrollHeight; setUnseen(false) }
    else if (msgs.length) setUnseen(true)
  }, [msgs, busy, me])

  // Retour sur l'onglet Discussion (téléphone) : on reprend en bas.
  useEffect(() => {
    if (vue !== 'discussion') return
    requestAnimationFrame(() => { const el = fil.current; if (el) el.scrollTop = el.scrollHeight })
    collé.current = true; setUnseen(false)
  }, [vue])

  const onScroll = () => {
    const el = fil.current
    if (!el) return
    collé.current = el.scrollHeight - el.scrollTop - el.clientHeight < 48
    if (collé.current) setUnseen(false)
  }

  const sendCo = (ev: CoEvent) => { void chan.current?.send({ type: 'broadcast', event: 'co', payload: ev }) }
  const ping = () => void chan.current?.send({ type: 'broadcast', event: 'msg', payload: {} })

  const send = async () => {
    const q = text.trim()
    if (!q || busy) return
    setText(''); setNote(''); collé.current = true
    const { error } = await supabase!.from('learn_messages').insert({ espace_id: espace.id, user_id: me, texte: q })
    if (error) { setNote(t.sendError); setText(q); return }
    await fetchMsgs(); ping()
    // Un agent répond quand on le nomme (@Finia, @Maya, @Idris…).
    const agent = prets.find((a) => q.toLowerCase().includes('@' + a.name.toLowerCase()))
    if (agent) {
      setBusy(agent.name)
      const r = await askTutor({ question: q, code: '', lesson: espace.nom, output: '', lang, agentId: agent.id, espaceId: espace.id })
      if (!r.answer) setNote(r.error === 'quota' ? t.quota : t.aiError)
      await fetchMsgs(); ping()
      setBusy('')
    }
  }

  const appeler = (nom: string) => {
    setText((x) => (x.includes('@' + nom) ? x : `@${nom} ${x}`.trimEnd() + ' '))
    setVue('discussion')
    requestAnimationFrame(() => zone.current?.focus())
  }

  const makeInvite = async () => {
    const { data, error } = await supabase!.rpc('learn_creer_invitation', { p_espace: espace.id })
    setInvite(error ? '' : `${window.location.origin}${import.meta.env.BASE_URL}?join=${data}`)
    setCopied(false)
    if (error) setNote(t.inviteError)
  }
  const copier = async () => {
    try { await navigator.clipboard.writeText(invite); setCopied(true) } catch { /* le champ reste sélectionnable */ }
  }

  const nomDe = (id: string) => (id === me ? t.you : names[id] || t.member)
  const presents = useMemo(() => present.map((p) => ({ ...p, name: p.id === me ? `${myName || t.member} (${t.you.toLowerCase()})` : p.name || t.member })), [present, me, myName, t])

  const titre = (s: string) => <p className="px-3 pt-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-[#93A1B8]">{s}</p>

  // ───────── Colonne de gauche : l'espace ─────────
  const colonneEspace = (
    <div className="h-full overflow-y-auto pb-4">
      {titre(t.spaces)}
      <ul className="px-2 space-y-0.5">
        {espaces.map((e) => (
          <li key={e.id}>
            <button onClick={() => { if (e.id !== espace.id) onSwitch(e) }} aria-current={e.id === espace.id ? 'true' : undefined}
              className={`w-full text-left rounded-lg px-2.5 py-2 text-[13px] ${e.id === espace.id ? 'bg-[#FF8A3D]/15 text-white font-semibold' : 'text-[#C9D4E5] hover:bg-white/5'}`}>
              <span className="block truncate"># {e.nom}</span>
              <span className="block text-[11px] text-[#93A1B8]">{t.types[e.type] ?? e.type}</span>
            </button>
          </li>
        ))}
      </ul>
      <button onClick={onBack} className="mx-3 mt-1 text-[12px] text-[#93A1B8] hover:text-white underline">← {t.all}</button>

      {titre(`${t.present} · ${presents.length}`)}
      <ul className="px-3 space-y-1.5">
        {presents.map((p) => (
          <li key={p.id} className="flex items-center gap-2 text-[13px] text-[#EDF1F8]">
            <span className="size-2 rounded-full bg-[#5FC8C0] shrink-0" aria-hidden="true" /><span className="truncate">{p.name}</span>
          </li>
        ))}
      </ul>

      {titre(t.agents)}
      <ul className="px-2 space-y-0.5">
        {prets.map((a) => (
          <li key={a.id}>
            <button onClick={() => appeler(a.name)} title={t.callAgent(a.name)} aria-label={t.callAgent(a.name)}
              className="w-full flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-left hover:bg-white/5">
              <span className="scale-75 -m-1.5 shrink-0"><AgentFace src={a.face} initial={a.name[0]} size="sm" /></span>
              <span className="min-w-0">
                <span className="block text-[13px] font-semibold text-white">@{a.name}</span>
                <span className="block text-[11px] text-[#93A1B8] truncate">{a.role[lang]}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      <div className="px-3 pt-4 space-y-2">
        <button onClick={() => void makeInvite()} className="w-full rounded-full border border-white/20 min-h-10 text-[13px] font-semibold text-white hover:bg-white/5">＋ {t.invite}</button>
        {invite && (
          <div className="rounded-lg border border-white/12 bg-[#0B1120] p-2 space-y-1.5">
            <p className="text-[11px] text-[#93A1B8]">{t.inviteHelp}</p>
            <input readOnly value={invite} onFocus={(e) => e.target.select()} aria-label={t.invite}
              className="w-full rounded-md border border-white/12 bg-[#0F172A] px-2 py-1.5 text-[12px] text-white" />
            <button onClick={() => void copier()} className="text-[12px] font-semibold text-[#FF8A3D]">{copied ? '✓ ' + t.copied : t.copy}</button>
          </div>
        )}
      </div>
    </div>
  )

  // ───────── Centre : le travail ─────────
  const colonneCentre = (
    <div className="h-full flex flex-col min-h-0">
      <div className="hidden lg:flex shrink-0 items-center gap-1 h-10 px-2 border-b border-white/10" role="tablist" aria-label={espace.nom}>
        {(['code', 'defis'] as const).map((k) => (
          <button key={k} role="tab" aria-selected={centre === k} onClick={() => setCentre(k)}
            className={`px-3 min-h-8 rounded-md text-[13px] font-semibold ${centre === k ? 'bg-white/10 text-white' : 'text-[#93A1B8] hover:text-white'}`}>
            {k === 'code' ? '‹/› ' + t.code : '🏁 ' + t.defis}
          </button>
        ))}
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto">
        {/* L'éditeur reste monté quand on regarde les défis : on ne perd ni le code ni le rôle de pilote. */}
        <div className={centre === 'code' ? 'block' : 'hidden'}>
          {myName && <CoCode lang={lang} me={{ id: me, name: myName }} send={sendCo} handlerRef={coHandler} sombre />}
        </div>
        <div className={centre === 'defis' ? 'block' : 'hidden'}>
          <Defis lang={lang} userId={me} espaceId={espace.id} sombre />
        </div>
      </div>
    </div>
  )

  // ───────── Colonne de droite : la discussion (hauteur fixe) ─────────
  const colonneDiscussion = (
    <div className="h-full flex flex-col min-h-0">
      <div className="shrink-0 flex items-center gap-2 h-10 px-3 border-b border-white/10">
        <p className="font-semibold text-[13px] text-white flex-1">💬 {t.chat}</p>
        <span className="text-[11px] text-[#93A1B8]" aria-live="polite">{presents.length} {t.online}</span>
      </div>
      <div className="relative flex-1 min-h-0">
        <div ref={fil} onScroll={onScroll} className="absolute inset-0 overflow-y-auto p-3 space-y-3 text-[13.5px] leading-relaxed" aria-live="polite">
          {msgs.length === 0 && <p className="text-[13px] text-[#93A1B8]">{t.empty}</p>}
          {msgs.map((m, i) => {
            const ag = m.agent_id ? agents.find((a) => a.id === m.agent_id) : null
            const mine = m.user_id === me
            const suite = i > 0 && msgs[i - 1].user_id === m.user_id && msgs[i - 1].agent_id === m.agent_id
            if (m.agent_id) return (
              <div key={m.id} className="flex gap-2.5">
                <span className="shrink-0 scale-75 -m-1.5"><AgentFace src={ag?.face} initial={(ag?.name ?? m.agent_id)[0]} size="sm" /></span>
                <div className="min-w-0">
                  <p className="text-[12px] font-bold text-[#FF8A3D]">{ag?.name ?? m.agent_id}</p>
                  <div className="rounded-2xl rounded-tl-sm bg-white/6 px-3 py-2 text-[#EDF1F8]"><Md text={m.texte} className="md-sombre" /></div>
                </div>
              </div>
            )
            if (mine) return (
              <div key={m.id} className="flex justify-end"><p className="max-w-[85%] rounded-2xl rounded-tr-sm bg-[#FF8A3D] text-[#0B1120] px-3 py-2 font-medium whitespace-pre-wrap break-words">{m.texte}</p></div>
            )
            return (
              <div key={m.id} className="max-w-[85%]">
                {!suite && <p className="text-[12px] font-bold text-[#5FC8C0]">{nomDe(m.user_id ?? '')}</p>}
                <p className="rounded-2xl rounded-tl-sm border border-white/10 bg-[#0B1120] px-3 py-2 text-[#EDF1F8] whitespace-pre-wrap break-words">{m.texte}</p>
              </div>
            )
          })}
          {busy && <p className="text-[12px] text-[#93A1B8]" role="status">{busy} {t.thinking}</p>}
        </div>
        {unseen && (
          <button onClick={() => { const el = fil.current; if (el) el.scrollTop = el.scrollHeight; collé.current = true; setUnseen(false) }}
            className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-[#FF8A3D] px-3 py-1 text-[12px] font-bold text-[#0B1120] shadow">{t.newMsgs}</button>
        )}
      </div>
      <div className="shrink-0 border-t border-white/10 p-3 space-y-2">
        {note && <p className="text-[12px] text-[#FDA4AF]" role="status">{note}</p>}
        <div className="flex gap-1.5 overflow-x-auto [scrollbar-width:none]">
          {prets.map((a) => (
            <button key={a.id} onClick={() => appeler(a.name)} aria-label={t.callAgent(a.name)}
              className="shrink-0 rounded-full border border-white/12 px-2.5 min-h-8 text-[12px] font-semibold text-[#C9D4E5] hover:border-[#FF8A3D] hover:text-white">@{a.name}</button>
          ))}
        </div>
        <div className="flex gap-2 items-end">
          <textarea ref={zone} value={text} onChange={(e) => setText(e.target.value)} rows={2} maxLength={4000} placeholder={t.placeholder} aria-label={t.placeholder}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send() } }}
            className="flex-1 min-w-0 resize-none rounded-xl border border-white/12 bg-[#0B1120] px-3 py-2 text-[16px] lg:text-[13.5px] text-white placeholder:text-[#64748B]" />
          <button onClick={() => void send()} disabled={!text.trim() || !!busy} aria-label={t.send}
            className="size-11 shrink-0 grid place-items-center rounded-full bg-[#FF8A3D] text-[#0B1120] font-bold disabled:opacity-40">➤</button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0B1120] text-[#EDF1F8]" role="region" aria-label={espace.nom}>
      <div className="shrink-0 flex items-center gap-2 px-3 py-2 border-b border-white/10 bg-[#0F172A]" style={{ paddingTop: 'max(0.5rem, env(safe-area-inset-top))' }}>
        <button onClick={onBack} aria-label={t.close} className="size-10 grid place-items-center rounded-full text-xl text-[#C9D4E5] hover:bg-white/10">✕</button>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-white truncate"># {espace.nom}</p>
          <p className="text-[11px] text-[#93A1B8]">{t.types[espace.type] ?? espace.type} · {presents.length} {t.online}</p>
        </div>
        <div className="hidden sm:flex -space-x-2" aria-hidden="true">
          {prets.slice(0, 4).map((a) => <span key={a.id} className="scale-75"><AgentFace src={a.face} initial={a.name[0]} size="sm" /></span>)}
        </div>
        <button onClick={() => { void makeInvite(); setVue('espace') }} className="rounded-full bg-[#FF8A3D] px-4 min-h-10 text-[13px] font-bold text-[#0B1120]">＋ {t.invite}</button>
      </div>

      {/* Ordinateur : trois colonnes. Téléphone : une vue à la fois. */}
      <div className="flex-1 min-h-0 lg:grid lg:grid-cols-[240px_minmax(0,1fr)_380px] 2xl:grid-cols-[260px_minmax(0,1fr)_440px]">
        <div className={`${vue === 'espace' ? 'block' : 'hidden'} lg:block h-full min-h-0 bg-[#0F172A] lg:border-r border-white/10`}>{colonneEspace}</div>
        <div className={`${vue === 'code' || vue === 'defis' ? 'flex' : 'hidden'} lg:flex h-full min-h-0 flex-col`}>{colonneCentre}</div>
        <div className={`${vue === 'discussion' ? 'block' : 'hidden'} lg:block h-full min-h-0 bg-[#0F172A] lg:border-l border-white/10`}>{colonneDiscussion}</div>
      </div>

      {/* Téléphone : onglets en bas */}
      <nav className="lg:hidden shrink-0 grid grid-cols-4 border-t border-white/10 bg-[#0F172A]" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }} role="tablist" aria-label={espace.nom}>
        {(['espace', 'discussion', 'code', 'defis'] as const).map((k) => (
          <button key={k} role="tab" aria-selected={vue === k} onClick={() => { setVue(k); if (k === 'code' || k === 'defis') setCentre(k) }}
            className={`relative min-h-12 flex flex-col items-center justify-center gap-0.5 text-[11px] font-semibold ${vue === k ? 'text-[#FF8A3D]' : 'text-[#93A1B8]'}`}>
            <span aria-hidden="true" className="text-base">{k === 'espace' ? '👥' : k === 'discussion' ? '💬' : k === 'code' ? '‹/›' : '🏁'}</span>{t.tabs[k]}
            {k === 'discussion' && unseen && vue !== 'discussion' && <span className="absolute top-2 right-[30%] size-2 rounded-full bg-[#FF8A3D]" aria-hidden="true" />}
          </button>
        ))}
      </nav>
    </div>
  )
}
