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
  const mi = l.moduleProjet ? MODULES.findIndex((m) => m.id === l.moduleProjet!.module) : MODULES.findIndex((m) => m.groups.includes(l.group ?? 'js'))
  const m = mi >= 0 ? MODULES[mi] : null
  const dansModule = m ? lessons.filter((x) => m.groups.includes(x.group ?? 'js')) : []
  const rang = dansModule.findIndex((x) => x.id === l.id) + 1
  const faitModule = dansModule.filter((x) => done.includes(x.id)).length
  const faitsTitres = dansModule.filter((x) => done.includes(x.id) && x.id !== l.id).map((x) => x.title[lang]).slice(0, 25).join(' ; ').slice(0, 900)
  const acquis = faitsTitres ? `${fr ? 'Ce qu’il a déjà réussi dans ce module' : 'What he already passed in this module'} : ${faitsTitres}.` : ''
  const cours = l.explain[lang].replace(/\s+/g, ' ').slice(0, 900)
  const exemple = l.example ? l.example.slice(0, 300) : ''
  const tache = l.task[lang].slice(0, 300)
  const place = m && l.moduleProjet
    ? fr
      ? `Il est au projet de fin du module ${mi + 1}/${MODULES.length} « ${m.titre.fr} » (${faitModule}/${dansModule.length} leçons réussies dans ce module, ${done.length} réussies en tout).`
      : `He is at the end-of-module project of module ${mi + 1}/${MODULES.length} “${m.titre.en}” (${faitModule}/${dansModule.length} lessons passed in this module, ${done.length} passed overall).`
    : m
    ? fr
      ? `Il est dans le module ${mi + 1}/${MODULES.length} « ${m.titre.fr} » (leçon ${rang}/${dansModule.length}, ${faitModule} réussies dans ce module, ${done.length} réussies en tout).`
      : `He is in module ${mi + 1}/${MODULES.length} “${m.titre.en}” (lesson ${rang}/${dansModule.length}, ${faitModule} passed in this module, ${done.length} passed overall).`
    : fr ? `${done.length} leçons réussies en tout.` : `${done.length} lessons passed overall.`
  const projetLigne = l.moduleProjet
    ? fr ? `IL FAIT LE PROJET DE FIN DE MODULE (variante ${l.moduleProjet.variante}) : un vrai projet, vérifié par des tests. Aide-le à avancer sans écrire le code complet à sa place ; tu peux relire un morceau, expliquer une erreur, rappeler une notion. Il a 3 indices à dévoiler lui-même.`
      : `HE IS DOING THE END-OF-MODULE PROJECT (variant ${l.moduleProjet.variante}): a real project, checked by tests. Help him move forward without writing the full code for him; you may review a piece, explain an error, recall a notion. He has 3 hints to reveal himself.`
    : ''
  const regle = fr
    ? 'Tu es SON prof dans CE cours : reste cohérent avec le cours ci-dessus, reprends ses mots et ses images, ne le contredis jamais. N’invente rien qui ne soit pas dans la leçon sans le dire. Ne donne pas la solution de l’exercice. S’il écrit mal ou de travers, devine ce qu’il veut dire. Réponds court, une idée à la fois, et termine toujours ta phrase. Le code tourne dans le navigateur de l’élève (pas de notebook, pas de kernel). Tu ne peux pas savoir si son code réussit le test : appuie-toi uniquement sur l’état indiqué ci-dessus, et ne dis jamais « bravo, ça marche » si l’exercice n’est pas indiqué comme réussi. Si l’élève réclame un autre exercice, ne le donne pas toi-même (la leçon ne peut pas le vérifier) : dis-lui de réussir d’abord l’exercice de cette leçon, puis d’utiliser le bouton « Un exercice pour m’entraîner » qui en fabrique un vérifié.'
    : 'You are HIS teacher in THIS course: stay consistent with the course above, reuse its words and images, never contradict it. Invent nothing that is not in the lesson without saying so. Do not give the exercise solution. If he writes badly, guess what he means. Answer short, one idea at a time, and always finish your sentence. The code runs in the learner’s browser (no notebook, no kernel). You cannot know whether his code passes the test: rely only on the state given above, and never say “well done, it works” unless the exercise is stated as passed. If the learner asks for another exercise, do not give one yourself (the lesson cannot check it): tell him to pass this lesson’s exercise first, then use the “An exercise to practise” button that builds a verified one.'
  return [
    `[${langage}] ${l.title[lang]}`,
    place,
    acquis,
    projetLigne,
    `${fr ? 'Cours (déjà lu par l’élève)' : 'Course (already read by the learner)'} : ${cours}`,
    exemple && `${fr ? 'Exemple du cours' : 'Course example'} :\n${exemple}`,
    `${fr ? 'Exercice demandé' : 'Exercise asked'} : ${tache}`,
    extra,
    regle,
  ].filter(Boolean).join('\n').slice(0, 3900)
}
