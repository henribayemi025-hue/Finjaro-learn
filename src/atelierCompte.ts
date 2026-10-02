// Atelier V2 : sauvegarde des projets dans le compte (tables learn_projets et learn_projet_fichiers, appliquées par Alpha le 02/10).
// La copie sur l'appareil (IndexedDB) reste la copie de travail ; le compte est une sauvegarde que l'on retrouve sur un autre appareil.
// Plafonds côté base : 30 projets, 50 fichiers par projet, 100 000 caractères par fichier, 5 Mo par personne.
import { supabase } from './supabase'
import { nouvelId, type Projet } from './atelierStore'
import type { Lang } from './i18n'

export interface ResumeCompte { id: string; titre: string; langage: 'py' | 'js'; principal: string; updated_at: string }

export const MAX_CARACTERES = 100_000
export const MAX_FICHIERS = 50

/** Empreinte courte d'un contenu : sert à n'envoyer que les fichiers modifiés depuis la dernière sauvegarde. */
export function empreinte(s: string) {
  let h = 5381
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0
  return s.length.toString(36) + '.' + (h >>> 0).toString(36)
}

/** Clé réservée de l'empreinte des métadonnées (« : » n'est jamais dans un nom de fichier). */
const META = ':meta'
const empreinteMeta = (p: Pick<Projet, 'titre' | 'lang' | 'principal'>) => empreinte([p.titre.trim(), p.lang, p.principal].join('\n'))

/** Vrai si le projet a des changements que le compte n'a pas encore (fichiers, titre, langage ou fichier principal). */
export function nonEnregistre(p: Projet) {
  const snap = p.compteSnap ?? {}
  if (!p.compteId) return false
  if (snap[META] !== empreinteMeta(p)) return true
  const chemins = Object.keys(snap).filter((c) => c !== META)
  return chemins.length !== p.fichiers.length || p.fichiers.some((f) => snap[f.chemin] !== empreinte(f.contenu))
}

/** Erreur lisible : les messages « learn_limite: … » de la base deviennent une phrase humaine. */
export class ErreurCompte extends Error {}

function lisible(e: { message?: string; code?: string } | null, lang: Lang): ErreurCompte {
  const m = e?.message ?? ''
  if (m.includes('learn_limite:')) {
    const detail = m.split('learn_limite:')[1].trim()
    return new ErreurCompte(lang === 'fr'
      ? `Limite atteinte : exporte ou supprime un projet. (${detail})`
      : `Limit reached: export or delete a project. (${detail})`)
  }
  if (e?.code === '23514') {
    return new ErreurCompte(lang === 'fr'
      ? 'Un fichier n’est pas accepté : nom en lettres simples, chiffres, _ . / - (80 caractères au plus) et 100 000 caractères au plus par fichier.'
      : 'A file was refused: name with plain letters, digits, _ . / - (80 characters max) and at most 100,000 characters per file.')
  }
  return new ErreurCompte(lang === 'fr' ? 'La sauvegarde dans le compte a échoué. Ton projet reste sur cet appareil ; réessaie plus tard.' : 'Saving to your account failed. Your project stays on this device; try again later.')
}

const base = () => {
  if (!supabase) throw new ErreurCompte('Compte indisponible')
  return supabase
}

/** Vérifications avant envoi, pour expliquer le problème sans attendre la base. */
export function verifier(p: Projet, lang: Lang): string | null {
  if (p.fichiers.length > MAX_FICHIERS) return lang === 'fr' ? `Trop de fichiers : ${MAX_FICHIERS} au plus par projet.` : `Too many files: ${MAX_FICHIERS} at most per project.`
  const gros = p.fichiers.find((f) => f.contenu.length > MAX_CARACTERES)
  if (gros) return lang === 'fr' ? `« ${gros.chemin} » dépasse 100 000 caractères : coupe-le en plusieurs fichiers.` : `“${gros.chemin}” exceeds 100,000 characters: split it into several files.`
  const mal = p.fichiers.find((f) => !/^[A-Za-z0-9_./-]{1,80}$/.test(f.chemin) || f.chemin.includes('..'))
  if (mal) return lang === 'fr' ? `Nom de fichier refusé par le compte : « ${mal.chemin} » (lettres sans accent, chiffres, _ . / -).` : `File name refused by the account: “${mal.chemin}” (plain letters, digits, _ . / -).`
  return null
}

export async function listeCompte(): Promise<ResumeCompte[]> {
  const { data, error } = await base().from('learn_projets').select('id,titre,langage,principal,updated_at').order('updated_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as ResumeCompte[]
}

/**
 * Enregistre le projet dans le compte. Renvoie le projet local mis à jour (compteId, empreintes, date).
 * Ordre : métadonnées, fichiers supprimés, fichiers modifiés, nouveaux fichiers. Un fichier existant est mis à jour
 * (jamais ré-inséré), pour ne pas buter sur le plafond de 50 fichiers d'un projet déjà plein.
 */
export async function enregistrerCompte(p: Projet, lang: Lang): Promise<Projet> {
  const sb = base()
  const probleme = verifier(p, lang)
  if (probleme) throw new ErreurCompte(probleme)
  const { data: u } = await sb.auth.getUser()
  if (!u.user) throw new ErreurCompte(lang === 'fr' ? 'Connecte-toi pour enregistrer dans ton compte.' : 'Sign in to save to your account.')
  const titre = p.titre.trim().slice(0, 80) || (lang === 'fr' ? 'Mon projet' : 'My project')
  const meta = { titre, langage: p.lang, principal: p.principal }

  let compteId = p.compteId
  let snap = p.compteSnap ?? {}
  if (compteId) {
    const { data, error } = await sb.from('learn_projets').update(meta).eq('id', compteId).select('id')
    if (error) throw lisible(error, lang)
    if (!data?.length) { compteId = undefined; snap = {} } // supprimé du compte entre-temps : on le recrée
  }
  if (!compteId) {
    const { data, error } = await sb.from('learn_projets').insert({ ...meta, user_id: u.user.id }).select('id').single()
    if (error) throw lisible(error, lang)
    compteId = (data as { id: string }).id
    snap = {}
  }

  const ici = new Set(p.fichiers.map((f) => f.chemin))
  const partis = Object.keys(snap).filter((c) => c !== META && !ici.has(c))
  if (partis.length) {
    const { error } = await sb.from('learn_projet_fichiers').delete().eq('projet_id', compteId).in('chemin', partis)
    if (error) throw lisible(error, lang)
  }
  const nouveauSnap: Record<string, string> = { [META]: empreinteMeta({ ...p, titre }) }
  const nouveaux = []
  for (const f of p.fichiers) {
    const h = empreinte(f.contenu)
    nouveauSnap[f.chemin] = h
    if (!(f.chemin in snap) || f.chemin === META) nouveaux.push({ projet_id: compteId, chemin: f.chemin, contenu: f.contenu })
    else if (snap[f.chemin] !== h) {
      const { error } = await sb.from('learn_projet_fichiers').update({ contenu: f.contenu }).eq('projet_id', compteId).eq('chemin', f.chemin)
      if (error) throw lisible(error, lang)
    }
  }
  if (nouveaux.length) {
    const { error } = await sb.from('learn_projet_fichiers').insert(nouveaux)
    if (error) throw lisible(error, lang)
  }
  return { ...p, titre, compteId, compteSnap: nouveauSnap, compteMaj: new Date().toISOString() }
}

/** Récupère un projet du compte sous forme de projet local (nouvel identifiant local si `idLocal` est absent). */
export async function chargerCompte(compteId: string, idLocal?: string): Promise<Projet> {
  const sb = base()
  const [{ data: pr, error: e1 }, { data: fs, error: e2 }] = await Promise.all([
    sb.from('learn_projets').select('id,titre,langage,principal,updated_at').eq('id', compteId).single(),
    sb.from('learn_projet_fichiers').select('chemin,contenu').eq('projet_id', compteId).order('chemin'),
  ])
  if (e1 || e2 || !pr) throw e1 ?? e2 ?? new Error('introuvable')
  const r = pr as ResumeCompte
  const fichiers = ((fs ?? []) as { chemin: string; contenu: string }[]).map((f) => ({ chemin: f.chemin, contenu: f.contenu }))
  if (!fichiers.length) fichiers.push({ chemin: r.principal, contenu: '' })
  const principal = fichiers.some((f) => f.chemin === r.principal) ? r.principal : fichiers[0].chemin
  const compteSnap = Object.fromEntries(fichiers.map((f) => [f.chemin, empreinte(f.contenu)]))
  compteSnap[META] = empreinteMeta({ titre: r.titre, lang: r.langage, principal })
  return { id: idLocal ?? nouvelId(), titre: r.titre, lang: r.langage, principal, fichiers, maj: new Date().toISOString(), compteId, compteSnap, compteMaj: r.updated_at }
}

export async function supprimerCompte(compteId: string) {
  const { error } = await base().from('learn_projets').delete().eq('id', compteId)
  if (error) throw error
}
