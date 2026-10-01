import { useState } from 'react'
import type { Lang } from '../i18n'
import { callOutil } from './api'
import { finjaroNews } from './finjaroNews'
import { n as nn } from './i18nCv'
import { o } from './i18n'

interface Item { text: string; sources: { url: string; title: string }[] }

export default function News({ lang }: { lang: Lang }) {
  const t = nn[lang]
  const e = o[lang]
  const [topic, setTopic] = useState('general')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [res, setRes] = useState<{ date: string; items: Item[] } | null>(null)

  const load = async () => {
    setErr('')
    setBusy(true)
    const { data, error } = await callOutil<{ date: string; items: Item[] }>('learn-news', { lang, topic })
    setBusy(false)
    if (error || !data) return setErr(error === 'quota' ? e.errQuota : error === 'timeout' ? e.errTimeout : error === 'auth' ? e.errAuth : t.empty)
    setRes(data)
  }

  return (
    <section className="space-y-5">
      <p className="text-sm text-ink/70">{t.intro}</p>
      <div>
        <h2 className="text-xl font-bold mb-2">{t.finH}</h2>
        <ul className="space-y-2">
          {finjaroNews.map((x, i) => (
            <li key={i} className="bg-paper border border-brass/50 rounded-lg p-3 text-sm">
              <p>{x[lang]}</p>
              <p className="mt-1 text-xs text-ink/60">{t.sources} : {x.source[lang]}</p>
            </li>
          ))}
        </ul>
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-bold">{t.aiH}</h2>
        <div className="flex flex-wrap items-center gap-2">
          <select aria-label={t.aiH} className="rounded-md border border-ink/30 bg-paper px-3 py-2 text-sm" value={topic} onChange={(ev) => setTopic(ev.target.value)}>
            {Object.entries(t.topics).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <button className="rounded-md px-4 py-2 text-sm bg-terracotta text-white disabled:opacity-50" onClick={load} disabled={busy}>{busy ? t.loading : t.load}</button>
        </div>
        {err && <p role="alert" className="text-sm text-terracotta-dark">{err}</p>}
        {res && (
          <>
            <ul className="space-y-2">
              {res.items.map((it, i) => (
                <li key={i} className="bg-paper border border-brass/50 rounded-lg p-3 text-sm">
                  <p>{it.text}</p>
                  <p className="mt-1 text-xs text-ink/60">
                    {t.sources} : {it.sources.map((s, j) => (
                      <a key={j} href={s.url} target="_blank" rel="noopener noreferrer" className="underline text-terracotta-dark mr-2">{s.title || new URL(s.url).hostname}</a>
                    ))}
                  </p>
                </li>
              ))}
            </ul>
            <p className="text-xs text-ink/60">{res.date} · {t.note}</p>
          </>
        )}
      </div>
    </section>
  )
}
