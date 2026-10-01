import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// Shared Gemini client instance
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// In-memory room storage for collaborative sessions
interface RoomState {
  id: string;
  name: string;
  language: string;
  code: string;
  lastUpdated: number;
  messages: Array<{
    id: string;
    sender: string;
    avatar: string;
    text: string;
    timestamp: number;
    isAi?: boolean;
  }>;
}

const rooms = new Map<string, RoomState>();

// Pre-seed a default collaborative room
rooms.set('demo-collab', {
  id: 'demo-collab',
  name: 'Salon Principal - Apprentissage & Pair Programming',
  language: 'javascript',
  code: `// 👋 Bienvenue sur CodeCraft Studio !
// Vous pouvez coder seul ou inviter des amis en partageant le lien du salon.
// L'IA analyse votre code en temps réel, explique les erreurs et propose des solutions.

function calculateCartTotal(items, discountRate = 0) {
  if (!Array.isArray(items)) {
    throw new TypeError("Les articles doivent être sous forme de tableau");
  }

  // 💡 Calcule le total avec réduction
  const subtotal = items.reduce((acc, item) => {
    return acc + (item.price * item.quantity);
  }, 0);

  const discount = subtotal * (discountRate / 100);
  const total = subtotal - discount;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    discount: Math.round(discount * 100) / 100,
    total: Math.round(total * 100) / 100
  };
}

// Essayons la fonction avec quelques articles :
const cart = [
  { name: "Livre JavaScript", price: 29.99, quantity: 2 },
  { name: "Clavier Mécanique", price: 89.50, quantity: 1 },
  { name: "Café de Dev (Grains)", price: 14.00, quantity: 3 }
];

const result = calculateCartTotal(cart, 10);
console.log("🛒 Résultat du panier avec -10% :", result);
`,
  lastUpdated: Date.now(),
  messages: [
    {
      id: 'msg-1',
      sender: 'CodeMentor IA',
      avatar: '🤖',
      text: 'Bienvenue dans votre salon collaboratif ! Je suis votre tuteur virtuel. Testez votre code avec "Exécuter", ou demandez-moi d\'expliquer n\'importe quelle notion.',
      timestamp: Date.now() - 3600000,
      isAi: true,
    },
    {
      id: 'msg-2',
      sender: 'Lucas (Collègue)',
      avatar: '👨‍💻',
      text: 'Salut l\'équipe ! J\'ai ajouté la fonction calculateCartTotal, regardez si le calcul des arrondis est bon.',
      timestamp: Date.now() - 1800000,
    },
  ],
});

// --- API ROUTES ---

// 1. Analyze code for errors, warnings, improvements & educational tips
app.post('/api/ai/analyze-code', async (req, res) => {
  try {
    const { code, language = 'javascript', context = '' } = req.body;
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Code is required' });
    }

    const ai = getGeminiClient();
    if (!ai) {
      // Fallback heuristic analysis if no API key is set
      const lines = code.split('\n');
      const issues: any[] = [];
      
      lines.forEach((line, index) => {
        if (line.includes('var ')) {
          issues.push({
            line: index + 1,
            severity: 'warning',
            title: "Utilisation déconseillée de 'var'",
            explanation: "En JavaScript moderne, préférez 'const' ou 'let' pour éviter les fuites de portée (hoisting imprévu).",
            suggestion: line.replace('var ', 'const '),
          });
        }
        if (line.includes('== ') && !line.includes('=== ')) {
          issues.push({
            line: index + 1,
            severity: 'info',
            title: "Comparaison non stricte (==)",
            explanation: "L'opérateur '==' effectue une coercition de type imprévisible. Utilisez '==='.",
            suggestion: line.replace('== ', '=== '),
          });
        }
      });

      return res.json({
        hasErrors: issues.some((i) => i.severity === 'error'),
        summary: issues.length > 0 
          ? `${issues.length} observation(s) détectée(s) dans votre code.` 
          : "Le code est syntaxiquement propre et bien structuré !",
        issues,
        overallScore: Math.max(70, 100 - issues.length * 10),
        teachingTip: "Privilégiez les fonctions pures et l'immutabilité pour faciliter les tests.",
      });
    }

    const prompt = `Tu es un expert senior en programmation et un pédagogue d'élite pour développeurs francophones.
Analyse le code suivant écrit en ${language}.
Identifie :
1. Les erreurs de syntaxe, d'exécution ou logiques potentielles.
2. Les mauvaises pratiques ou anti-patterns.
3. Les optimisations possibles (performance, lisibilité, maintenabilité).
4. Explique clairement en français pour un apprenant, avec pédagogie et bienveillance.

Contexte additionnel : ${context || 'Code de travail ou exercice'}

Code à analyser :
\`\`\`${language}
${code}
\`\`\`
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            hasErrors: { type: Type.BOOLEAN },
            summary: { type: Type.STRING },
            overallScore: { type: Type.INTEGER, description: 'Note de 0 à 100' },
            teachingTip: { type: Type.STRING, description: 'Conseil pédagogique clé' },
            issues: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  line: { type: Type.INTEGER },
                  severity: { type: Type.STRING, enum: ['error', 'warning', 'info'] },
                  title: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                  suggestion: { type: Type.STRING },
                  fixedSnippet: { type: Type.STRING },
                },
                required: ['line', 'severity', 'title', 'explanation', 'suggestion'],
              },
            },
          },
          required: ['hasErrors', 'summary', 'overallScore', 'teachingTip', 'issues'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error analyzing code:', error);
    return res.status(500).json({
      error: 'Erreur lors de l’analyse du code par l’IA',
      details: error?.message || 'Erreur inconnue',
    });
  }
});

// 2. Deep explanation of an error or concept in French (Socratic or Direct)
app.post('/api/ai/explain-error', async (req, res) => {
  try {
    const { code, errorMessage, language = 'javascript', mode = 'socratique', level = 'debutant' } = req.body;
    
    const ai = getGeminiClient();
    if (!ai) {
      return res.json({
        title: "Explication de l'erreur",
        concept: "Gestion d'erreur standard",
        whyItHappened: `L'interpréteur a rencontré l'erreur : "${errorMessage}". Cela arrive souvent lors d'un accès à une variable indéfinie ou d'une faute de syntaxe.`,
        socraticHint: "Regardez la ligne indiquée et vérifiez si toutes les variables appelées existent et ont la valeur attendue.",
        analogies: "C'est comme essayer d'ouvrir un tiroir dans une armoire qui n'a pas encore été montée.",
        howToFix: "Assurez-vous d'initialiser vos objets avant d'accéder à leurs propriétés.",
        recommendedCode: code,
      });
    }

    const prompt = `Tu es CodeMentor, un tuteur IA bienveillant et expert en informatique.
Un apprenant (niveau: ${level}) rencontre une erreur ou souhaite comprendre un passage de son code ${language}.

Mode pédagogique : ${mode === 'socratique' ? 'Socratique (pose des questions directrices, donne des indices pour qu’il trouve par lui-même, explique le modèle mental)' : 'Direct & Complet (explique la cause exacte et donne la solution pas à pas)'}.

Message d'erreur / Problème :
"${errorMessage || 'Erreur d’exécution détectée'}"

Code :
\`\`\`${language}
${code}
\`\`\`

Fournis une réponse structurée en français impeccable.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            concept: { type: Type.STRING },
            whyItHappened: { type: Type.STRING },
            socraticHint: { type: Type.STRING },
            analogies: { type: Type.STRING },
            howToFix: { type: Type.STRING },
            recommendedCode: { type: Type.STRING },
          },
          required: ['title', 'concept', 'whyItHappened', 'socraticHint', 'howToFix'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error explaining code error:', error);
    return res.status(500).json({ error: error?.message || 'Erreur serveur' });
  }
});

// 3. One-click Auto-Fix code
app.post('/api/ai/fix-code', async (req, res) => {
  try {
    const { code, instruction = '', language = 'javascript', errorContext = '' } = req.body;

    const ai = getGeminiClient();
    if (!ai) {
      return res.json({
        fixedCode: code,
        explanation: 'Clé API non configurée. Le code original a été conservé.',
        changes: ['Aucune modification automatique effectuée.'],
      });
    }

    const prompt = `Tu es un assistant de programmation expert.
Tâche : Corriger et améliorer le code suivant en ${language}.
Instruction de l'utilisateur : ${instruction || 'Corrige toutes les erreurs de syntaxe, de logique et applique les bonnes pratiques.'}
${errorContext ? `Erreur signalée : ${errorContext}` : ''}

Code d'origine :
\`\`\`${language}
${code}
\`\`\`

Règles impératives :
1. Fournis le code corrigé COMPLET et fonctionnel dans le champ 'fixedCode'.
2. Explique en français clair ce qui a été corrigé et pourquoi.
3. Énumère les modifications apportées sous forme de liste.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            fixedCode: { type: Type.STRING },
            explanation: { type: Type.STRING },
            changes: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ['fixedCode', 'explanation', 'changes'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error fixing code:', error);
    return res.status(500).json({ error: error?.message || 'Erreur lors de la correction du code' });
  }
});

// 4. Pair Programmer Chat with full code context
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { messages, currentCode, language = 'javascript', roomContext = '' } = req.body;

    const ai = getGeminiClient();
    if (!ai) {
      return res.json({
        reply: "Bonjour ! Je suis CodeMentor IA. Je vois votre code en temps réel. Pour obtenir des conseils interactifs poussés, vérifiez que votre clé GEMINI_API_KEY est configurée.",
      });
    }

    const conversationFormatted = (messages || [])
      .map((m: any) => `${m.sender || (m.isAi ? 'CodeMentor' : 'Utilisateur')}: ${m.text}`)
      .join('\n');

    const prompt = `Tu es CodeMentor, un pair-programmer virtuel et mentor chaleureux, intelligent et très compétent dans une application de codage collaboratif.
Tu travailles en équipe avec l'utilisateur et ses amis.
Tu as accès direct au fichier de code actuel en ${language} :

\`\`\`${language}
${currentCode || '// aucun code'}
\`\`\`

${roomContext ? `Contexte du salon : ${roomContext}` : ''}

Historique récent de la discussion :
${conversationFormatted}

Réponds au dernier message de l'utilisateur avec concision, pertinence, convivialité et expertise technique en français. Si tu proposes du code, utilise des blocs markdown avec le langage adéquat.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    return res.json({
      reply: response.text || "Je suis là pour vous aider à coder !",
    });
  } catch (error: any) {
    console.error('Error in AI chat:', error);
    return res.status(500).json({ error: error?.message || 'Erreur de discussion IA' });
  }
});

// 5. Generate interactive coding challenge on-the-fly
app.post('/api/ai/generate-challenge', async (req, res) => {
  try {
    const { topic = 'JavaScript Arrays', difficulty = 'moyen' } = req.body;

    const ai = getGeminiClient();
    if (!ai) {
      return res.json({
        id: 'challenge-offline',
        title: `Défi ${topic}`,
        difficulty,
        description: `Créez une fonction qui résout le problème lié à ${topic}.`,
        starterCode: `// Défi : ${topic}\nfunction solution(input) {\n  // Votre code ici\n  return input;\n}\n\nconsole.log(solution("test"));`,
        testCases: [
          { input: '"test"', expected: '"test"', description: 'Retourne la valeur' }
        ],
        hint: "Pensez aux cas limites.",
      });
    }

    const prompt = `Génère un défi de programmation interactif en JavaScript sur le thème "${topic}" de niveau "${difficulty}".
Le défi doit comporter :
- Un titre accrocheur
- Une description pédagogique claire du problème
- Des exemples d'entrées / sorties
- Un starterCode complet avec commentaires
- 3 à 4 cas de test automatisés avec la fonction \`test(userCode)\` exécutable en JavaScript.
- Une solution de référence et un indice progressif.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            difficulty: { type: Type.STRING },
            description: { type: Type.STRING },
            starterCode: { type: Type.STRING },
            hint: { type: Type.STRING },
            solution: { type: Type.STRING },
            testCode: {
              type: Type.STRING,
              description: 'Code JavaScript de validation qui lance des assertions et affiche les résultats',
            },
          },
          required: ['title', 'difficulty', 'description', 'starterCode', 'hint', 'testCode'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error generating challenge:', error);
    return res.status(500).json({ error: error?.message || 'Erreur génération défi' });
  }
});

// 6. Collaborative Room Management API
app.get('/api/rooms/:id', (req, res) => {
  const { id } = req.params;
  const room = rooms.get(id);
  if (!room) {
    // Auto-create room if not found
    const newRoom: RoomState = {
      id,
      name: `Salon #${id.slice(0, 6)}`,
      language: 'javascript',
      code: `// Salon collaboratif : ${id}\n// Invitez vos amis avec ce lien !\n\nfunction saluer(nom) {\n  return "Bonjour, " + nom + " ! Prêt(e) à coder ensemble ?";\n}\n\nconsole.log(saluer("Équipe"));`,
      lastUpdated: Date.now(),
      messages: [
        {
          id: `msg-${Date.now()}`,
          sender: 'CodeMentor IA',
          avatar: '🤖',
          text: `Bienvenue dans le salon ${id} ! Vous pouvez coder en direct avec vos collègues et tester votre code ensemble.`,
          timestamp: Date.now(),
          isAi: true,
        },
      ],
    };
    rooms.set(id, newRoom);
    return res.json(newRoom);
  }
  return res.json(room);
});

app.post('/api/rooms/:id/update', (req, res) => {
  const { id } = req.params;
  const { code, language, sender } = req.body;
  
  let room = rooms.get(id);
  if (!room) {
    room = {
      id,
      name: `Salon #${id.slice(0, 6)}`,
      language: language || 'javascript',
      code: code || '',
      lastUpdated: Date.now(),
      messages: [],
    };
    rooms.set(id, room);
  } else {
    if (typeof code === 'string') room.code = code;
    if (language) room.language = language;
    room.lastUpdated = Date.now();
  }

  return res.json({ success: true, lastUpdated: room.lastUpdated });
});

app.post('/api/rooms/:id/messages', (req, res) => {
  const { id } = req.params;
  const { text, sender, avatar = '👤' } = req.body;
  if (!text) return res.status(400).json({ error: 'Message text required' });

  const room = rooms.get(id);
  if (!room) return res.status(404).json({ error: 'Room not found' });

  const newMsg = {
    id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    sender: sender || 'Anonyme',
    avatar,
    text,
    timestamp: Date.now(),
  };

  room.messages.push(newMsg);
  // Keep last 100 messages
  if (room.messages.length > 100) {
    room.messages.shift();
  }

  return res.json({ success: true, message: newMsg });
});

// --- VITE MIDDLEWARE OR STATIC SERVING ---
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 CodeCraft Studio server running on port ${PORT}`);
  });
}

startServer();
