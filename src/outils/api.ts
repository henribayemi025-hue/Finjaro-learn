import { supabase } from '../supabase'

export type OutilError = 'quota' | 'ai' | 'timeout' | 'auth' | 'empty'

/** Appelle une fonction edge learn-* avec le JWT de la personne. */
export async function callOutil<T>(fn: string, body: Record<string, unknown>): Promise<{ data?: T; error?: OutilError }> {
  if (!supabase) return { error: 'ai' }
  const { data, error } = await supabase.functions.invoke(fn, { body })
  if (error) {
    const status = (error as { context?: Response }).context?.status
    return { error: status === 429 ? 'quota' : status === 504 ? 'timeout' : status === 401 ? 'auth' : status === 400 ? 'empty' : 'ai' }
  }
  return data ? { data: data as T } : { error: 'ai' }
}
