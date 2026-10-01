// Nouveautés Finjaro : liste tenue à la main, uniquement des faits vérifiables et datés.
// Règle : jamais de chiffre non mesuré, jamais « en ligne » sans l'avoir vu servi.
export interface FinjaroNews { date: string; fr: string; en: string; source: { fr: string; en: string } }

export const finjaroNews: FinjaroNews[] = [
  {
    date: '2026-10-01',
    fr: 'Finjaro Learn : le tuteur de code (leçons, exercices exécutés dans le navigateur, correction automatique) est en construction.',
    en: 'Finjaro Learn: the code tutor (lessons, exercises run in the browser, automatic checking) is under construction.',
    source: { fr: 'Journal de bord Finjaro Learn, 01/10/2026', en: 'Finjaro Learn project log, 2026-10-01' },
  },
  {
    date: '2026-10-01',
    fr: 'Finjaro Learn : des outils de révision (fiches et quiz à partir d’un cours) et de candidature (CV, lettre de motivation) sont en cours de mise en place.',
    en: 'Finjaro Learn: revision tools (cards and quiz from a course) and application tools (CV, cover letter) are being set up.',
    source: { fr: 'Journal de bord Finjaro Learn, 01/10/2026', en: 'Finjaro Learn project log, 2026-10-01' },
  },
]
