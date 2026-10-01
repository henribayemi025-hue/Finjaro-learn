import { supabase } from './supabase'

// Lecture seule des agents Léo de l'élève, avec SON JWT (droits RLS de membre).
// Accord de Beau (01/10) ; colonnes limitées à celles validées par Alpha ; aucune écriture, aucune clé de service.
export interface LeoEntreprise { id: string; nom: string }
export interface LeoAgent {
  id: string; nom: string; poste: string | null; personnalite: string | null
  avatar_url: string | null; emoji: string | null; couleur: string | null
}

export async function listEntreprises(): Promise<LeoEntreprise[]> {
  if (!supabase) return []
  const { data } = await supabase.from('legion_entreprises').select('id,nom').order('nom')
  return (data ?? []) as LeoEntreprise[]
}

export async function listLeoAgents(entrepriseId: string): Promise<LeoAgent[]> {
  if (!supabase) return []
  const { data } = await supabase
    .from('legion_agents')
    .select('id,nom,poste,personnalite,avatar_url,emoji,couleur')
    .eq('entreprise_id', entrepriseId)
    .eq('actif', true)
    .order('ordre')
  return (data ?? []) as LeoAgent[]
}

/** Adresse affichable : absolue telle quelle, relative rattachée à finjaro.net. */
export const leoAvatar = (u: string | null) =>
  !u ? undefined : /^https?:\/\//.test(u) ? u : 'https://finjaro.net' + (u.startsWith('/') ? u : '/' + u)
