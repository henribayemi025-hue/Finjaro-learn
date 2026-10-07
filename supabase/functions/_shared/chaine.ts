// LA CHAÎNE DE LEARN — Beau, 07/10 : « partout il doit y avoir les chaînes :
// Cloudflare gratuit, Google gratuit, ensuite les modèles augmentent comme
// avec Léo ». Ce jour-là, le prof de Learn ne passait que par la clé Gemini
// payante, à sec : la question de Beau est restée sans réponse (502).
//
// L'ordre, du gratuit au payant, comme dans le moteur de Léo :
//   1. Gemini gratuit (secret GEMINI_API_KEY_GRATUIT), modèles de LEARN_MODELES_GRATUITS ;
//   2. Groq gratuit (secret GROQ_API_KEY, créé par Beau le 07/10 ; commun au
//      projet Supabase) : gpt-oss-120b, Qwen, gpt-oss-20b, 1 000 réponses par
//      jour chacun ;
//   3. l'IA gratuite de Cloudflare par le Worker de finjaro.net, sur la part
//      « learn » du jour (migration 0238 de la place de marché) ;
//   4. Gemini payant (GEMINI_API_KEY), le moteur d'origine de Learn.
// Pas d'autre moteur payant ici : Learn n'a pas de compteur de dépense, en
// ajouter un est une décision de Beau.

import { createClient } from 'npm:@supabase/supabase-js@2'

export type Tour = { role: 'user' | 'model'; text: string }
export type Demande = {
  system: string
  tours: Tour[]
  schema?: unknown // réponse JSON attendue (format Google : OBJECT, STRING…)
  maxSortie: number
  temperature: number
}
export type Reponse = { texte: string; moteur: string } | { erreur: string; essais: string[] }

// Le rapide d'abord : le 07/10, gemini-3.8-flash a laissé Beau attendre 20 s sans
// rien rendre, puis gemini-3.5-flash a répondu en 3 s. Un élève attend une
// réponse courte, pas une réflexion longue.
const GRATUITS = () =>
  (Deno.env.get('LEARN_MODELES_GRATUITS') || 'gemini-3.5-flash,gemini-3.8-flash').split(',').map((m) => m.trim()).filter(Boolean)
const DELAI_GRATUIT_MS = 12_000
const PAYANT = 'gemini-2.5-flash'

async function viaGemini(cle: string, model: string, d: Demande, delaiMs: number): Promise<string> {
  // Les Gemini 3 refusent un budget de réflexion nul (« MINIMAL is not supported »).
  const thinkingConfig = /^gemini-3/.test(model) ? { thinkingLevel: 'low' } : { thinkingBudget: 0 }
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': cle },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: d.system }] },
      contents: d.tours.map((t) => ({ role: t.role, parts: [{ text: t.text }] })),
      generationConfig: {
        maxOutputTokens: d.maxSortie,
        temperature: d.temperature,
        thinkingConfig,
        ...(d.schema ? { responseMimeType: 'application/json', responseSchema: d.schema } : {}),
      },
    }),
    signal: AbortSignal.timeout(delaiMs),
  })
  if (!r.ok) throw new Error(`HTTP ${r.status} ${(await r.text()).slice(0, 160)}`)
  const body = await r.json()
  const txt = (body?.candidates?.[0]?.content?.parts ?? [])
    .filter((p: { thought?: boolean }) => !p.thought)
    .map((p: { text?: string }) => p.text ?? '')
    .join('')
  if (!txt.trim()) throw new Error(`réponse vide (${body?.candidates?.[0]?.finishReason ?? '?'})`)
  return txt
}

const GROQ = () =>
  (Deno.env.get('LEGION_MODELES_GROQ') || 'openai/gpt-oss-120b,qwen/qwen3.8-27b,openai/gpt-oss-20b').split(',').map((m) => m.trim()).filter(Boolean)

async function viaGroq(cle: string, model: string, d: Demande): Promise<string> {
  const consigneJson = d.schema
    ? `\nRéponds UNIQUEMENT par un objet JSON conforme à ce schéma, sans texte autour ni balises de code :\n${JSON.stringify(d.schema)}`
    : ''
  const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cle}` },
    body: JSON.stringify({
      model,
      temperature: d.temperature,
      // Sa limite par minute compte la sortie demandée : bornée.
      max_tokens: Math.min(4096, d.maxSortie + 1024),
      ...(/gpt-oss/.test(model) ? { reasoning_effort: 'low' } : {}),
      ...(d.schema ? { response_format: { type: 'json_object' } } : {}),
      messages: [
        { role: 'system', content: d.system + consigneJson },
        ...d.tours.map((t) => ({ role: t.role === 'model' ? 'assistant' : 'user', content: t.text })),
      ],
    }),
    signal: AbortSignal.timeout(DELAI_GRATUIT_MS),
  })
  if (!r.ok) throw new Error(`HTTP ${r.status} ${(await r.text()).slice(0, 160)}`)
  const body = await r.json()
  const choix = body?.choices?.[0]
  if (choix?.finish_reason === 'length' && d.schema) throw new Error('réponse coupée (trop longue)')
  const txt = String(choix?.message?.content ?? '').trim()
  if (!txt) throw new Error('réponse vide')
  return txt
}

// Coût Cloudflare de gemma-4 en neurones par million de jetons [entrée, sortie],
// le même barème que la place de marché (gratuit-compte.ts).
const GEMMA: [number, number] = [9091, 27273]
const neurones = (entree: number, sortie: number) => Math.ceil((entree * GEMMA[0] + sortie * GEMMA[1]) / 1_000_000)

async function viaCloudflare(d: Demande): Promise<string> {
  if ((Deno.env.get('LEGION_IA_GRATUITE') || '').toLowerCase() === 'non') throw new Error('IA gratuite coupée')
  const url = (Deno.env.get('IA_GRATUITE_URL') || 'https://finjaro.net/ia').replace(/\/$/, '')
  const consigneJson = d.schema
    ? `\nRéponds UNIQUEMENT par un objet JSON conforme à ce schéma, sans texte autour ni balises de code :\n${JSON.stringify(d.schema)}`
    : ''
  const messages = [
    { role: 'system', content: d.system + consigneJson },
    ...d.tours.map((t) => ({ role: t.role === 'model' ? 'assistant' : 'user', content: t.text })),
  ]
  // On réserve le pire cas AVANT d'appeler : sans réservation, pas d'appel,
  // donc jamais de dépassement de la part gratuite (rien n'est facturé).
  const reserve = neurones(Math.ceil(JSON.stringify(messages).length / 2.5), d.maxSortie)
  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } })
  const { data: ok, error } = await sb.rpc('ia_gratuite_reserver_app', { p_neurones: reserve, p_app: 'learn' })
  if (error) throw new Error(`compteur de l'IA gratuite : ${error.message}`)
  if (!ok) throw new Error('part gratuite du jour épuisée pour learn (remise à zéro à minuit UTC)')
  let consomme = reserve
  try {
    const { data: jeton } = await sb.rpc('app_secret', { p_nom: 'ia_gratuite' })
    if (!jeton) {
      consomme = 0
      throw new Error('jeton ia_gratuite illisible')
    }
    const r = await fetch(`${url}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jeton}` },
      body: JSON.stringify({ model: 'gemma-4', max_tokens: d.maxSortie, temperature: d.temperature, messages }),
      signal: AbortSignal.timeout(30_000),
    })
    if (!r.ok) {
      // Refusé avant de tourner : rien n'a été consommé.
      if ([400, 401, 402, 404, 405].includes(r.status)) consomme = 0
      throw new Error(`HTTP ${r.status} ${(await r.text()).slice(0, 160)}`)
    }
    const body = await r.json()
    const u = body?.usage
    if (u && Number.isFinite(Number(u.prompt_tokens)) && Number.isFinite(Number(u.completion_tokens))) {
      consomme = neurones(Number(u.prompt_tokens), Number(u.completion_tokens))
    }
    const choix = body?.choices?.[0]
    if (choix?.finish_reason === 'length' && d.schema) throw new Error('réponse coupée (trop longue)')
    const txt = String(choix?.message?.content ?? '').trim()
    if (!txt) throw new Error('réponse vide')
    return txt
  } finally {
    const rendre = reserve - consomme
    if (rendre > 0) await sb.rpc('ia_gratuite_rendre_app', { p_neurones: rendre, p_app: 'learn' })
    else if (rendre < 0) await sb.rpc('ia_gratuite_inscrire_app', { p_neurones: -rendre, p_app: 'learn' })
  }
}

/** Essaie chaque moteur dans l'ordre et rend le premier qui répond. */
export async function ecrire(d: Demande): Promise<Reponse> {
  const essais: string[] = []
  const note = (m: string, e: unknown) => {
    const msg = `${m} : ${(e as Error)?.message ?? e}`.slice(0, 220)
    essais.push(msg)
    console.error('learn chaîne,', msg)
  }
  const gratuite = Deno.env.get('GEMINI_API_KEY_GRATUIT')
  if (gratuite) {
    for (const m of GRATUITS()) {
      try {
        return { texte: await viaGemini(gratuite, m, d, DELAI_GRATUIT_MS), moteur: `gg:${m}` }
      } catch (e) {
        note(`gg:${m}`, e)
      }
    }
  }
  const groq = Deno.env.get('GROQ_API_KEY')
  if (groq) {
    for (const m of GROQ()) {
      try {
        return { texte: await viaGroq(groq, m, d), moteur: `gq:${m}` }
      } catch (e) {
        note(`gq:${m}`, e)
      }
    }
  }
  try {
    return { texte: await viaCloudflare(d), moteur: 'cf:gemma-4' }
  } catch (e) {
    note('cf:gemma-4', e)
  }
  const payante = Deno.env.get('GEMINI_API_KEY')
  if (payante) {
    try {
      return { texte: await viaGemini(payante, PAYANT, d, 25_000), moteur: PAYANT }
    } catch (e) {
      note(PAYANT, e)
    }
  }
  return { erreur: 'aucune IA disponible', essais }
}

/** Lit un objet JSON même entouré de balises ou de texte (réponses de modèles ouverts). */
export function lireJson(brut: string): Record<string, unknown> | null {
  const net = brut.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim()
  for (const essai of [net, net.slice(net.indexOf('{'), net.lastIndexOf('}') + 1)]) {
    try {
      const o = JSON.parse(essai)
      if (o && typeof o === 'object' && !Array.isArray(o)) return o as Record<string, unknown>
    } catch {
      /* suivant */
    }
  }
  return null
}
