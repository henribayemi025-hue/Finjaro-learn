import { useState } from 'react'
import type { Lang } from '../i18n'
import { callOutil } from './api'
import { o } from './i18n'

interface Result {
  title: string
  summary: string
  cards: { q: string; a: string }[]
  quiz: { q: string; choices: string[]; answer: number; why: string }[]
}

const MAX_BYTES = 4 * 1024 * 1024
const TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp']

function toBase64(f: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader()
    r.onload = () => res(String(r.result).split(',')[1] ?? '')
    r.onerror = () => rej(r.error)
    r.readAsDataURL(f)
  })
}

const btn = 'rounded-md px-4 py-2 text-sm bg-terracotta text-white disabled:opacity-50'
const field = 'rounded-md border border-ink/30 bg-paper px-3 py-2 text-sm'

export default function Fiches({ lang }: { lang: Lang }) {
  const t = o[lang]
  const [text, setText] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [nCards, setNCards] = useState(8)
  const [nQuiz, setNQuiz] = useState(5)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [res, setRes] = useState<Result | null>(null)
  const [open, setOpen] = useState<number[]>([])
  const [picked, setPicked] = useState<Record<number, number>>({})
  const [checked, setChecked] = useState(false)

  const pick = (f: File | null) => {
    setErr('')
    if (f && !TYPES.includes(f.type)) return setErr(t.fileType)
    if (f && f.size > MAX_BYTES) return setErr(t.fileBig)
    setFile(f)
  }

  const make = async () => {
    setErr('')
    if (text.trim().length < 40 && !file) return setErr(t.noInput)
    setBusy(true)
    try {
      const payload: Record<string, unknown> = { text, lang, cards: nCards, quiz: nQuiz }
      if (file) payload.file = { mime: file.type, data: await toBase64(file) }
      const { data, error } = await callOutil<Result>('learn-fiches', payload)
      if (error || !data) {
        setErr(error === 'quota' ? t.errQuota : error === 'timeout' ? t.errTimeout : error === 'auth' ? t.errAuth : error === 'empty' ? t.noInput : t.errAi)
        return
      }
      setRes(data)
      setOpen([])
      setPicked({})
      setChecked(false)
    } finally {
      setBusy(false)
    }
  }

  const score = res ? res.quiz.filter((q, i) => picked[i] === q.answer).length : 0

  return (
    <section className="space-y-4">
      <p className="text-sm text-ink/70">{t.ficheIntro}</p>
      <div className="grid gap-3 md:grid-cols-[1fr_280px]">
        <label className="block">
          <span className="text-sm font-semibold">{t.pasteLabel}</span>
          <textarea className={`${field} w-full mt-1 h-48`} value={text} onChange={(e) => setText(e.target.value)} placeholder={t.pastePh} maxLength={30000} />
        </label>
        <div className="space-y-3">
          <label className="block">
            <span className="text-sm font-semibold">{t.orFile}</span>
            <input type="file" accept=".pdf,image/*" className="mt-1 block w-full text-sm" onChange={(e) => pick(e.target.files?.[0] ?? null)} />
          </label>
          <div className="flex gap-3">
            <label className="text-sm">{t.nCards}
              <select className={`${field} ml-2`} value={nCards} onChange={(e) => setNCards(+e.target.value)}>{[5, 8, 12, 15].map((n) => <option key={n}>{n}</option>)}</select>
            </label>
            <label className="text-sm">{t.nQuiz}
              <select className={`${field} ml-2`} value={nQuiz} onChange={(e) => setNQuiz(+e.target.value)}>{[3, 5, 8, 10].map((n) => <option key={n}>{n}</option>)}</select>
            </label>
          </div>
          <button className={btn} onClick={make} disabled={busy}>{busy ? t.making : t.make}</button>
        </div>
      </div>
      {err && <p role="alert" className="text-sm text-terracotta-dark">{err}</p>}

      {res && (
        <div className="space-y-5 print:text-black">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-xl font-bold">{res.title}</h2>
            <button className="text-sm border border-ink/30 rounded-md px-3 py-1.5 print:hidden" onClick={() => window.print()}>{t.print}</button>
          </div>
          <div>
            <h3 className="text-xs uppercase tracking-wide text-ink/60 mb-1">{t.summary}</h3>
            <p className="whitespace-pre-wrap bg-paper border border-brass/50 rounded-lg p-3 text-sm">{res.summary}</p>
          </div>
          {res.cards.length > 0 && (
            <div>
              <h3 className="text-xs uppercase tracking-wide text-ink/60 mb-1">{t.cards}</h3>
              <ul className="grid gap-2 md:grid-cols-2">
                {res.cards.map((c, i) => {
                  const shown = open.includes(i)
                  return (
                    <li key={i} className="bg-paper border border-brass/50 rounded-lg p-3 text-sm">
                      <p className="font-semibold">{c.q}</p>
                      {shown && <p className="mt-1 border-t border-brass/40 pt-1">{c.a}</p>}
                      <button className="mt-2 text-xs text-terracotta-dark underline print:hidden" onClick={() => setOpen(shown ? open.filter((x) => x !== i) : [...open, i])}>
                        {shown ? t.hide : t.show}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
          {res.quiz.length > 0 && (
            <div className="print:hidden">
              <h3 className="text-xs uppercase tracking-wide text-ink/60 mb-1">{t.quiz}</h3>
              <ol className="space-y-3">
                {res.quiz.map((q, i) => (
                  <li key={i} className="bg-paper border border-brass/50 rounded-lg p-3 text-sm">
                    <p className="font-semibold">{i + 1}. {q.q}</p>
                    <div className="mt-2 grid gap-1">
                      {q.choices.map((c, j) => {
                        const good = checked && j === q.answer
                        const bad = checked && picked[i] === j && j !== q.answer
                        return (
                          <label key={j} className={`flex items-start gap-2 rounded-md border px-2 py-1.5 ${good ? 'border-green-700 bg-green-50' : bad ? 'border-terracotta bg-terracotta/10' : 'border-ink/20'}`}>
                            <input type="radio" name={`q${i}`} disabled={checked} checked={picked[i] === j} onChange={() => setPicked({ ...picked, [i]: j })} />
                            <span>{c}</span>
                          </label>
                        )
                      })}
                    </div>
                    {checked && <p className="mt-2 text-ink/70">{q.why}</p>}
                  </li>
                ))}
              </ol>
              <div className="mt-3 flex items-center gap-3">
                {!checked
                  ? <button className={btn} onClick={() => setChecked(true)} disabled={Object.keys(picked).length === 0}>{t.check}</button>
                  : <>
                      <p className="font-semibold">{t.score} : {score}/{res.quiz.length}</p>
                      <button className="text-sm border border-ink/30 rounded-md px-3 py-1.5" onClick={() => { setPicked({}); setChecked(false) }}>{t.again}</button>
                    </>}
              </div>
            </div>
          )}
          <p className="text-xs text-ink/60">{t.sourceNote}</p>
        </div>
      )}
    </section>
  )
}
