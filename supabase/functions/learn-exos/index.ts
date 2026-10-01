// learn-exos — génère un exercice de programmation sur mesure (Python) avec la clé Gemini DÉJÀ présente.
// JWT obligatoire. Plafond par personne et par jour dans le SQL (learn_quota_consume 'exos').
// Le NAVIGATEUR exécute la solution contre les tests avant d'afficher l'exercice : un exercice faux n'est jamais montré.
import { createClient } from 'npm:@supabase/supabase-js@2'

const ALLOWED_ORIGINS = ['https://learn.finjaro.net', 'https://finjaro.net', 'https://staging-finjaro.finjaro.workers.dev', 'http://localhost:5173']
const MAX = 600

const corsFor = (req: Request) => ({
  'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(req.headers.get('Origin') ?? '') ? req.headers.get('Origin')! : ALLOWED_ORIGINS[0],
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  Vary: 'Origin',
})
const clip = (v: unknown, n = MAX) => (typeof v === 'string' ? v.slice(0, n) : '')

Deno.serve(async (req) => {
  const cors = corsFor(req)
  const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...cors, 'Content-Type': 'application/json' } })
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'method' }, 405)
  const auth = req.headers.get('Authorization')
  if (!auth) return json({ error: 'auth' }, 401)

  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: auth } } })
  const { data: user } = await sb.auth.getUser()
  if (!user?.user) return json({ error: 'auth' }, 401)

  let body: Record<string, unknown>
  try { body = await req.json() } catch { return json({ error: 'bad_json' }, 400) }
  const sujet = clip(body.sujet, 200)
  const lecon = clip(body.lecon, 200)
  const erreurs = clip(body.erreurs, 800)
  const lang = body.lang === 'en' ? 'en' : 'fr'
  if (!sujet && !lecon) return json({ error: 'empty' }, 400)

  const { data: ok, error: rpcErr } = await sb.rpc('learn_quota_consume', { p_kind: 'exos' })
  if (rpcErr) return json({ error: 'quota_check' }, 500)
  if (!ok) return json({ error: 'quota' }, 429)

  const key = Deno.env.get('GEMINI_API_KEY')
  if (!key) return json({ error: 'unavailable' }, 503)

  const consigne =
    (lang === 'en'
      ? 'You write ONE small Python practice exercise for a beginner who is stuck. Language of the text: English.'
      : 'Tu écris UN petit exercice de pratique en Python pour un débutant qui bloque. Langue du texte : français.') +
    ' Rules: the learner writes ONE function (give its exact name and signature in the statement); standard library only (numpy/pandas only if the topic needs it); deterministic; no input(), no files, no network, no randomness without a seed; tests = 4 to 6 Python boolean EXPRESSIONS calling only that function (no imports, no assignments), including edge cases; solution = a complete correct reference; starter = the function signature with `pass`; at most 15 lines. The exercise must train the SAME idea as the lesson but with a different, concrete story, and be easier or equal in difficulty.'

  const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: consigne }] },
      contents: [{ role: 'user', parts: [{ text: `Leçon : ${lecon}\nSujet : ${sujet}\nErreurs récentes de l'élève : ${erreurs}` }] }],
      generationConfig: {
        maxOutputTokens: 1800, temperature: 0.6, thinkingConfig: { thinkingBudget: 0 },
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            titre: { type: 'STRING' }, consigne: { type: 'STRING' }, starter: { type: 'STRING' }, solution: { type: 'STRING' },
            tests: { type: 'ARRAY', items: { type: 'STRING' } },
          },
          required: ['titre', 'consigne', 'starter', 'solution', 'tests'],
        },
      },
    }),
    signal: AbortSignal.timeout(25_000),
  }).catch((e) => (e?.name === 'TimeoutError' ? null : undefined))
  if (r === null) return json({ error: 'timeout' }, 504)
  if (!r || !r.ok) return json({ error: 'ai' }, 502)
  try {
    const data = await r.json()
    const text = data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('') ?? ''
    const o = JSON.parse(text)
    const tests = Array.isArray(o.tests) ? o.tests.filter((t: unknown) => typeof t === 'string').slice(0, 8) : []
    if (!o.titre || !o.consigne || !o.starter || !o.solution || tests.length < 2) return json({ error: 'bad_exercise' }, 502)
    return json({
      titre: String(o.titre).slice(0, 120), consigne: String(o.consigne).slice(0, 800),
      starter: String(o.starter).slice(0, 1500), solution: String(o.solution).slice(0, 3000), tests: tests.map((t: string) => t.slice(0, 300)),
    })
  } catch {
    return json({ error: 'bad_exercise' }, 502)
  }
})
