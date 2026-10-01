import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../supabase'
import type { Lang } from '../i18n'

const T = {
  fr: {
    title: 'Modération', reports: 'Signalements', hiddenTab: 'Masqués', none: 'Rien à traiter.', noneHidden: 'Aucun contenu masqué.',
    hide: 'Masquer', keep: 'Laisser visible', show: 'Réafficher', question: 'Question', answer: 'Réponse', by: 'par',
    count: 'signalement(s)', agent: 'agent', error: 'Action impossible.',
  },
  en: {
    title: 'Moderation', reports: 'Reports', hiddenTab: 'Hidden', none: 'Nothing to review.', noneHidden: 'No hidden content.',
    hide: 'Hide', keep: 'Keep visible', show: 'Show again', question: 'Question', answer: 'Answer', by: 'by',
    count: 'report(s)', agent: 'agent', error: 'Not possible.',
  },
} as const

interface Item { type: 'question' | 'reponse'; id: string; text: string; author: string; motifs: string[]; masquee: boolean }

const btn = 'rounded-md bg-terracotta text-white px-3 py-1.5 text-sm'
const ghost = 'rounded-md border border-ink/30 px-3 py-1.5 text-sm'

/** Contenu + pseudo (jamais de nom réel ni d'e-mail) pour une liste d'ids. */
async function hydrate(type: 'question' | 'reponse', ids: string[], motifs: Record<string, string[]>): Promise<Item[]> {
  if (!ids.length) return []
  const table = type === 'question' ? 'learn_entraide_questions' : 'learn_entraide_reponses'
  const cols = type === 'question' ? 'id,auteur_id,titre,corps,masquee' : 'id,auteur_id,agent_id,corps,masquee'
  const { data } = await supabase!.from(table).select(cols).in('id', ids)
  const rows = (data ?? []) as unknown as { id: string; auteur_id: string | null; agent_id?: string | null; titre?: string; corps: string; masquee: boolean }[]
  const authors = [...new Set(rows.map((r) => r.auteur_id).filter(Boolean))] as string[]
  const { data: ps } = authors.length ? await supabase!.from('learn_profils').select('user_id,pseudo').in('user_id', authors) : { data: [] }
  const pseudo = Object.fromEntries((ps ?? []).map((p) => [p.user_id as string, p.pseudo as string]))
  return rows.map((r) => ({
    type, id: r.id, masquee: r.masquee, motifs: motifs[r.id] ?? [],
    text: (r.titre ? r.titre + '\n' : '') + r.corps,
    author: r.agent_id ? `agent ${r.agent_id}` : pseudo[r.auteur_id ?? ''] ?? '…',
  }))
}

export default function Moderation({ lang }: { lang: Lang }) {
  const t = T[lang]
  const [tab, setTab] = useState<'reports' | 'hidden'>('reports')
  const [items, setItems] = useState<Item[]>([])
  const [note, setNote] = useState('')

  const load = useCallback(async () => {
    if (!supabase) return
    if (tab === 'reports') {
      const { data } = await supabase.from('learn_entraide_signalements').select('cible_type,cible_id,motif').eq('traite', false)
      const rows = (data ?? []) as { cible_type: 'question' | 'reponse'; cible_id: string; motif: string }[]
      const motifs: Record<string, string[]> = {}
      rows.forEach((r) => { (motifs[r.cible_id] ??= []).push(r.motif) })
      const q = [...new Set(rows.filter((r) => r.cible_type === 'question').map((r) => r.cible_id))]
      const a = [...new Set(rows.filter((r) => r.cible_type === 'reponse').map((r) => r.cible_id))]
      setItems([...(await hydrate('question', q, motifs)), ...(await hydrate('reponse', a, motifs))])
    } else {
      const [{ data: q }, { data: a }] = await Promise.all([
        supabase.from('learn_entraide_questions').select('id').eq('masquee', true),
        supabase.from('learn_entraide_reponses').select('id').eq('masquee', true),
      ])
      setItems([
        ...(await hydrate('question', (q ?? []).map((r) => r.id as string), {})),
        ...(await hydrate('reponse', (a ?? []).map((r) => r.id as string), {})),
      ])
    }
  }, [tab])
  useEffect(() => { load() }, [load])

  const act = async (it: Item, masquee: boolean) => {
    const { error } = await supabase!.rpc('learn_entraide_masquer', { p_type: it.type, p_cible: it.id, p_masquee: masquee })
    setNote(error ? t.error : ''); load()
  }

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-bold">{t.title}</h2>
      <div className="flex gap-2" role="tablist">
        {(['reports', 'hidden'] as const).map((k) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
            className={`px-3 py-1.5 rounded-md text-sm border ${tab === k ? 'bg-ink text-cream border-ink' : 'border-ink/30'}`}>
            {k === 'reports' ? t.reports : t.hiddenTab}
          </button>
        ))}
      </div>
      {note && <p className="text-sm text-terracotta-dark" role="status">{note}</p>}
      {items.length === 0 && <p className="text-sm text-ink/60">{tab === 'reports' ? t.none : t.noneHidden}</p>}
      <ul className="space-y-2">
        {items.map((it) => (
          <li key={it.type + it.id} className="rounded-lg border border-brass/50 bg-paper p-3 space-y-2">
            <p className="text-xs text-ink/60">{it.type === 'question' ? t.question : t.answer} · {t.by} {it.author}
              {it.motifs.length > 0 && ` · ${it.motifs.length} ${t.count}`}</p>
            <p className="text-sm whitespace-pre-wrap">{it.text}</p>
            {it.motifs.length > 0 && (
              <ul className="text-xs text-ink/70 list-disc list-inside">{it.motifs.map((m, i) => <li key={i}>{m}</li>)}</ul>
            )}
            <div className="flex gap-2">
              {tab === 'reports' ? (<>
                <button className={btn} onClick={() => act(it, true)}>{t.hide}</button>
                <button className={ghost} onClick={() => act(it, false)}>{t.keep}</button>
              </>) : <button className={ghost} onClick={() => act(it, false)}>{t.show}</button>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
