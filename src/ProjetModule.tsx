import { useMemo, useState } from 'react'
import { lessons } from './lessons'
import { MODULES } from './cursusData'
import { TRACKS } from './tracks'
import { ECHECS_MAX, PROJETS, ecrireEtat, lireEtat, marquerReussi, projetReussi } from './projetsModules'
import { runLesson, type RunResult } from './runner'
import TravailSujet, { type ProjetProps } from './espace/TravailSujet'
import type { Lang } from './i18n'

/** Le projet de fin de module : tests pour valider, deux essais ratés = un autre projet, indices dévoilés un par un, rappels du module. */
export default function ProjetModule({ lang, moduleId, ai, signedIn, onClose, onSuite }: {
  lang: Lang; moduleId: string; ai: boolean; signedIn: boolean; onClose: () => void; onSuite: () => void
}) {
  const variantes = PROJETS[moduleId]
  const mi = MODULES.findIndex((m) => m.id === moduleId.split('-')[0])
  const module = MODULES[mi]
  const [etat, setEtat] = useState(() => lireEtat(moduleId))
  const [valide, setValide] = useState(() => !!projetReussi(moduleId))
  const [res, setRes] = useState<RunResult | null>(null)
  const [occupe, setOccupe] = useState<'' | 'run' | 'valider'>('')
  const projet = variantes[etat.v % variantes.length]
  const code = etat.codes[projet.id] ?? projet.starter
  const track = TRACKS.find((tr) => module.groups.some((g) => tr.groups.includes(g)))?.key ?? 'prog'
  const maj = (e: typeof etat) => { setEtat(e); ecrireEtat(moduleId, e) }

  const rappels = useMemo(() => (projet.rappels ?? []).map((id) => lessons.find((l) => l.id === id)).filter((l): l is NonNullable<typeof l> => !!l)
    .map((l) => ({ id: l.id, titre: l.title[lang], texte: l.explain[lang] })), [projet, lang])

  const lancer = async () => {
    if (occupe) return
    setOccupe('run')
    setRes(await runLesson(projet, code).finally(() => setOccupe('')))
  }
  const valider = async () => {
    if (occupe || valide) return
    setOccupe('valider')
    const r = await runLesson(projet, code).finally(() => setOccupe(''))
    setRes(r)
    if (r.passed) { marquerReussi(moduleId); setValide(true); return }
    maj({ ...etat, echecs: etat.echecs + 1 })
  }
  const autre = () => { setRes(null); maj({ ...etat, v: (etat.v + 1) % variantes.length, echecs: 0 }) }

  const props: ProjetProps = {
    numero: mi + 1, variante: projet.moduleProjet?.variante ?? 'A', essai: etat.echecs, max: ECHECS_MAX, valide, validation: occupe === 'valider',
    rappels, indices: (projet.indices ?? []).map((i) => i[lang]), vus: etat.vus[projet.id] ?? 0,
    onIndice: () => maj({ ...etat, vus: { ...etat.vus, [projet.id]: Math.min((etat.vus[projet.id] ?? 0) + 1, (projet.indices ?? []).length) } }),
    onValider: () => void valider(), onSuite, onAutre: variantes.length > 1 ? autre : undefined,
  }
  return (
    <TravailSujet key={projet.id} lang={lang} lesson={projet} track={track} code={code} onCode={(v) => maj({ ...etat, codes: { ...etat.codes, [projet.id]: v } })}
      onRun={lancer} res={res} running={occupe === 'run'} ai={ai} signedIn={signedIn} onClose={onClose} projet={props} />
  )
}
