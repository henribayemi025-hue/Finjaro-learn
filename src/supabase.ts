import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** null si la base n'est pas configurée : l'appli reste utilisable sans compte. */
export const supabase = url && key ? createClient(url, key) : null

/** Après connexion, on revient sur Learn (et non sur le Site URL finjaro.net). */
export const redirectTo = window.location.origin + '/'
