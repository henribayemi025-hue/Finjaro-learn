import { useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import type { Lang } from '../i18n'
import Cv from './Cv'
import Fiches from './Fiches'
import News from './News'
import { o } from './i18n'
import { c, n } from './i18nCv'
import './print.css'

export default function Outils({ lang, session }: { lang: Lang; session: Session | null }) {
  const t = o[lang]
  const [tool, setTool] = useState<'fiches' | 'cv' | 'news'>('fiches')
  if (!session) return <p className="text-sm">{t.login}</p>
  return (
    <div className="space-y-4">
      <div className="flex gap-2" role="tablist">
        {(['fiches', 'cv', 'news'] as const).map((k) => (
          <button key={k} role="tab" aria-selected={tool === k} onClick={() => setTool(k)}
            className={`px-3 py-1.5 rounded-md text-sm border ${tool === k ? 'bg-terracotta text-white border-terracotta' : 'border-ink/30'}`}>
            {k === 'fiches' ? t.fiches : k === 'cv' ? c[lang].tab : n[lang].tab}
          </button>
        ))}
      </div>
      {tool === 'fiches' ? <Fiches lang={lang} /> : tool === 'cv' ? <Cv lang={lang} /> : <News lang={lang} />}
    </div>
  )
}
