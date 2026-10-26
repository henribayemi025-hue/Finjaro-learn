import { lessons, type Lesson } from './lessons'
import { MODULES } from './cursusData'
import type { Lang } from './i18n'

const LANGAGE = { py: 'Python', js: 'JavaScript', sql: 'SQL' } as const

/**
 * Ce qu'on dit au prof sur l'élève : la leçon, ce que le cours vient de lui expliquer, ce qu'on lui demande, où il en est dans le cursus.
 * Beau (26/10) : « il doit savoir où j'en suis dans le cours, sinon il me dit un truc et le cours dit autre chose ».
 */
export function contexteCours(l: Lesson, lang: Lang, done: string[], extra = ''): string {
  const fr = lang === 'fr'
  const langage = LANGAGE[l.lang ?? 'js']
  const mi = MODULES.findIndex((m) => m.groups.includes(l.group ?? 'js'))
  const m = mi >= 0 ? MODULES[mi] : null
  const dansModule = m ? lessons.filter((x) => m.groups.includes(x.group ?? 'js')) : []
  const rang = dansModule.findIndex((x) => x.id === l.id) + 1
  const faitModule = dansModule.filter((x) => done.includes(x.id)).length
  const cours = l.explain[lang].replace(/\s+/g, ' ').slice(0, 900)
  const exemple = l.example ? l.example.slice(0, 300) : ''
  const tache = l.task[lang].slice(0, 300)
  const place = m
    ? fr
      ? `Il est dans le module ${mi + 1}/${MODULES.length} « ${m.titre.fr} » (leçon ${rang}/${dansModule.length}, ${faitModule} réussies dans ce module, ${done.length} réussies en tout).`
      : `He is in module ${mi + 1}/${MODULES.length} “${m.titre.en}” (lesson ${rang}/${dansModule.length}, ${faitModule} passed in this module, ${done.length} passed overall).`
    : fr ? `${done.length} leçons réussies en tout.` : `${done.length} lessons passed overall.`
  const regle = fr
    ? 'Tu es SON prof dans CE cours : reste cohérent avec le cours ci-dessus, reprends ses mots et ses images, ne le contredis jamais. N’invente rien qui ne soit pas dans la leçon sans le dire. Ne donne pas la solution de l’exercice. S’il écrit mal ou de travers, devine ce qu’il veut dire. Réponds court, une idée à la fois, et termine toujours ta phrase.'
    : 'You are HIS teacher in THIS course: stay consistent with the course above, reuse its words and images, never contradict it. Invent nothing that is not in the lesson without saying so. Do not give the exercise solution. If he writes badly, guess what he means. Answer short, one idea at a time, and always finish your sentence.'
  return [
    `[${langage}] ${l.title[lang]}`,
    place,
    `${fr ? 'Cours (déjà lu par l’élève)' : 'Course (already read by the learner)'} : ${cours}`,
    exemple && `${fr ? 'Exemple du cours' : 'Course example'} :\n${exemple}`,
    `${fr ? 'Exercice demandé' : 'Exercise asked'} : ${tache}`,
    extra,
    regle,
  ].filter(Boolean).join('\n').slice(0, 3900)
}
