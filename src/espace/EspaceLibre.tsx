import { useState } from 'react'
import TravailSujet from './TravailSujet'
import { runLesson, pythonPret, type RunResult } from '../runner'
import type { Lesson } from '../lessons'
import type { Lang } from '../i18n'

const DEPART = `# Espace libre : écris, lance, importe.
import numpy as np
import pandas as pd

df = pd.DataFrame({"produit": ["A", "B", "C"], "ventes": [120, 80, 45]})
print(df)
print("Total :", np.sum(df["ventes"]))
`

const libre = (): Lesson => ({
  id: 'espace-libre',
  title: { fr: 'Espace Python', en: 'Python workspace' },
  explain: { fr: 'Un espace libre : pas de leçon, pas de test. Écris du Python, importe tes bibliothèques, lance.', en: 'A free workspace: no lesson, no test. Write Python, import your libraries, run.' },
  example: DEPART,
  task: { fr: 'Écris ce que tu veux.', en: 'Write whatever you like.' },
  starter: DEPART,
  hint: { fr: '', en: '' },
  solution: DEPART,
  checks: [],
  lang: 'py',
})

// L'espace de code sans leçon (intégré dans Léo : /learn/#/espace?integre=1).
export default function EspaceLibre({ lang, signedIn, ai, onClose }: { lang: Lang; signedIn: boolean; ai: boolean; onClose: () => void }) {
  const [lesson] = useState(libre)
  const [code, setCode] = useState(() => { try { return localStorage.getItem('learn:espace-libre') || DEPART } catch { return DEPART } })
  const [res, setRes] = useState<RunResult | null>(null)
  const [running, setRunning] = useState(false)
  const lancer = async () => {
    if (running) return
    setRunning(true)
    try { setRes(await runLesson(lesson, code)) } finally { setRunning(false) }
  }
  void pythonPret
  return (
    <TravailSujet lang={lang} lesson={lesson} track="py" code={code} onCode={(v) => { setCode(v); try { localStorage.setItem('learn:espace-libre', v) } catch { /* ignoré */ } }}
      onRun={lancer} res={res} running={running} ai={ai} signedIn={signedIn} onClose={onClose} />
  )
}
