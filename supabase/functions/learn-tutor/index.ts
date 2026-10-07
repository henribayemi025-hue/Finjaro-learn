// learn-tutor — Finia, l'assistante de Finjaro, dans son rôle de tutrice pour Finjaro Learn (et les autres agents de Learn).
// JWT obligatoire (verify_jwt = true). Clé Gemini lue côté serveur uniquement.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { ecrire, lireJson, type Tour } from '../_shared/chaine.ts'

const MAX_FIELD = 4000 // caractères par champ d'entrée
const MAX_HISTORY = 6

const ALLOWED_ORIGINS = ['https://learn.finjaro.net', 'https://finjaro.net', 'https://staging-finjaro.finjaro.workers.dev', 'http://localhost:5173']
const corsFor = (req: Request) => ({
  'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(req.headers.get('Origin') ?? '') ? req.headers.get('Origin')! : ALLOWED_ORIGINS[0],
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  Vary: 'Origin',
})
// Agents Learn (prompt système par agent). Un agent Léo choisi par l'élève passe par `agent.custom`.
const AGENTS: Record<string, string> = {
  finia: "Tu es Finia, l'assistante de Finjaro ; ici, dans Finjaro Learn, tu aides à apprendre. Ton ton : chaleureux et simple, tu tutoies.",
  js: 'Tu es Maya, prof de JavaScript : patiente, concrète, exemples simples.',
  ia: "Tu es Idris, prof d'IA et de Python : curieux, tu poses des questions pour faire réfléchir.",
  cv: 'Tu es Camille, coach CV : directe et encourageante.',
  fiches: 'Tu es Noé, rédacteur de fiches : clair, structuré, tu vas à l’essentiel.',
}

// Les leçons de départ où un prof peut envoyer un élève perdu, avec le prof qui s'en occupe
// (Beau, 07/10 : « soit il m'apprend, soit il m'amène vers celui qui est spécialisé pour les
// nouveaux, ou vers le cours spécialisé »). Liste fermée : le modèle ne peut citer qu'une de ces leçons.
const DEPARTS: Record<string, { prof: string; fr: string; en: string }> = {
  'afficher': { prof: 'js', fr: 'tout premier pas en code, en JavaScript (afficher un message)', en: 'very first step in code, in JavaScript (print a message)' },
  'py-print': { prof: 'ia', fr: 'tout premier pas en Python (afficher du texte)', en: 'very first step in Python (print text)' },
  'maths-dot': { prof: 'ia', fr: "maths pour l'IA depuis le début (vecteurs)", en: 'maths for AI from the start (vectors)' },
  'ds-np-array': { prof: 'ia', fr: 'débuter en data science (NumPy)', en: 'starting data science (NumPy)' },
  'dl-neuron': { prof: 'ia', fr: "débuter en IA (le neurone artificiel) ; suppose de savoir déjà écrire un peu de Python", en: 'starting AI (the artificial neuron); assumes a little Python' },
  'pe-structure': { prof: 'ia', fr: 'parler à une IA, sans coder (structurer un prompt)', en: 'talking to an AI, no coding (structuring a prompt)' },
  'git-hash': { prof: 'ia', fr: 'débuter avec Git et GitHub', en: 'starting with Git and GitHub' },
}
const NOMS: Record<string, string> = { finia: 'Finia', js: 'Maya', ia: 'Idris' }

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
  let question = clip(body.question)
  let code = clip(body.code)
  let lesson = clip(body.lesson)
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

  // (la vérification « non vide » suit la lecture de la question en mode entraide)
  // Mode entraide : la question est relue en base avec le JWT de l'appelant (RLS) ; le client n'envoie que son id.
  const entraideId = body.mode === 'entraide' && typeof body.question_id === 'string' ? body.question_id : null
  if (body.mode === 'entraide') {
    if (!entraideId || typeof ag.id !== 'string' || !AGENTS[ag.id]) return json({ error: 'bad_request' }, 400)
    const { data: q } = await sb.from('learn_entraide_questions').select('titre,corps,code').eq('id', entraideId).maybeSingle()
    if (!q) return json({ error: 'not_found' }, 404)
    question = `${q.titre}\n${q.corps}`.slice(0, MAX_FIELD)
    code = String(q.code ?? '').slice(0, MAX_FIELD)
    lesson = 'entraide'
  }

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


  // Ce que tout agent de Learn sait de l'environnement (une ligne chacun, aucun chiffre).
  const contexte = lang === 'en'
    ? ' Finjaro context (mention only if useful): the marketplace finjaro.net; Finjaro Accounting (https://accounting.finjaro.net); Léo, the agents (https://finjaro.net/legion); one account for all of them. Never invent a number (users, prices, results): if you do not know, say so.'
    : ' Contexte Finjaro (à citer seulement si c\'est utile) : la place de marché finjaro.net ; Finjaro Accounting (https://accounting.finjaro.net) ; Léo, les agents (https://finjaro.net/legion) ; un seul compte pour tout. N\'invente aucun chiffre (utilisateurs, prix, résultats) : si tu ne sais pas, dis-le.'
  let system =
    (persona || AGENTS.finia) + ' ' +
    (lang === 'en'
      ? 'Your role here: a patient coding tutor for a complete beginner (JavaScript or Python, as stated in the lesson context). Answer in English, short and simple (max 8 lines). Give progressive hints: first the idea, then where to look, a tiny example; never dump the full solution unless asked twice.' + contexte
      : 'Ton rôle ici : tuteur ou tutrice de code patient(e) pour un débutant complet (JavaScript ou Python, selon la leçon). Réponds en français, court et simple (8 lignes max). Donne des indices progressifs : d\'abord l\'idée, puis où regarder, un petit exemple ; ne donne pas toute la solution sauf si on te la demande deux fois.' + contexte)

  const fixHint = fixMode
    ? (lang === 'en'
        ? ' TASK: fix the learner\'s code so it satisfies the lesson goal. Reply as JSON {explanation, fixed_code}: explanation = 2-4 simple sentences saying what was wrong; fixed_code = the full corrected code, changing as little as possible.'
        : ' TÂCHE : corrige le code de l\'élève pour qu\'il atteigne l\'objectif de la leçon. Réponds en JSON {explanation, fixed_code} : explanation = 2 à 4 phrases simples sur ce qui n\'allait pas ; fixed_code = le code corrigé complet, en changeant le moins possible.')
    : ''
  // Mode socratique : l'agent guide par des questions et ne donne jamais la réponse ni le code complet.
  const socratique = body.style === 'socratique' && !fixMode
  if (socratique) {
    system += lang === 'en'
      ? ' SOCRATIC MODE: never give the answer or the corrected code. Ask one or two short guiding questions, point to the line or idea to examine, and let the learner find it.'
      : ' MODE SOCRATIQUE : ne donne jamais la réponse ni le code corrigé. Pose une ou deux questions courtes qui guident, indique la ligne ou l\'idée à examiner, et laisse l\'élève trouver.'
  }
  // Pas de LaTeX : la page affiche le texte tel quel, « $x$ » s'y lisait en clair (07/10).
  system += lang === 'en'
    ? ' Write formulas in plain text or in `code`, never LaTeX or $ signs.'
    : ' Écris les formules en texte simple ou entre `backticks`, jamais en LaTeX ni avec des signes $.'
  // Un vrai prof : il écoute d'abord, et il ne force pas une leçon trop avancée sur un débutant.
  const orientable = !fixMode && !entraideId && !espaceId
  if (orientable) {
    const liste = Object.entries(DEPARTS).map(([id, d]) => `${id} = ${d[lang]} (prof : ${NOMS[d.prof]})`).join(' ; ')
    system += lang === 'en'
      ? ` BE A REAL HUMAN TEACHER: warm, you listen first and answer what the learner actually said. If they say they are a beginner, lost, or that this lesson is too advanced, do not push the lesson: reassure them, then either teach the very first idea in 2-3 simple lines, or send them to the starting lesson that fits, naming the teacher who handles it (if it is you, say you will see them there). The other teachers: Maya (JavaScript, beginners welcome), Idris (Python and AI), Finia (everything else). To send them, end your reply with one line on its own: [[ORIENT:id]] with an id from this list: ${liste}. Use that line only when the learner really needs it.`
      : ` SOIS UN VRAI PROF HUMAIN : chaleureux, tu écoutes d'abord et tu réponds à ce que l'élève a vraiment dit. S'il dit qu'il débute, qu'il est perdu ou que la leçon est trop avancée pour lui, ne force pas la leçon : rassure-le, puis soit tu lui apprends la toute première notion en 2 ou 3 lignes simples, soit tu l'envoies vers la leçon de départ qui lui convient, en nommant le prof qui s'en occupe (si c'est toi, dis que tu l'y retrouves). Les autres profs : Maya (JavaScript, accueille les débutants), Idris (Python et IA), Finia (tout le reste). Pour l'envoyer, termine ta réponse par une ligne seule : [[ORIENT:id]] avec un id de cette liste : ${liste}. N'utilise cette ligne que si l'élève en a vraiment besoin.`
  }
  system += fixHint
  const history = Array.isArray(body.history) ? body.history.slice(-MAX_HISTORY) : []
  // Les tours de la conversation, puis la question du moment. La chaîne
  // (_shared/chaine.ts) essaie Gemini gratuit, Groq gratuit, Cloudflare gratuit,
  // puis Gemini payant (Beau, 07/10 : « partout il doit y avoir les chaînes »).
  const tours: Tour[] = [
    ...history
      .filter((h) => h && (h.role === 'user' || h.role === 'model') && typeof h.text === 'string')
      .map((h) => ({ role: h.role as Tour['role'], text: String(h.text).slice(0, MAX_FIELD) })),
    { role: 'user', text: `Leçon : ${lesson}\nCode de l'élève :\n${code}\nRésultat :\n${output}\nQuestion : ${question}` },
  ]
  const rendu = await ecrire({
    system,
    tours,
    maxSortie: fixMode ? 2000 : 600,
    temperature: fixMode ? 0.2 : 0.4,
    schema: fixMode
      ? {
          type: 'OBJECT',
          properties: { explanation: { type: 'STRING' }, fixed_code: { type: 'STRING' } },
          required: ['explanation', 'fixed_code'],
        }
      : undefined,
  })
  if ('erreur' in rendu) return json({ error: 'ai', detail: rendu.essais.map((e) => e.split(' : ')[0]) }, 502)
  // La ligne [[ORIENT:id]] devient un bouton côté page ; elle n'est jamais montrée telle quelle.
  const vise = rendu.texte.match(/\[\[ORIENT(?:ER)?:\s*([a-z0-9-]+)\s*\]\]/i)?.[1]?.toLowerCase()
  const answer = rendu.texte.replace(/\[\[ORIENT(?:ER)?:[^\]]*\]\]/gi, '').trim()
  const orienter = orientable && vise && DEPARTS[vise] ? { lesson: vise, prof: DEPARTS[vise].prof } : undefined
  if (!answer) return json({ error: 'empty_answer' }, 502)
  if (fixMode) {
    // Correction proposée : l'élève la voit en différences et l'accepte ou la refuse côté client.
    try {
      const parsed = lireJson(answer)
      if (!parsed || typeof parsed.fixed_code !== 'string' || typeof parsed.explanation !== 'string') throw new Error('shape')
      return json({ explanation: parsed.explanation.slice(0, 1500), fixed_code: parsed.fixed_code.slice(0, 8000) })
    } catch {
      return json({ error: 'bad_fix' }, 502)
    }
  }
  if (entraideId) {
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const { data: posted } = await admin.rpc('learn_entraide_reponse_agent', { p_question: entraideId, p_agent: ag.id, p_corps: answer })
    if (!posted) return json({ error: 'quota_question' }, 429)
  }
  if (espaceId) {
    // Écriture du message d'agent côté serveur (clé de service lue ici seulement, jamais renvoyée).
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const agentLabel = typeof ag.id === 'string' ? ag.id : clip(custom?.name).slice(0, 60) || 'agent'
    const { data: posted } = await admin.rpc('learn_message_agent', { p_espace: espaceId, p_agent: agentLabel, p_texte: answer })
    if (!posted) return json({ error: 'quota_espace' }, 429)
  }
  return json({ answer, ...(orienter ? { orienter } : {}) })
})
