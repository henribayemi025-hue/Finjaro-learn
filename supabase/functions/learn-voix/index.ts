// learn-voix — voix des agents (synthèse vocale Gemini) avec la clé DÉJÀ présente.
// DÉSACTIVÉE par défaut : ne répond que si le secret LEARN_VOIX_ENABLED vaut '1' (décision de Beau : coût éventuel).
// JWT obligatoire. Plafond par personne et par jour dans le SQL (learn_quota_consume 'voix').
import { createClient } from 'npm:@supabase/supabase-js@2'

const ALLOWED_ORIGINS = ['https://learn.finjaro.net', 'https://finjaro.net', 'https://staging-finjaro.finjaro.workers.dev', 'http://localhost:5173']
const VOICES = ['Kore', 'Puck', 'Charon', 'Zephyr', 'Leda', 'Orus']

const corsFor = (req: Request) => ({
  'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(req.headers.get('Origin') ?? '') ? req.headers.get('Origin')! : ALLOWED_ORIGINS[0],
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  Vary: 'Origin',
})

Deno.serve(async (req) => {
  const cors = corsFor(req)
  const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...cors, 'Content-Type': 'application/json' } })
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'method' }, 405)
  if (Deno.env.get('LEARN_VOIX_ENABLED') !== '1') return json({ error: 'disabled' }, 503)
  const auth = req.headers.get('Authorization')
  if (!auth) return json({ error: 'auth' }, 401)

  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: auth } } })
  const { data: user } = await sb.auth.getUser()
  if (!user?.user) return json({ error: 'auth' }, 401)

  let body: Record<string, unknown>
  try { body = await req.json() } catch { return json({ error: 'bad_json' }, 400) }
  const text = typeof body.text === 'string' ? body.text.slice(0, 500) : ''
  const voice = typeof body.voice === 'string' && VOICES.includes(body.voice) ? body.voice : 'Kore'
  if (!text.trim()) return json({ error: 'empty' }, 400)

  const { data: ok, error: rpcErr } = await sb.rpc('learn_quota_consume', { p_kind: 'voix' })
  if (rpcErr) return json({ error: 'quota_check' }, 500)
  if (!ok) return json({ error: 'quota' }, 429)

  const key = Deno.env.get('GEMINI_API_KEY')
  if (!key) return json({ error: 'unavailable' }, 503)

  const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({
      contents: [{ parts: [{ text }] }],
      generationConfig: { responseModalities: ['AUDIO'], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } } },
    }),
    signal: AbortSignal.timeout(25_000),
  }).catch((e) => (e?.name === 'TimeoutError' ? null : undefined))
  if (r === null) return json({ error: 'timeout' }, 504)
  if (!r || !r.ok) return json({ error: 'ai' }, 502)
  const data = await r.json()
  const audio = data?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data
  if (typeof audio !== 'string' || !audio) return json({ error: 'empty_audio' }, 502)
  // PCM 16 bits mono, 24 kHz (format de sortie de Gemini TTS)
  return json({ audio, rate: 24000 })
})
