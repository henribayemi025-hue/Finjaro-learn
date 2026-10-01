// learn-fiches — résumé, fiches question/réponse et quiz à partir d'un cours (texte, PDF ou photo).
// JWT obligatoire (verify_jwt = true). Clé Gemini lue côté serveur uniquement.
import { createClient } from 'npm:@supabase/supabase-js@2'

const MAX_TEXT = 30000 // caractères de cours
const MAX_FILE_B64 = 6_000_000 // ~4,5 Mo de fichier
const FILE_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp']

const ALLOWED_ORIGINS = ['https://learn.finjaro.net', 'https://finjaro.net', 'https://staging-finjaro.finjaro.workers.dev', 'http://localhost:5173']
const corsFor = (req: Request) => ({
  'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(req.headers.get('Origin') ?? '') ? req.headers.get('Origin')! : ALLOWED_ORIGINS[0],
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  Vary: 'Origin',
})

const SCHEMA = {
  type: 'OBJECT',
  properties: {
    title: { type: 'STRING' },
    summary: { type: 'STRING' },
    cards: {
      type: 'ARRAY',
      items: { type: 'OBJECT', properties: { q: { type: 'STRING' }, a: { type: 'STRING' } }, required: ['q', 'a'] },
    },
    quiz: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          q: { type: 'STRING' },
          choices: { type: 'ARRAY', items: { type: 'STRING' } },
          answer: { type: 'INTEGER' },
          why: { type: 'STRING' },
        },
        required: ['q', 'choices', 'answer', 'why'],
      },
    },
  },
  required: ['title', 'summary', 'cards', 'quiz'],
}

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

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return json({ error: 'bad_json' }, 400)
  }
  const lang = body.lang === 'en' ? 'en' : 'fr'
  const text = typeof body.text === 'string' ? body.text.slice(0, MAX_TEXT).trim() : ''
  const f = (body.file ?? null) as { mime?: unknown; data?: unknown } | null
  const file =
    f && typeof f.mime === 'string' && typeof f.data === 'string' && FILE_TYPES.includes(f.mime) && f.data.length <= MAX_FILE_B64
      ? { mime: f.mime, data: f.data }
      : null
  if (f && !file) return json({ error: 'bad_file' }, 400)
  if (text.length < 40 && !file) return json({ error: 'empty' }, 400)
  const nCards = Math.min(Math.max(Number(body.cards) || 8, 3), 15)
  const nQuiz = Math.min(Math.max(Number(body.quiz) || 5, 3), 10)

  const { data: ok, error: rpcErr } = await sb.rpc('learn_outils_consume', { p_outil: 'fiches' })
  if (rpcErr) return json({ error: 'quota_check' }, 500)
  if (!ok) return json({ error: 'quota' }, 429)

  const key = Deno.env.get('GEMINI_API_KEY')
  if (!key) return json({ error: 'unavailable' }, 503)

  const system =
    lang === 'en'
      ? `You turn a course into revision material for a student. Write in English. Use ONLY what is in the course provided: never add facts, figures or examples that are not in it. If the course is unreadable or too short, say so in "summary" and return empty lists. Produce: a short title; a summary (8 lines max); exactly ${nCards} question/answer flashcards; exactly ${nQuiz} multiple-choice questions with 4 choices, "answer" = index (0-3) of the right choice, and "why" = one-line explanation.`
      : `Tu transformes un cours en matériel de révision pour un étudiant. Écris en français. Utilise UNIQUEMENT ce qui est dans le cours fourni : n'ajoute aucun fait, chiffre ni exemple absent du cours. Si le cours est illisible ou trop court, dis-le dans « summary » et renvoie des listes vides. Produis : un titre court ; un résumé (8 lignes max) ; exactement ${nCards} fiches question/réponse ; exactement ${nQuiz} questions de quiz à 4 choix, « answer » = index (0-3) de la bonne réponse, « why » = explication en une ligne.`

  const parts: unknown[] = []
  if (file) parts.push({ inline_data: { mime_type: file.mime, data: file.data } })
  parts.push({ text: text ? `Cours :\n${text}` : 'Le cours est dans le fichier joint.' })

  const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: 'user', parts }],
      generationConfig: {
        maxOutputTokens: 4000,
        temperature: 0.3,
        responseMimeType: 'application/json',
        responseSchema: SCHEMA,
        thinkingConfig: { thinkingBudget: 0 },
      },
    }),
    signal: AbortSignal.timeout(50_000),
  }).catch((e) => (e?.name === 'TimeoutError' ? null : undefined))
  if (r === null) return json({ error: 'timeout' }, 504)
  if (!r || !r.ok) return json({ error: 'ai' }, 502)
  const data = await r.json()
  const raw = data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('') ?? ''
  let out: { title?: string; summary?: string; cards?: { q: string; a: string }[]; quiz?: { q: string; choices: string[]; answer: number; why: string }[] }
  try {
    out = JSON.parse(raw)
  } catch {
    return json({ error: 'empty_answer' }, 502)
  }
  // Nettoyage : on ne renvoie que des éléments bien formés.
  const cards = (out.cards ?? []).filter((c) => c && typeof c.q === 'string' && typeof c.a === 'string' && c.q && c.a)
  const quiz = (out.quiz ?? []).filter(
    (q) => q && typeof q.q === 'string' && Array.isArray(q.choices) && q.choices.length >= 2 && Number.isInteger(q.answer) && q.answer >= 0 && q.answer < q.choices.length,
  )
  if (!out.summary?.trim()) return json({ error: 'empty_answer' }, 502)
  return json({ title: out.title ?? '', summary: out.summary, cards, quiz })
})
