import { useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import type { Lang } from '../i18n'
import Cv from './Cv'
import Fiches from './Fiches'
import { o } from './i18n'
import { c } from './i18nCv'
import './print.css'

export default function Outils({ lang, session }: { lang: Lang; session: Session | null }) {
  const t = o[lang]
  const [tool, setTool] = useState<'fiches' | 'cv'>('fiches')
  if (!session) return <p className="text-sm">{t.login}</p>
  return (
    <div className="space-y-4">
      <div className="flex gap-2" role="tablist">
        {(['fiches', 'cv'] as const).map((k) => (
          <button key={k} role="tab" aria-selected={tool === k} onClick={() => setTool(k)}
            className={`px-3 py-1.5 rounded-md text-sm border ${tool === k ? 'bg-terracotta text-white border-terracotta' : 'border-ink/30'}`}>
            {k === 'fiches' ? t.fiches : c[lang].tab}
          </button>
        ))}
      </div>
      {tool === 'fiches' ? <Fiches lang={lang} /> : <Cv lang={lang} />}
    </div>
  )
}
