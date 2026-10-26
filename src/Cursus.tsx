import { useState } from 'react'
import { agents } from './agents'
import AgentFace from './AgentFace'
import { Md } from './Md'
import { askTutor } from './tutor'
import { cursusTotal, moduleCourant, modulesVus, type ModuleVu } from './cursus'
import type { Lang } from './i18n'

const T = {
  fr: {
    back: 'Accueil', titre: 'De zéro à chercheur IA', sous: 'Tu pars de zéro, sans rien connaître : la première leçon, c’est une seule ligne de code. Tu lis, tu t’exerces, tu construis, tu avances, jusqu’au niveau d’un ingénieur IA sérieux.',
    prog: 'Progression', faites: 'leçons réussies', reprendre: 'Reprendre', commencer: 'Commencer', module: 'Module', projet: 'Projet', exo: 'Exercice', lecon: 'Leçon',
    sauras: 'Tu sauras', fini: 'Terminé', ouvrir: 'Voir les leçons', fermer: 'Replier', certif: 'Certificat', certifLocked: 'Se débloque quand tout est réussi',
    coach: 'Ton coach', coachSous: 'Il connaît où tu en es.', ph: 'Pose ta question…', envoyer: 'Envoyer', connecte: 'Connecte-toi pour parler au coach.', attente: 'Il réfléchit…', erreur: 'Le coach ne répond pas pour l’instant, réessaie dans un instant.',
    q1: 'Que faire aujourd’hui ?', q2: 'Teste-moi sur ce module', q3: 'Explique-moi ce module simplement',
    nom: 'Ton nom sur le certificat', imprimer: 'Imprimer / enregistrer en PDF', fermerC: 'Fermer',
    certTitre: 'Certificat Finjaro Learn', certDe: 'a réussi toutes les leçons du module', certCursus: 'a réussi toutes les leçons du cursus « De zéro à chercheur IA »',
    certNote: 'Certificat de Finjaro Learn : il atteste des exercices réussis dans l’application, ce n’est pas un diplôme d’État.', le: 'Le',
  },
  en: {
    back: 'Home', titre: 'From zero to AI researcher', sous: 'You start from zero, knowing nothing: the first lesson is one single line of code. You read, practise, build, move forward, up to the level of a serious AI engineer.',
    prog: 'Progress', faites: 'lessons passed', reprendre: 'Resume', commencer: 'Start', module: 'Module', projet: 'Project', exo: 'Exercise', lecon: 'Lesson',
    sauras: 'You will be able to', fini: 'Done', ouvrir: 'See lessons', fermer: 'Collapse', certif: 'Certificate', certifLocked: 'Unlocks when everything is passed',
    coach: 'Your coach', coachSous: 'He knows where you are.', ph: 'Ask your question…', envoyer: 'Send', connecte: 'Sign in to talk to the coach.', attente: 'Thinking…', erreur: 'The coach is not answering right now, try again in a moment.',
    q1: 'What should I do today?', q2: 'Quiz me on this module', q3: 'Explain this module simply',
    nom: 'Your name on the certificate', imprimer: 'Print / save as PDF', fermerC: 'Close',
    certTitre: 'Finjaro Learn certificate', certDe: 'passed every lesson of the module', certCursus: 'passed every lesson of the “From zero to AI researcher” path',
    certNote: 'A Finjaro Learn certificate: it attests to exercises passed in the app, it is not a state diploma.', le: 'On',
  },
} as const

const COACH = {
  name: 'Théo',
  fr: 'Coach du cursus « De zéro à chercheur IA ». Direct, chaleureux, exigeant : il donne un seul prochain pas à la fois, fait pratiquer avant d’expliquer, pose des questions courtes pour tester, et ne donne jamais la solution d’un exercice d’emblée. Il connaît l’avancement de la personne (module en cours, leçons réussies) et s’y tient.',
  en: 'Coach of the “From zero to AI researcher” path. Direct, warm, demanding: he gives one next step at a time, makes the learner practise before explaining, asks short test questions, and never gives an exercise solution straight away. He knows the learner’s progress (current module, lessons passed) and sticks to it.',
}

function etat(vus: ModuleVu[], lang: Lang) {
  const { total, fait } = cursusTotal(vus)
  const cur = moduleCourant(vus)
  return lang === 'fr'
    ? `[Cursus] ${fait}/${total} leçons réussies. Module en cours : ${cur ? cur.m.titre.fr + ' (' + cur.fait + '/' + cur.ls.length + ')' : 'aucun, tout est terminé'}.`
    : `[Path] ${fait}/${total} lessons passed. Current module: ${cur ? cur.m.titre.en + ' (' + cur.fait + '/' + cur.ls.length + ')' : 'none, everything is done'}.`
}

export default function Cursus({ lang, done, signedIn, onOpen, onBack }: { lang: Lang; done: string[]; signedIn: boolean; onOpen: (i: number) => void; onBack: () => void }) {
  const t = T[lang]
  const vus = modulesVus(done)
  const { total, fait } = cursusTotal(vus)
  const pct = total ? Math.round((fait / total) * 100) : 0
  const cur = moduleCourant(vus)
  const prochaine = cur ? (cur.ls.find(({ l }) => !done.includes(l.id)) ?? cur.ls[0]) : null
  const [ouvert, setOuvert] = useState<string | null>(cur?.m.id ?? null)
  const [certif, setCertif] = useState<ModuleVu | 'tout' | null>(null)
  const prof = (id: string) => agents.find((a) => a.id === id)

  return (
    <div className="space-y-5">
      <button className="btn px-3" onClick={onBack}>← {t.back}</button>
      <header className="card p-5 sm:p-7 space-y-4 rise">
        <div>
          <h2 className="font-display text-2xl sm:text-4xl leading-tight">{t.titre}</h2>
          <p className="text-ink/70">{t.sous}</p>
        </div>
        <div>
          <div className="flex justify-between text-sm font-semibold mb-1.5"><span>{t.prog}</span><span className="font-mono text-terracotta-dark">{fait}/{total} {t.faites}</span></div>
          <div className="h-3 rounded-full bg-ink/10 overflow-hidden" role="progressbar" aria-label={t.prog} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full grad rounded-full" style={{ width: pct + '%' }} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {prochaine && <button className="btn btn-primary px-5 py-3" onClick={() => onOpen(prochaine.i)}>▶ {fait ? t.reprendre : t.commencer} : {prochaine.l.title[lang]}</button>}
          <button className="btn px-4" disabled={fait < total || total === 0} onClick={() => setCertif('tout')} title={fait < total ? t.certifLocked : ''}>🎓 {t.certif}</button>
        </div>
      </header>

      <div className="grid lg:grid-cols-[1fr_22rem] gap-5 items-start">
        <ol className="space-y-3 min-w-0">
          {vus.map((v, n) => {
            const fini = v.ls.length > 0 && v.fait === v.ls.length
            const on = ouvert === v.m.id
            const p = prof(v.m.prof)
            return (
              <li key={v.m.id} className={`card overflow-hidden ${cur?.m.id === v.m.id ? 'ring-2 ring-terracotta' : ''}`}>
                <button className="w-full text-left p-4 flex items-center gap-3 min-h-16" aria-expanded={on} onClick={() => setOuvert(on ? null : v.m.id)}>
                  <span className={`shrink-0 size-10 rounded-full grid place-items-center font-bold ${fini ? 'grad text-white' : 'bg-ink/8 text-ink/70'}`}>{fini ? '✓' : n + 1}</span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-ink/50">{t.module} {n + 1}{p ? ' · ' + p.name : ''}</span>
                    <span className="block font-display text-lg leading-tight">{v.m.titre[lang]}</span>
                    <span className="mt-1.5 flex items-center gap-2">
                      <span className="flex-1 h-1.5 rounded-full bg-ink/10 overflow-hidden"><span className="block h-full grad rounded-full" style={{ width: v.pct + '%' }} /></span>
                      <span className="text-xs font-semibold text-ink/70">{v.fait}/{v.ls.length}</span>
                    </span>
                  </span>
                  <span aria-hidden="true" className="text-ink/40">{on ? '▾' : '▸'}</span>
                </button>
                {on && (
                  <div className="px-4 pb-4 space-y-3 border-t border-brass/60">
                    <p className="text-sm pt-3"><b>{t.sauras} :</b> {v.m.sauras[lang]}</p>
                    <ul className="space-y-1">
                      {v.ls.map(({ l, i }, k) => {
                        const ok = done.includes(l.id)
                        const tag = l.niveau === 'projet' || /projet|capstone/.test(l.id) ? t.projet : l.niveau ? t.exo : ''
                        return (
                          <li key={l.id}>
                            <button onClick={() => onOpen(i)} className="w-full min-h-11 text-left rounded-xl px-3 py-2 flex items-center gap-3 hover:bg-ink/5">
                              <span className={`shrink-0 size-6 rounded-full grid place-items-center text-[11px] font-bold ${ok ? 'grad text-white' : 'bg-ink/8 text-ink/60'}`}>{ok ? '✓' : k + 1}</span>
                              <span className="flex-1 min-w-0 text-sm font-medium">{l.title[lang]}</span>
                              {tag && <span className="chip shrink-0">{tag}</span>}
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                    <button className="btn px-4" disabled={!fini} onClick={() => setCertif(v)} title={fini ? '' : t.certifLocked}>🎓 {t.certif} · {v.m.titre[lang]}</button>
                  </div>
                )}
              </li>
            )
          })}
        </ol>
        <Coach lang={lang} signedIn={signedIn} etat={etat(vus, lang)} />
      </div>
      {certif && <Certificat lang={lang} cible={certif} vus={vus} onClose={() => setCertif(null)} />}
    </div>
  )
}

function Coach({ lang, signedIn, etat }: { lang: Lang; signedIn: boolean; etat: string }) {
  const t = T[lang]
  const [q, setQ] = useState('')
  const [fil, setFil] = useState<{ role: 'user' | 'model'; text: string }[]>([])
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(false)
  const poser = async (texte: string) => {
    if (!texte.trim() || busy) return
    setBusy(true); setErr(false); setQ('')
    const r = await askTutor({ question: texte, code: '', lesson: etat, output: '', lang, agentId: 'finia', custom: { name: COACH.name, personality: COACH[lang] }, history: fil.slice(-8) })
    if (r.answer) setFil((f) => [...f, { role: 'user', text: texte }, { role: 'model', text: r.answer! }])
    else setErr(true)
    setBusy(false)
  }
  return (
    <aside className="card p-4 space-y-3 lg:sticky lg:top-24" aria-label={t.coach}>
      <div className="flex items-center gap-3">
        <AgentFace initial={COACH.name[0]} size="sm" />
        <div><div className="font-display text-lg leading-tight">{t.coach} · {COACH.name}</div><div className="text-xs text-ink/60">{t.coachSous}</div></div>
      </div>
      {!signedIn ? <p className="text-sm text-ink/70">{t.connecte}</p> : (
        <>
          <div className="flex flex-wrap gap-1.5">
            {[t.q1, t.q2, t.q3].map((x) => <button key={x} className="chip hover:bg-terracotta/15" disabled={busy} onClick={() => poser(x)}>{x}</button>)}
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto" aria-live="polite">
            {fil.map((m, k) => m.role === 'user'
              ? <p key={k} className="text-sm rounded-xl bg-terracotta/10 px-3 py-2 ml-6">{m.text}</p>
              : <Md key={k} text={m.text} className="text-sm rounded-xl bg-ink/5 px-3 py-2 mr-2" />)}
            {busy && <p className="text-sm text-ink/60">{t.attente}</p>}
            {err && <p className="text-sm text-terracotta-dark">{t.erreur}</p>}
          </div>
          <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); poser(q) }}>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.ph} className="flex-1 min-w-0 min-h-11 rounded-xl border border-brass px-3 text-sm" />
            <button className="btn btn-primary px-4" disabled={busy || !q.trim()}>{t.envoyer}</button>
          </form>
        </>
      )}
    </aside>
  )
}

function Certificat({ lang, cible, vus, onClose }: { lang: Lang; cible: ModuleVu | 'tout'; vus: ModuleVu[]; onClose: () => void }) {
  const t = T[lang]
  const [nom, setNom] = useState(() => { try { return localStorage.getItem('learn:certNom') ?? '' } catch { return '' } })
  const maj = (v: string) => { setNom(v); try { localStorage.setItem('learn:certNom', v) } catch { /* ignoré */ } }
  const date = new Date().toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  const n = cible === 'tout' ? cursusTotal(vus).fait : cible.fait
  return (
    <div className="fixed inset-0 z-50 bg-black/60 grid place-items-center p-4 overflow-y-auto" role="dialog" aria-modal="true" aria-label={t.certif}>
      <div className="w-full max-w-2xl space-y-3">
        <div className="print:hidden flex flex-wrap gap-2 items-center">
          <input value={nom} onChange={(e) => maj(e.target.value)} placeholder={t.nom} aria-label={t.nom} className="flex-1 min-w-0 min-h-11 rounded-xl border border-brass bg-paper px-3" />
          <button className="btn btn-primary px-4" onClick={() => window.print()}>{t.imprimer}</button>
          <button className="btn px-4 bg-paper" onClick={onClose}>{t.fermerC}</button>
        </div>
        <div className="certificat card bg-paper p-8 sm:p-12 text-center space-y-4 border-4 border-double border-brass">
          <div className="text-xs font-bold uppercase tracking-[.3em] text-terracotta-dark">Finjaro Learn</div>
          <h3 className="font-display text-3xl sm:text-4xl">{t.certTitre}</h3>
          <p className="font-display text-2xl sm:text-3xl border-b border-brass inline-block px-6 pb-1 min-w-[12rem]">{nom || '…'}</p>
          <p className="text-lg">{cible === 'tout' ? t.certCursus : <>{t.certDe}<br /><b>{cible.m.titre[lang]}</b></>}</p>
          <p className="text-sm text-ink/70">{n} {t.faites} · {t.le} {date}</p>
          <p className="text-xs text-ink/55 pt-2">{t.certNote}</p>
        </div>
      </div>
    </div>
  )
}
