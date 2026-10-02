import { supabase } from './supabase'

export interface TutorCtx {
  question: string
  code: string
  lesson: string
  output: string
  lang: string
  agentId: string
  espaceId?: string
  socratique?: boolean
  custom?: { name: string; personality: string }
}

/** Appelle la fonction edge learn-tutor (JWT de l'élève). Renvoie le texte ou un code d'erreur. */
export async function askTutor(c: TutorCtx): Promise<{ answer?: string; error?: 'quota' | 'ai' }> {
  if (!supabase) return { error: 'ai' }
  const { data, error } = await supabase.functions.invoke('learn-tutor', {
    body: {
      question: c.question, code: c.code, lesson: c.lesson, output: c.output, lang: c.lang,
      espace_id: c.espaceId,
      style: c.socratique ? 'socratique' : 'direct',
      agent: c.custom ? { custom: c.custom } : { id: c.agentId },
    },
  })
  if (error) {
    const status = (error as { context?: Response }).context?.status
    return { error: status === 429 ? 'quota' : 'ai' }
  }
  return data?.answer ? { answer: data.answer } : { error: 'ai' }
}

export interface FixProposal { explanation: string; fixed_code: string }

/** Demande une correction : explication + code corrigé (jamais appliqué sans l'accord de l'élève). */
export async function askFix(c: Omit<TutorCtx, 'question' | 'agentId'>): Promise<{ fix?: FixProposal; error?: 'quota' | 'ai' }> {
  if (!supabase) return { error: 'ai' }
  const { data, error } = await supabase.functions.invoke('learn-tutor', {
    body: { mode: 'fix', question: '', code: c.code, lesson: c.lesson, output: c.output, lang: c.lang, agent: { id: 'finia' } },
  })
  if (error) {
    const status = (error as { context?: Response }).context?.status
    return { error: status === 429 ? 'quota' : 'ai' }
  }
  return data?.fixed_code ? { fix: data as FixProposal } : { error: 'ai' }
}
