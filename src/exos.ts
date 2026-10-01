import { supabase } from './supabase'
import { runPython } from './runner'

export interface ExoGenere { titre: string; consigne: string; starter: string; solution: string; tests: string[] }

/** Demande un exercice sur mesure à learn-exos puis VÉRIFIE dans le navigateur que la solution passe les tests. */
export async function genereExo(c: { lecon: string; sujet: string; erreurs: string; lang: string; packages?: string[] }): Promise<{ exo?: ExoGenere; error?: 'quota' | 'ai' | 'invalide' }> {
  if (!supabase) return { error: 'ai' }
  for (let essai = 0; essai < 2; essai++) {
    const { data, error } = await supabase.functions.invoke('learn-exos', { body: c })
    if (error) {
      const status = (error as { context?: Response }).context?.status
      return { error: status === 429 ? 'quota' : 'ai' }
    }
    const exo = data as ExoGenere
    if (!exo?.solution || !Array.isArray(exo.tests)) continue
    const r = await runPython(exo.solution, exo.tests, c.packages)
    if (r.passed === true) return { exo }   // la solution de référence réussit ses propres tests : exercice cohérent
  }
  return { error: 'invalide' }
}
