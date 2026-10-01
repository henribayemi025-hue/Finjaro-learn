import type { Lang } from './i18n'

export const ac = {
  fr: {
    socratic: 'Mode socratique', socraticHelp: 'l’agent ne donne pas la réponse : il te pose des questions pour te guider',
    voiceAI: 'Voix IA', voiceAIHelp: 'une vraie voix générée quand le service est ouvert ; sinon la voix de ton navigateur',
    hangUp: 'Raccrocher', callTitle: 'Appel avec', listening: 'Je t’écoute…', thinking: 'Je réfléchis…', speaking: 'Je parle…',
    idle: 'Appuie sur le micro pour parler.', micOn: 'Parler', micOff: 'Arrêter', you: 'Toi', noSpeech: 'La reconnaissance vocale n’est pas disponible sur ce navigateur. Essaie Chrome ou Safari.',
    needLogin: 'Connecte-toi pour appeler un agent.',
    custom: 'Créer mon agent', customTitle: 'Mon agent sur mesure', name: 'Prénom', role: 'Spécialité', personality: 'Personnalité',
    face: 'Visage', save: 'Créer', cancel: 'Annuler', remove: 'Supprimer cet agent', customHelp: 'Cet agent reste sur ton appareil.',
    curriculum: 'Parcours', curriculumHelp: 'Progresse à ton rythme : chaque parcours a ses exercices corrigés automatiquement.',
    inProgress: 'En cours', soon: 'À venir', lessonsCount: 'leçons faites',
    tracks: {
      prog: ['Programmation', 'JavaScript puis Python, algorithmique, structures de données.'],
      data: ['Data science', 'NumPy, pandas, statistiques, régression, classification, évaluation.'],
      dl: ['IA et deep learning', 'Neurone, rétropropagation, convolution, attention : crée tes réseaux.'],
      eng: ['AI engineering', 'RAG, sorties structurées, agents, évaluation, robustesse.'],
      prompt: ['Prompt engineering', 'Structurer, exemples, gabarits, injection, comparer.'],
    },
  },
  en: {
    socratic: 'Socratic mode', socraticHelp: 'the agent never gives the answer: it asks questions to guide you',
    voiceAI: 'AI voice', voiceAIHelp: 'a real generated voice when the service is open; otherwise your browser voice',
    hangUp: 'Hang up', callTitle: 'Call with', listening: 'Listening…', thinking: 'Thinking…', speaking: 'Speaking…',
    idle: 'Press the mic to talk.', micOn: 'Talk', micOff: 'Stop', you: 'You', noSpeech: 'Speech recognition is not available in this browser. Try Chrome or Safari.',
    needLogin: 'Sign in to call an agent.',
    custom: 'Create my agent', customTitle: 'My custom agent', name: 'First name', role: 'Specialty', personality: 'Personality',
    face: 'Face', save: 'Create', cancel: 'Cancel', remove: 'Delete this agent', customHelp: 'This agent stays on your device.',
    curriculum: 'Tracks', curriculumHelp: 'Go at your own pace: every track has automatically checked exercises.',
    inProgress: 'In progress', soon: 'Coming', lessonsCount: 'lessons done',
    tracks: {
      prog: ['Programming', 'JavaScript then Python, algorithms, data structures.'],
      data: ['Data science', 'NumPy, pandas, statistics, regression, classification, evaluation.'],
      dl: ['AI and deep learning', 'Neuron, backpropagation, convolution, attention: build your networks.'],
      eng: ['AI engineering', 'RAG, structured outputs, agents, evaluation, robustness.'],
      prompt: ['Prompt engineering', 'Structure, examples, templates, injection, comparing.'],
    },
  },
} as const

export const acu = (l: Lang) => ac[l]
