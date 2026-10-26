import { useEffect, useRef, useState } from 'react'
import { agents } from './agents'
import AgentFace from './AgentFace'
import { Md } from './Md'
import { askTutor } from './tutor'
import type { Lang } from './i18n'

const T = {
  fr: {
    tout: '💡 Je ne comprends pas : explique-moi simplement', sel: '💡 Explique-moi ce que j’ai sélectionné', astuce: 'Astuce : sélectionne un mot ou une phrase que tu ne comprends pas, puis appuie sur le bouton.',
    connecte: 'Connecte-toi (bouton en haut) pour que ton prof t’explique ici, sous le cours.', attente: 'réfléchit…', erreur: 'Le prof ne répond pas pour l’instant, réessaie dans un instant.',
    encore: 'Je ne comprends toujours pas', suite: 'Ta question…', envoyer: 'Envoyer', fermer: 'Fermer',
    q: (x: string) => `Je débute complètement en programmation. Explique-moi très simplement ceci, avec une image de la vie de tous les jours et un tout petit exemple, sans jargon : « ${x} ». Réponse courte (6 phrases au plus), puis une question simple pour vérifier que j’ai compris.`,
    qTout: 'Je débute complètement en programmation et je n’ai rien compris à cette explication. Reprends-la très simplement, étape par étape, avec une image de la vie de tous les jours et un tout petit exemple, sans jargon. Réponse courte (8 phrases au plus), puis une question simple pour vérifier que j’ai compris.',
    qEncore: 'Je ne comprends toujours pas. Explique autrement, encore plus simplement, avec une autre image.',
  },
  en: {
    tout: '💡 I don’t understand: explain it simply', sel: '💡 Explain what I selected', astuce: 'Tip: select a word or a sentence you don’t understand, then press the button.',
    connecte: 'Sign in (button at the top) so your teacher can explain right here, under the lesson.', attente: 'is thinking…', erreur: 'The teacher is not answering right now, try again in a moment.',
    encore: 'I still don’t understand', suite: 'Your question…', envoyer: 'Send', fermer: 'Close',
    q: (x: string) => `I am a complete beginner in programming. Explain this very simply, with an everyday image and a tiny example, no jargon: “${x}”. Short answer (6 sentences at most), then one simple question to check I understood.`,
    qTout: 'I am a complete beginner in programming and I understood nothing of this explanation. Redo it very simply, step by step, with an everyday image and a tiny example, no jargon. Short answer (8 sentences at most), then one simple question to check I understood.',
    qEncore: 'I still don’t understand. Explain differently, even more simply, with another image.',
  },
} as const

/** Autour du cours : la personne sélectionne ce qu'elle ne comprend pas (ou demande tout), et son prof répond juste en dessous, sans quitter la leçon. */
export default function ExpliqueIci({ lang, profId, titre, cours, signedIn, children }: {
  lang: Lang; profId: string; titre: string; cours: string; signedIn: boolean; children: React.ReactNode
}) {
  const t = T[lang]
  const zone = useRef<HTMLDivElement>(null)
  const [sel, setSel] = useState('')
  const [fil, setFil] = useState<{ role: 'user' | 'model'; text: string }[]>([])
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(false)
  const [q, setQ] = useState('')
  const prof = agents.find((a) => a.id === profId) ?? agents[0]

  // On garde la dernière sélection faite dans le cours : toucher le bouton ne doit pas la perdre.
  useEffect(() => {
    const f = () => {
      const s = window.getSelection()
      const txt = s?.toString().trim() ?? ''
      if (txt && s?.anchorNode && zone.current?.contains(s.anchorNode)) setSel(txt.slice(0, 400))
    }
    document.addEventListener('selectionchange', f)
    return () => document.removeEventListener('selectionchange', f)
  }, [])
  // Autre leçon : on repart de zéro.
  useEffect(() => { setSel(''); setFil([]); setErr(false); setQ('') }, [titre])

  const demander = async (question: string, montre: string) => {
    if (busy) return
    setBusy(true); setErr(false)
    const r = await askTutor({ question, code: '', lesson: `${titre}\n${cours}`, output: '', lang, agentId: prof.id, history: fil.slice(-8) })
    if (r.answer) setFil((f) => [...f, { role: 'user', text: montre }, { role: 'model', text: r.answer! }])
    else setErr(true)
    setBusy(false)
  }
  const pasPerdre = (e: React.MouseEvent) => e.preventDefault()

  return (
    <div className="space-y-3">
      <div ref={zone} className="space-y-6">{children}</div>
      {!signedIn ? <p className="text-sm text-ink/60">{t.connecte}</p> : (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <button className="btn px-4" disabled={busy} onMouseDown={pasPerdre} onClick={() => demander(t.qTout, t.tout.replace('💡 ', ''))}>{t.tout}</button>
            {sel && <button className="btn btn-primary px-4" disabled={busy} onMouseDown={pasPerdre} onClick={() => demander(t.q(sel), '« ' + sel + ' »')}>{t.sel}</button>}
          </div>
          {!sel && fil.length === 0 && <p className="text-xs text-ink/55">{t.astuce}</p>}
          {(fil.length > 0 || busy || err) && (
            <div className="card p-4 space-y-3 border-terracotta/40" aria-live="polite">
              <div className="flex items-center gap-2">
                <AgentFace src={prof.face} initial={prof.name[0]} size="sm" />
                <span className="font-bold">{prof.name}</span>
                <button className="ml-auto text-sm text-ink/55 hover:text-ink" onClick={() => { setFil([]); setErr(false) }}>✕ {t.fermer}</button>
              </div>
              {fil.map((m, k) => m.role === 'user'
                ? <p key={k} className="text-sm rounded-xl bg-terracotta/10 px-3 py-2 ml-8">{m.text}</p>
                : <Md key={k} text={m.text} className="text-[15px] leading-relaxed" />)}
              {busy && <p className="text-sm text-ink/60">{prof.name} {t.attente}</p>}
              {err && <p className="text-sm text-terracotta-dark">{t.erreur}</p>}
              {fil.length > 0 && (
                <form className="flex flex-wrap gap-2" onSubmit={(e) => { e.preventDefault(); if (q.trim()) { demander(q, q); setQ('') } }}>
                  <button type="button" className="btn px-3" disabled={busy} onClick={() => demander(t.qEncore, t.encore)}>{t.encore}</button>
                  <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.suite} className="flex-1 min-w-[10rem] min-h-11 rounded-xl border border-brass px-3 text-sm" />
                  <button className="btn btn-primary px-4" disabled={busy || !q.trim()}>{t.envoyer}</button>
                </form>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
