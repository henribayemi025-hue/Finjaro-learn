// learn-tutor — tuteur de code IA de Finjaro Learn.
// JWT obligatoire (verify_jwt = true). Clé Gemini lue côté serveur uniquement.
import { createClient } from 'npm:@supabase/supabase-js@2'

const MAX_FIELD = 4000 // caractères par champ d'entrée
const MAX_HISTORY = 6

const ALLOWED_ORIGINS = ['https://learn.finjaro.net', 'http://localhost:5173']
const corsFor = (req: Request) => ({
  'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(req.headers.get('Origin') ?? '') ? req.headers.get('Origin')! : ALLOWED_ORIGINS[0],
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  Vary: 'Origin',
})
// Agents Learn (prompt système par agent). Un agent Léo choisi par l'élève passe par `agent.custom`.
const AGENTS: Record<string, string> = {
  js: 'Tu es Maya, prof de JavaScript : patiente, concrète, exemples simples.',
  ia: "Tu es Idris, prof d'IA et de Python : curieux, tu poses des questions pour faire réfléchir.",
  cv: 'Tu es Camille, coach CV : directe et encourageante.',
  fiches: 'Tu es Noé, rédacteur de fiches : clair, structuré, tu vas à l’essentiel.',
}

const clip = (v: unknown) => (typeof v === 'string' ? v.slice(0, MAX_FIELD) : '')

Deno.serve(async (req) => {
  const cors = corsFor(req)
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'method' }, 405)

  const auth = req.headers.get('Authorization')
  if (!auth) return json({ error: 'auth' }, 401)

  // Client avec le JWT de l'élève : auth.uid() est celui de l'appelant.
  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: auth } },
  })
  const { data: user } = await sb.auth.getUser()
  if (!user?.user) return json({ error: 'auth' }, 401)

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return json({ error: 'bad_json' }, 400)
  }
  const question = clip(body.question)
  const code = clip(body.code)
  const lesson = clip(body.lesson)
  const output = clip(body.output)
  const ag = (body.agent ?? {}) as Record<string, unknown>
  const custom = ag.custom as Record<string, unknown> | undefined
  const persona =
    typeof ag.id === 'string' && AGENTS[ag.id]
      ? AGENTS[ag.id]
      : custom
        ? `Tu es ${clip(custom.name).slice(0, 60)}. Personnalité : ${clip(custom.personality).slice(0, 500)}.`
        : ''
  const fixMode = body.mode === 'fix'
  const lang = body.lang === 'en' ? 'en' : 'fr'
  if (fixMode && !code) return json({ error: 'empty' }, 400)
  if (!question && !code) return json({ error: 'empty' }, 400)

  // Mode salon : l'appelant doit être membre de l'espace (vérifié avec SON JWT).
  const espaceId = typeof body.espace_id === 'string' ? body.espace_id : null
  if (espaceId) {
    const { data: member } = await sb.rpc('learn_est_membre', { eid: espaceId })
    if (!member) return json({ error: 'forbidden' }, 403)
  }

  const { data: ok, error: rpcErr } = await sb.rpc('learn_tutor_consume')
  if (rpcErr) return json({ error: 'quota_check' }, 500)
  if (!ok) return json({ error: 'quota' }, 429)

  const key = Deno.env.get('GEMINI_API_KEY')
  if (!key) return json({ error: 'unavailable' }, 503)

  let system =
    persona + ' ' +
    (lang === 'en'
      ? 'You are a patient coding tutor for a complete beginner learning JavaScript. Answer in English, short and simple (max 8 lines). Explain, give a tiny example, never dump the full solution unless asked twice.'
      : 'Tu es un tuteur de code patient pour un débutant complet qui apprend JavaScript. Réponds en français, court et simple (8 lignes max). Explique, donne un petit exemple, ne donne pas toute la solution sauf si on te la demande deux fois.')

  const fixHint = fixMode
    ? (lang === 'en'
        ? ' TASK: fix the learner\'s code so it satisfies the lesson goal. Reply as JSON {explanation, fixed_code}: explanation = 2-4 simple sentences saying what was wrong; fixed_code = the full corrected code, changing as little as possible.'
        : ' TÂCHE : corrige le code de l\'élève pour qu\'il atteigne l\'objectif de la leçon. Réponds en JSON {explanation, fixed_code} : explanation = 2 à 4 phrases simples sur ce qui n\'allait pas ; fixed_code = le code corrigé complet, en changeant le moins possible.')
    : ''
  system += fixHint
  const history = Array.isArray(body.history) ? body.history.slice(-MAX_HISTORY) : []
  const contents = [
    ...history
      .filter((h) => h && (h.role === 'user' || h.role === 'model') && typeof h.text === 'string')
      .map((h) => ({ role: h.role, parts: [{ text: String(h.text).slice(0, MAX_FIELD) }] })),
    {
      role: 'user',
      parts: [{ text: `Leçon : ${lesson}\nCode de l'élève :\n${code}\nRésultat :\n${output}\nQuestion : ${question}` }],
    },
  ]

  const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents,
      generationConfig: fixMode
        ? {
            maxOutputTokens: 2000,
            temperature: 0.2,
            thinkingConfig: { thinkingBudget: 0 },
            responseMimeType: 'application/json',
            responseSchema: {
              type: 'OBJECT',
              properties: { explanation: { type: 'STRING' }, fixed_code: { type: 'STRING' } },
              required: ['explanation', 'fixed_code'],
            },
          }
        : { maxOutputTokens: 600, temperature: 0.4, thinkingConfig: { thinkingBudget: 0 } },
    }),
    signal: AbortSignal.timeout(25_000),
  }).catch((e) => (e?.name === 'TimeoutError' ? null : undefined))
  if (r === null) return json({ error: 'timeout' }, 504)
  if (!r || !r.ok) return json({ error: 'ai' }, 502)
  const data = await r.json()
  const answer = data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('') ?? ''
  if (!answer.trim()) return json({ error: 'empty_answer' }, 502)
  if (fixMode) {
    // Correction proposée : l'élève la voit en différences et l'accepte ou la refuse côté client.
    try {
      const parsed = JSON.parse(answer)
      if (typeof parsed.fixed_code !== 'string' || typeof parsed.explanation !== 'string') throw new Error('shape')
      return json({ explanation: parsed.explanation.slice(0, 1500), fixed_code: parsed.fixed_code.slice(0, 8000) })
    } catch {
      return json({ error: 'bad_fix' }, 502)
    }
  }
  if (espaceId) {
    // Écriture du message d'agent côté serveur (clé de service lue ici seulement, jamais renvoyée).
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const agentLabel = typeof ag.id === 'string' ? ag.id : clip(custom?.name).slice(0, 60) || 'agent'
    const { data: posted } = await admin.rpc('learn_message_agent', { p_espace: espaceId, p_agent: agentLabel, p_texte: answer })
    if (!posted) return json({ error: 'quota_espace' }, 429)
  }
  return json({ answer })
})
