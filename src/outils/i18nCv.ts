import type { Lang } from '../i18n'

export const c = {
  fr: {
    tab: 'CV et lettres',
    intro: 'Remplis les champs, ou colle un CV existant : tu obtiens un CV propre, une lettre adaptée à une offre, et un export PDF. Rien n’est inventé : seules tes informations sont utilisées.',
    modeCv: 'Créer mon CV', modeLetter: 'Lettre de motivation', modeImprove: 'Améliorer mon CV',
    name: 'Nom complet', target: 'Poste visé', contact: 'Contact (e-mail, téléphone, ville)',
    exp: 'Expériences (poste, organisation, période, ce que tu as fait)',
    edu: 'Formations (diplôme, école, période)', skills: 'Compétences', langs: 'Langues',
    offer: 'Offre d’emploi (colle le texte)', existing: 'Ton CV actuel (colle le texte)',
    gen: 'Générer', making: 'Création en cours…', tips: 'Pistes d’amélioration',
    letterH: 'Lettre de motivation', cvH: 'Ton CV',
    needMore: 'Ajoute un peu plus d’informations (nom, expérience ou formation).',
    needOffer: 'Colle l’offre d’emploi (40 caractères minimum).',
    needCv: 'Colle ton CV actuel (40 caractères minimum).',
    pdf: 'Exporter en PDF', copy: 'Copier', copied: 'Copié',
    note: 'Généré par IA à partir de tes informations seulement. Vérifie chaque ligne avant d’envoyer.',
    sExp: 'Expérience', sEdu: 'Formation', sSkills: 'Compétences', sLangs: 'Langues',
  },
  en: {
    tab: 'CV & letters',
    intro: 'Fill in the fields, or paste an existing CV: you get a clean CV, a letter tailored to a job offer, and a PDF export. Nothing is invented: only your information is used.',
    modeCv: 'Create my CV', modeLetter: 'Cover letter', modeImprove: 'Improve my CV',
    name: 'Full name', target: 'Target job', contact: 'Contact (email, phone, city)',
    exp: 'Experience (role, organisation, period, what you did)',
    edu: 'Education (degree, school, period)', skills: 'Skills', langs: 'Languages',
    offer: 'Job offer (paste the text)', existing: 'Your current CV (paste the text)',
    gen: 'Generate', making: 'Working…', tips: 'Ways to improve',
    letterH: 'Cover letter', cvH: 'Your CV',
    needMore: 'Add a bit more information (name, experience or education).',
    needOffer: 'Paste the job offer (40 characters minimum).',
    needCv: 'Paste your current CV (40 characters minimum).',
    pdf: 'Export as PDF', copy: 'Copy', copied: 'Copied',
    note: 'AI-generated from your information only. Check every line before sending.',
    sExp: 'Experience', sEdu: 'Education', sSkills: 'Skills', sLangs: 'Languages',
  },
} satisfies Record<Lang, Record<string, string>>

export const n = {
  fr: {
    tab: 'Actualités',
    intro: 'Les nouveautés de l’IA et de Finjaro. Chaque élément cite sa source ; ce qui n’a pas de source n’est pas affiché.',
    topics: { general: 'IA en général', learn: 'IA pour apprendre et coder', research: 'Recherche' } as Record<string, string>,
    load: 'Charger les nouveautés de l’IA', loading: 'Recherche en cours…',
    aiH: 'Nouveautés de l’IA', finH: 'Nouveautés Finjaro', sources: 'Sources',
    empty: 'Aucune actualité suffisamment sourcée trouvée. Réessaie plus tard.',
    note: 'Résumé automatique à partir d’une recherche web. Ouvre les sources pour vérifier.',
  },
  en: {
    tab: 'News',
    intro: 'What’s new in AI and at Finjaro. Every item cites its source; anything without a source is not shown.',
    topics: { general: 'AI in general', learn: 'AI for learning & coding', research: 'Research' } as Record<string, string>,
    load: 'Load AI news', loading: 'Searching…',
    aiH: 'AI news', finH: 'Finjaro news', sources: 'Sources',
    empty: 'No sufficiently sourced news found. Try again later.',
    note: 'Automatic summary from a web search. Open the sources to check.',
  },
} satisfies Record<Lang, Record<string, unknown>>
