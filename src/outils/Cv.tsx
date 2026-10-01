import { useState } from 'react'
import type { Lang } from '../i18n'
import { callOutil } from './api'
import { c as cc } from './i18nCv'
import { o } from './i18n'

interface CvData {
  name: string; title: string; contact: string[]; summary: string
  experience: { role: string; org: string; period: string; bullets: string[] }[]
  education: { degree: string; school: string; period: string }[]
  skills: string[]; languages: string[]; tips: string[]
}
type Mode = 'cv' | 'letter' | 'improve'

const btn = 'rounded-md px-4 py-2 text-sm bg-terracotta text-white disabled:opacity-50'
const field = 'w-full rounded-md border border-ink/30 bg-paper px-3 py-2 text-sm'

export default function Cv({ lang }: { lang: Lang }) {
  const t = cc[lang]
  const e = o[lang]
  const [mode, setMode] = useState<Mode>('cv')
  const [f, setF] = useState({ name: '', target: '', contact: '', exp: '', edu: '', skills: '', langs: '', offer: '', existing: '' })
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [cv, setCv] = useState<CvData | null>(null)
  const [letter, setLetter] = useState('')
  const [copied, setCopied] = useState(false)
  const set = (k: keyof typeof f) => (ev: { target: { value: string } }) => setF({ ...f, [k]: ev.target.value })

  const profile = [
    f.name && `Nom : ${f.name}`, f.target && `Poste visé : ${f.target}`, f.contact && `Contact : ${f.contact}`,
    f.exp && `Expériences :\n${f.exp}`, f.edu && `Formations :\n${f.edu}`,
    f.skills && `Compétences : ${f.skills}`, f.langs && `Langues : ${f.langs}`,
  ].filter(Boolean).join('\n')

  const go = async () => {
    setErr('')
    if (mode !== 'improve' && profile.length < 20) return setErr(t.needMore)
    if (mode === 'letter' && f.offer.trim().length < 40) return setErr(t.needOffer)
    if (mode === 'improve' && f.existing.trim().length < 40) return setErr(t.needCv)
    setBusy(true)
    const { data, error } = await callOutil<{ cv?: CvData; letter?: string }>('learn-cv', { mode, lang, profile, offer: f.offer, existing: f.existing })
    setBusy(false)
    if (error || !data) {
      return setErr(error === 'quota' ? e.errQuota : error === 'timeout' ? e.errTimeout : error === 'auth' ? e.errAuth : e.errAi)
    }
    if (mode === 'letter') { setLetter(data.letter ?? ''); setCv(null) } else { setCv(data.cv ?? null); setLetter('') }
  }

  const Area = ({ k, label, rows = 4 }: { k: keyof typeof f; label: string; rows?: number }) => (
    <label className="block"><span className="text-sm font-semibold">{label}</span>
      <textarea className={`${field} mt-1`} rows={rows} maxLength={12000} value={f[k]} onChange={set(k)} /></label>
  )
  const Line = ({ k, label }: { k: keyof typeof f; label: string }) => (
    <label className="block"><span className="text-sm font-semibold">{label}</span>
      <input className={`${field} mt-1`} maxLength={300} value={f[k]} onChange={set(k)} /></label>
  )

  return (
    <section className="space-y-4">
      <p className="text-sm text-ink/70">{t.intro}</p>
      <div className="flex flex-wrap gap-2" role="group">
        {(['cv', 'letter', 'improve'] as const).map((m) => (
          <button key={m} aria-pressed={mode === m} onClick={() => setMode(m)}
            className={`px-3 py-1.5 rounded-md text-sm border ${mode === m ? 'bg-terracotta text-white border-terracotta' : 'border-ink/30'}`}>
            {m === 'cv' ? t.modeCv : m === 'letter' ? t.modeLetter : t.modeImprove}
          </button>
        ))}
      </div>

      {mode === 'improve' ? <Area k="existing" label={t.existing} rows={10} /> : (
        <div className="grid gap-3 md:grid-cols-2">
          <Line k="name" label={t.name} /><Line k="target" label={t.target} />
          <div className="md:col-span-2"><Line k="contact" label={t.contact} /></div>
          <Area k="exp" label={t.exp} rows={5} /><Area k="edu" label={t.edu} rows={5} />
          <Line k="skills" label={t.skills} /><Line k="langs" label={t.langs} />
          {mode === 'letter' && <div className="md:col-span-2"><Area k="offer" label={t.offer} rows={6} /></div>}
        </div>
      )}
      <button className={btn} onClick={go} disabled={busy}>{busy ? t.making : t.gen}</button>
      {err && <p role="alert" className="text-sm text-terracotta-dark">{err}</p>}

      {(cv || letter) && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xl font-bold">{cv ? t.cvH : t.letterH}</h2>
            <div className="flex gap-2">
              {letter && <button className="text-sm border border-ink/30 rounded-md px-3 py-1.5" onClick={() => { navigator.clipboard?.writeText(letter); setCopied(true) }}>{copied ? t.copied : t.copy}</button>}
              <button className="text-sm border border-ink/30 rounded-md px-3 py-1.5" onClick={() => window.print()}>{t.pdf}</button>
            </div>
          </div>
          <article className="print-area bg-white border border-brass/50 rounded-lg p-5 text-sm leading-relaxed max-w-3xl">
            {letter ? <p className="whitespace-pre-wrap">{letter}</p> : cv && (
              <div className="space-y-3">
                <header>
                  <h3 className="text-2xl font-bold">{cv.name}</h3>
                  {cv.title && <p className="text-terracotta-dark font-semibold">{cv.title}</p>}
                  {cv.contact.length > 0 && <p className="text-ink/70">{cv.contact.join(' · ')}</p>}
                </header>
                {cv.summary && <p>{cv.summary}</p>}
                {cv.experience.length > 0 && <Block title={t.sExp}>{cv.experience.map((x, i) => (
                  <div key={i} className="mb-2"><p className="font-semibold">{x.role}{x.org && ` — ${x.org}`} <span className="font-normal text-ink/60">{x.period}</span></p>
                    <ul className="list-disc ml-5">{x.bullets.map((b, j) => <li key={j}>{b}</li>)}</ul></div>
                ))}</Block>}
                {cv.education.length > 0 && <Block title={t.sEdu}>{cv.education.map((x, i) => (
                  <p key={i}><span className="font-semibold">{x.degree}</span>{x.school && ` — ${x.school}`} <span className="text-ink/60">{x.period}</span></p>
                ))}</Block>}
                {cv.skills.length > 0 && <Block title={t.sSkills}><p>{cv.skills.join(' · ')}</p></Block>}
                {cv.languages.length > 0 && <Block title={t.sLangs}><p>{cv.languages.join(' · ')}</p></Block>}
              </div>
            )}
          </article>
          {cv && cv.tips.length > 0 && (
            <div className="max-w-3xl">
              <h3 className="text-xs uppercase tracking-wide text-ink/60 mb-1">{t.tips}</h3>
              <ul className="list-disc ml-5 text-sm">{cv.tips.map((x, i) => <li key={i}>{x}</li>)}</ul>
            </div>
          )}
          <p className="text-xs text-ink/60">{t.note}</p>
        </div>
      )}
    </section>
  )
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return <div><h4 className="text-xs uppercase tracking-wide text-ink/60 border-b border-brass/50 mb-1">{title}</h4>{children}</div>
}
