// learn-news — nouveautés de l'IA, chaque élément avec ses sources réelles.
// Recherche Google de Gemini (outil google_search) : on ne garde que les éléments
// que Gemini rattache à au moins une source web ; sinon l'élément est écarté.
// JWT obligatoire (verify_jwt = true). Clé Gemini lue côté serveur uniquement.
import { createClient } from 'npm:@supabase/supabase-js@2'

const ALLOWED_ORIGINS = ['https://learn.finjaro.net', 'http://localhost:5173']
const corsFor = (req: Request) => ({
  'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(req.headers.get('Origin') ?? '') ? req.headers.get('Origin')! : ALLOWED_ORIGINS[0],
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  Vary: 'Origin',
})

const TOPICS: Record<string, { fr: string; en: string }> = {
  general: { fr: "l'intelligence artificielle en général (modèles, outils, produits)", en: 'artificial intelligence in general (models, tools, products)' },
  learn: { fr: "l'IA pour apprendre et pour coder (outils pour étudiants et développeurs)", en: 'AI for learning and coding (tools for students and developers)' },
  research: { fr: "la recherche en IA (publications, résultats, évaluations)", en: 'AI research (papers, results, evaluations)' },
}

type Chunk = { web?: { uri?: string; title?: string } }
type Support = { segment?: { text?: string }; groundingChunkIndices?: number[] }

Deno.serve(async (req) => {
  const cors = corsFor(req)
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'method' }, 405)

  const auth = req.headers.get('Authorization')
  if (!auth) return json({ error: 'auth' }, 401)
  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: auth } },
  })
  const { data: user } = await sb.auth.getUser()
  if (!user?.user) return json({ error: 'auth' }, 401)

  let body: Record<string, unknown> = {}
  try {
    body = await req.json()
  } catch { /* corps vide accepté */ }
  const lang = body.lang === 'en' ? 'en' : 'fr'
  const topic = typeof body.topic === 'string' && TOPICS[body.topic] ? body.topic : 'general'

  const { data: ok, error: rpcErr } = await sb.rpc('learn_outils_consume', { p_outil: 'news' })
  if (rpcErr) return json({ error: 'quota_check' }, 500)
  if (!ok) return json({ error: 'quota' }, 429)

  const key = Deno.env.get('GEMINI_API_KEY')
  if (!key) return json({ error: 'unavailable' }, 503)

  const today = new Date().toISOString().slice(0, 10)
  const system =
    lang === 'en'
      ? `You write a short AI newsletter. Today is ${today}. Use Google Search and report ONLY facts found in the search results from the last 30 days. Never invent a release, figure or date. Write 5 items, each on its own line starting with "- ", each 1 to 2 factual sentences with the date when known. No introduction, no conclusion. If you find fewer than 5 well-sourced items, write fewer.`
      : `Tu rédiges une courte newsletter sur l'IA. Nous sommes le ${today}. Utilise Google Search et rapporte UNIQUEMENT des faits trouvés dans les résultats de recherche des 30 derniers jours. N'invente aucune sortie, chiffre ni date. Écris 5 éléments, chacun sur sa ligne commençant par « - », 1 à 2 phrases factuelles avec la date quand elle est connue. Ni introduction ni conclusion. Si tu trouves moins de 5 éléments bien sourcés, écris-en moins.`

  const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: 'user', parts: [{ text: `Sujet : ${TOPICS[topic][lang]}` }] }],
      tools: [{ google_search: {} }],
      generationConfig: { maxOutputTokens: 1500, temperature: 0.2, thinkingConfig: { thinkingBudget: 0 } },
    }),
    signal: AbortSignal.timeout(50_000),
  }).catch((e) => (e?.name === 'TimeoutError' ? null : undefined))
  if (r === null) return json({ error: 'timeout' }, 504)
  if (!r || !r.ok) return json({ error: 'ai' }, 502)
  const data = await r.json()
  const cand = data?.candidates?.[0]
  const text: string = cand?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('') ?? ''
  const chunks: Chunk[] = cand?.groundingMetadata?.groundingChunks ?? []
  const supports: Support[] = cand?.groundingMetadata?.groundingSupports ?? []
  if (!text.trim() || chunks.length === 0) return json({ error: 'no_sources' }, 502)

  // Un élément = une ligne "- ". On garde ses sources via les segments rattachés par Gemini.
  const items = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.startsWith('- ') || l.startsWith('* '))
    .map((l) => l.slice(2).trim())
    .map((line) => {
      const idx = new Set<number>()
      for (const s of supports) {
        const seg = s.segment?.text?.trim()
        if (seg && (line.includes(seg) || seg.includes(line))) s.groundingChunkIndices?.forEach((i) => idx.add(i))
      }
      const sources = [...idx]
        .map((i) => chunks[i]?.web)
        .filter((w): w is { uri: string; title?: string } => !!w?.uri && /^https:\/\//.test(w.uri))
        .map((w) => ({ url: w.uri, title: w.title ?? '' }))
      return { text: line.replace(/\*\*/g, ''), sources }
    })
    .filter((it) => it.text && it.sources.length > 0) // rien sans source
  if (items.length === 0) return json({ error: 'no_sources' }, 502)
  return json({ date: today, items })
})
