import { supabase } from './supabase'

export interface TutorCtx {
  question: string
  code: string
  lesson: string
  output: string
  lang: string
  agentId: string
}

/** Appelle la fonction edge learn-tutor (JWT de l'élève). Renvoie le texte ou un code d'erreur. */
export async function askTutor(c: TutorCtx): Promise<{ answer?: string; error?: 'quota' | 'ai' }> {
  if (!supabase) return { error: 'ai' }
  const { data, error } = await supabase.functions.invoke('learn-tutor', {
    body: {
      question: c.question, code: c.code, lesson: c.lesson, output: c.output, lang: c.lang,
      agent: { id: c.agentId },
    },
  })
  if (error) {
    const status = (error as { context?: Response }).context?.status
    return { error: status === 429 ? 'quota' : 'ai' }
  }
  return data?.answer ? { answer: data.answer } : { error: 'ai' }
}
