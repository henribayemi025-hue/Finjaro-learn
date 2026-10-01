import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '10mb' }));

// Initialise Gemini SDK with mandatory telemetry header
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// Endpoint for agent interactive chat (Maya, Idris, Custom Leo Agent)
app.post('/api/agent/chat', async (req, res) => {
  try {
    const { agent, message, codeContext, lessonContext, history = [] } = req.body;

    if (!ai) {
      return res.status(503).json({
        error: 'Mode IA non disponible côté serveur (clé manquante). Vous pouvez continuer d\'apprendre en mode Sans IA 100% gratuit !',
        fallback: true,
      });
    }

    let systemInstruction = '';
    if (agent === 'maya') {
      systemInstruction = `Tu es Maya, l'agente experte en JavaScript, TypeScript, Frontend et Algorithmique de Léo Academy.
Tu as une personnalité chaleureuse, dynamique, très pédagogue et encourageante.
Tu ne donnes jamais directement la solution complète sans faire réfléchir l'élève. Tu poses des questions guidantes, donnes des analogies claires et des indices progressifs.
Si l'élève partage son code, analyse les erreurs de syntaxe, de logique ou de cas limites avec bienveillance.
Réponds en français fluide, avec du formattage markdown soigné et des extraits de code courts si nécessaire.`;
    } else if (agent === 'idris') {
      systemInstruction = `Tu es Idris, l'agent expert en Intelligence Artificielle, Python, Mathématiques appliquées et Prompt Engineering de Léo Academy.
Tu as une personnalité posée, rigoureuse, méthodique et passionnée par l'état de l'art de l'IA.
Tu expliques les concepts d'apprentissage automatique, de réseaux de neurones, d'embeddings, de RAG et de programmation Python avec une grande clarté.
Tu encourages la curiosité scientifique et la rigueur dans le code.
Réponds en français soigné, avec du formattage markdown clair et des exemples concrets.`;
    } else if (typeof agent === 'object' && agent.name) {
      systemInstruction = `Tu es ${agent.name}, un agent d'apprentissage Léo sur-mesure pour Léo Academy.
Domaine d'expertise : ${agent.expertise || 'Programmation & IA'}.
Personnalité : ${agent.personality || 'Bienveillant, pédagogue et concis'}.
Consignes pédagogiques spécifiques : ${agent.systemPrompt || 'Guide l\'élève pas-à-pas vers la maîtrise.'}
Réponds toujours en français structuré et encourageant.`;
    } else {
      systemInstruction = `Tu es un tuteur pédagogue de Léo Academy, spécialisé en programmation et intelligence artificielle.`;
    }

    // Build context
    let prompt = `Question de l'apprenant : ${message}\n\n`;
    if (lessonContext) {
      prompt += `[Contexte de la leçon en cours] : ${lessonContext}\n`;
    }
    if (codeContext) {
      prompt += `[Code actuellement écrit dans l'éditeur] :\n\`\`\`javascript\n${codeContext}\n\`\`\`\n`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    const reply = response.text || "Désolé, je n'ai pas pu formuler de réponse. N'hésite pas à reformuler !";
    return res.json({ reply });
  } catch (error: any) {
    console.error('Erreur API Agent Gemini:', error);
    return res.status(500).json({
      error: error?.message || "Erreur lors de la communication avec l'agent.",
    });
  }
});

// Endpoint for code review and automated intelligent debugging
app.post('/api/code/review', async (req, res) => {
  try {
    const { code, exerciseTitle, instructions, testsFailed } = req.body;

    if (!ai) {
      return res.status(503).json({
        error: 'Mode IA non disponible côté serveur. Utilisez les indices intégrés.',
      });
    }

    const systemInstruction = `Tu es le système de diagnostic de code de Léo Academy.
L'apprenant a échoué à des tests unitaires ou a demandé une analyse de son code.
Ton rôle :
1. Identifier précisément le bug sans donner la réponse toute cuite si possible.
2. Expliquer POURQUOI l'erreur se produit (ex: type retourné inattendu, boucle infinie, condition inversée).
3. Donner un indice ciblé et guider l'élève vers la correction.
Sois concis (max 3-4 paragraphes), bienveillant et formater en markdown. Réponds en français.`;

    const prompt = `Exercice : "${exerciseTitle}"
Consignes : ${instructions}
Code écrit par l'élève :
\`\`\`javascript
${code}
\`\`\`
Détails des tests en échec :
${JSON.stringify(testsFailed, null, 2)}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.4,
      },
    });

    return res.json({ review: response.text });
  } catch (error: any) {
    console.error('Erreur Code Review:', error);
    return res.status(500).json({ error: error?.message });
  }
});

// Endpoint for Career Studio: tech CV bullets & cover letter generation/optimization
app.post('/api/career/generate', async (req, res) => {
  try {
    const { type, role, skills, experience, projects, targetCompany } = req.body;

    if (!ai) {
      return res.status(503).json({
        error: 'Mode IA indisponible pour la génération personnalisée. Utilisez nos modèles statiques.',
      });
    }

    const systemInstruction = `Tu es un coach carrière expert de la Tech et de l'Intelligence Artificielle en France et à l'international.
Tu aides les développeurs et ingénieurs IA (juniors, reconversions, étudiants) à valoriser leurs compétences concrètes, leurs projets pratiques et leurs cours validés (style CS50/MIT).
Privilégie les verbes d'action, les métriques concrètes, l'alignement avec les besoins réels des recruteurs tech et une syntaxe irréprochable en français.`;

    let prompt = '';
    if (type === 'cv') {
      prompt = `Génère un résumé de profil percutant et des puces d'expériences/projets optimisées pour un CV ciblant le poste de : "${role}".
Compétences clés : ${skills.join(', ')}
Projets et cours validés : ${projects}
Parcours/expérience : ${experience}
Structure la réponse avec :
1. Accroche / Profil professionnel (3-4 lignes percutantes)
2. Compétences organisées par catégories techniques
3. 4 à 6 puces de projets ou réalisations formulées selon la méthode STAR (Action + Outil + Résultat)
4. Conseils pour passer les entretiens techniques.`;
    } else {
      prompt = `Rédige une lettre de motivation captivante et personnalisée pour le poste de "${role}" chez "${targetCompany || 'une entreprise innovante'}".
Compétences : ${skills.join(', ')}
Projets réalisés et apprentissages : ${projects}
Expérience : ${experience}
La lettre doit être moderne, authentique (pas de formules désuètes), axée sur la valeur apportée et la passion du code et de l'IA.`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    return res.json({ result: response.text });
  } catch (error: any) {
    console.error('Erreur Career Studio:', error);
    return res.status(500).json({ error: error?.message });
  }
});

// Setup Vite middleware in dev or serve static files in production
async function startServer() {
  if (!isProduction) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Léo Academy running at http://localhost:${PORT}`);
  });
}

startServer();
