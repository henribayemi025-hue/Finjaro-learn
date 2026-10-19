import { useState } from 'react'
import { agents } from './agents'
import { askTutor } from './tutor'
import { Md } from './Md'
import type { Lang } from './i18n'

/**
 * Le retour du prof sur un projet de fin de module. Le verdict vient des tests (exécutés par le code) ;
 * le modèle ne fait que commenter le code déjà validé : deux points forts, deux améliorations.
 */
export default function RetourProjet({ lang, profId, titre, code, sortie, ai, signedIn }: {
  lang: Lang; profId: string; titre: string; code: string; sortie: string; ai: boolean; signedIn: boolean
}) {
  const fr = lang === 'fr'
  const prof = agents.find((a) => a.id === profId && a.ready) ?? agents[0]
  const [retour, setRetour] = useState('')
  const [busy, setBusy] = useState(false)
  if (!ai || !signedIn) return <p className="text-xs text-ink/65">{fr ? `Pour le retour de ${prof.name} sur ton code : active l’IA et connecte-toi.` : `For ${prof.name}’s feedback on your code: turn on AI and sign in.`}</p>
  const demander = async () => {
    setBusy(true)
    const r = await askTutor({
      question: fr
        ? 'Tous les tests de mon projet sont passés (verdict des tests, à ne pas remettre en cause). Donne-moi un retour court sur mon code : deux points forts, deux améliorations possibles, sans réécrire tout le code.'
        : 'All the tests of my project passed (the tests’ verdict is final). Give me short feedback on my code: two strengths, two possible improvements, without rewriting the whole code.',
      code, lesson: titre, output: sortie, lang, agentId: prof.id,
    })
    setRetour(r.answer ?? (r.error === 'quota' ? (fr ? 'Limite de questions atteinte pour aujourd’hui.' : 'Question limit reached for today.') : (fr ? `${prof.name} est indisponible pour l’instant.` : `${prof.name} is unavailable right now.`)))
    setBusy(false)
  }
  return (
    <div className="rounded-xl border border-brass bg-paper p-3 space-y-2">
      <p className="text-sm font-semibold">🏁 {fr ? 'Projet validé par les tests.' : 'Project validated by the tests.'}</p>
      {!retour && <button className="btn btn-primary" disabled={busy} onClick={() => void demander()}>{busy ? '…' : fr ? `Demander le retour de ${prof.name}` : `Ask ${prof.name} for feedback`}</button>}
      {retour && <div className="text-sm"><Md text={retour} /></div>}
    </div>
  )
}
