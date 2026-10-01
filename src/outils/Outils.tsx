import type { Session } from '@supabase/supabase-js'
import type { Lang } from '../i18n'
import Fiches from './Fiches'
import { o } from './i18n'

export default function Outils({ lang, session }: { lang: Lang; session: Session | null }) {
  const t = o[lang]
  if (!session) return <p className="text-sm">{t.login}</p>
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">{t.fiches}</h2>
      <Fiches lang={lang} />
    </div>
  )
}
