// Protocole de l'éditeur partagé (pilote / copilote) : logique pure, testable sans réseau.
// Confiance : entre membres d'un même espace (canal Realtime privé réservé aux membres) ;
// le « un seul pilote écrit » est appliqué côté client, pas par le serveur.

export interface Member { name: string; seen: number }
export interface CoState {
  pilot: string               // id du pilote ('' tant que personne n'a pris la main)
  lesson: string              // id de la leçon travaillée ensemble
  code: string
  members: Record<string, Member>
}

export type CoEvent =
  | { t: 'hello'; from: string; name: string; ask?: boolean }
  | { t: 'code'; from: string; code: string; lesson: string }
  | { t: 'pilot'; from: string; to: string; claim?: boolean }
  | { t: 'state'; from: string; pilot: string; lesson: string; code: string }

export const HELLO_EVERY = 5000
export const GONE_AFTER = 16000

export const initial = (lesson: string, code: string): CoState => ({ pilot: '', lesson, code, members: {} })

export function apply(s: CoState, ev: CoEvent, now: number): CoState {
  switch (ev.t) {
    case 'hello':
      return { ...s, members: { ...s.members, [ev.from]: { name: ev.name, seen: now } } }
    case 'code':
      // Seul le pilote écrit.
      return ev.from === s.pilot ? { ...s, code: ev.code, lesson: ev.lesson } : s
    case 'pilot':
      if (ev.claim) {
        // Prise de main initiale : la plus petite identité gagne, de façon identique chez tous.
        return s.pilot === '' || ev.to < s.pilot ? { ...s, pilot: ev.to } : s
      }
      return ev.from === s.pilot ? { ...s, pilot: ev.to } : s   // passer la main : seulement depuis le pilote
    case 'state':
      return s.pilot === '' || ev.from === s.pilot ? { ...s, pilot: ev.pilot, lesson: ev.lesson, code: ev.code } : s
  }
}

/** Retire les absents ; si le pilote est parti, la plus petite identité présente reprend (même résultat chez tous). */
export function prune(s: CoState, me: string, now: number): CoState {
  const members = Object.fromEntries(Object.entries(s.members).filter(([id, m]) => id === me || now - m.seen < GONE_AFTER))
  let pilot = s.pilot
  if (pilot && pilot !== me && !(pilot in members)) pilot = Object.keys(members).sort()[0] ?? me
  return { ...s, members, pilot }
}
