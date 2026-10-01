// learn-tutor — tuteur de code IA de Finjaro Learn.
// JWT obligatoire (verify_jwt = true). Clé Gemini lue côté serveur uniquement.
import { createClient } from 'npm:@supabase/supabase-js@2'

const MAX_CALLS_PER_DAY = 60
const MAX_FIELD = 4000 // caractères par champ d'entrée
const MAX_HISTORY = 6

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

const clip = (v: unknown) => (typeof v === 'string' ? v.slice(0, MAX_FIELD) : '')

Deno.serve(async (req) => {
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
  const lang = body.lang === 'en' ? 'en' : 'fr'
  if (!question && !code) return json({ error: 'empty' }, 400)

  const { data: ok, error: rpcErr } = await sb.rpc('learn_tutor_consume', { max_calls: MAX_CALLS_PER_DAY })
  if (rpcErr) return json({ error: 'quota_check' }, 500)
  if (!ok) return json({ error: 'quota' }, 429)

  const key = Deno.env.get('GEMINI_API_KEY')
  if (!key) return json({ error: 'unavailable' }, 503)

  const system =
    (lang === 'en'
      ? 'You are a patient coding tutor for a complete beginner learning JavaScript. Answer in English, short and simple (max 8 lines). Explain, give a tiny example, never dump the full solution unless asked twice.'
      : 'Tu es un tuteur de code patient pour un débutant complet qui apprend JavaScript. Réponds en français, court et simple (8 lignes max). Explique, donne un petit exemple, ne donne pas toute la solution sauf si on te la demande deux fois.')

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
      generationConfig: { maxOutputTokens: 600, temperature: 0.4 },
    }),
  })
  if (!r.ok) return json({ error: 'ai' }, 502)
  const data = await r.json()
  const answer = data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('') ?? ''
  return json({ answer })
})
