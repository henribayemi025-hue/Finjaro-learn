import React, { useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import { 
  Header 
} from './components/Header';
import { 
  CodeEditor 
} from './components/CodeEditor';
import { 
  ConsoleOutput 
} from './components/ConsoleOutput';
import { 
  AIAssistant 
} from './components/AIAssistant';
import { 
  CollaborativeLounge 
} from './components/CollaborativeLounge';
import { 
  LearningModal 
} from './components/LearningModal';
import { 
  ShareRoomModal 
} from './components/ShareRoomModal';
import { 
  DiffPreviewModal 
} from './components/DiffPreviewModal';

import { 
  Collaborator, 
  ChatMessage, 
  CodeAnalysisResult, 
  CodeIssue, 
  ConsoleEntry, 
  TestResult, 
  Lesson, 
  Language 
} from './types';
import { LESSONS } from './data/lessons';
import { executeUserCode, runLessonTests } from './utils/codeRunner';
import { playSuccessChime, playErrorTone, playBlip } from './utils/audio';
import { Bot, MessageSquare, Sparkles, Users } from 'lucide-react';

const INITIAL_CODE = `// 👋 Bienvenue sur CodeCraft Studio !
// Coder seul ou en équipe avec un tuteur IA en direct.
// Testez votre code avec "Exécuter" (Ctrl + Entrée).

function calculateCartTotal(items, discountRate = 0) {
  if (!Array.isArray(items)) {
    throw new TypeError("Les articles doivent être sous forme de tableau");
  }

  // 💡 Calcule le sous-total avec réduction
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

// Essai avec quelques articles :
const cart = [
  { name: "Livre JavaScript Moderne", price: 29.99, quantity: 2 },
  { name: "Clavier Mécanique", price: 89.50, quantity: 1 },
  { name: "Café de Dev (Grains)", price: 14.00, quantity: 3 }
];

const result = calculateCartTotal(cart, 10);
console.log("🛒 Résultat du panier avec -10% :", result);
`;

export default function App() {
  // Navigation & Mode
  const [currentTab, setCurrentTab] = useState<'studio' | 'learn' | 'sandbox'>('studio');
  
  // Code & Language state
  const [code, setCode] = useState<string>(() => {
    return localStorage.getItem('codecraft_code') || INITIAL_CODE;
  });
  const [language, setLanguage] = useState<Language>('javascript');
  const [fileName, setFileName] = useState<string>('solution.js');
  
  // Learning & Curriculum state
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('codecraft_completed_lessons') || '[]');
    } catch {
      return [];
    }
  });
  const [totalXp, setTotalXp] = useState<number>(() => {
    return parseInt(localStorage.getItem('codecraft_xp') || '120', 10);
  });

  // Modals state
  const [isLearningModalOpen, setIsLearningModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [diffModalData, setDiffModalData] = useState<{
    isOpen: boolean;
    fixedCode: string;
    explanation: string;
    changes: string[];
  }>({
    isOpen: false,
    fixedCode: '',
    explanation: '',
    changes: [],
  });

  // Execution & Diagnostics state
  const [logs, setLogs] = useState<ConsoleEntry[]>([]);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [activeConsoleTab, setActiveConsoleTab] = useState<'terminal' | 'tests' | 'preview'>('terminal');
  const [executionTimeMs, setExecutionTimeMs] = useState<number | undefined>(undefined);
  const [isRunning, setIsRunning] = useState(false);

  // AI Assistant state
  const [analysis, setAnalysis] = useState<CodeAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const [isGeneratingChallenge, setIsGeneratingChallenge] = useState(false);
  const [activeErrorExplanation, setActiveErrorExplanation] = useState<any>(null);

  // Right sidebar view mode ('ai' | 'collab')
  const [rightPanelMode, setRightPanelMode] = useState<'ai' | 'collab'>('ai');

  // Collaboration & Peers
  const [roomId, setRoomId] = useState<string>('demo-collab');
  const [isVoiceActive, setIsVoiceActive] = useState<boolean>(false);
  const [isSimulatingPeers, setIsSimulatingPeers] = useState<boolean>(true);

  const [collaborators, setCollaborators] = useState<Collaborator[]>([
    {
      id: 'user-me',
      name: 'Vous (Hôte)',
      avatar: '👨‍💻',
      color: '#10B981',
      cursorLine: 4,
      role: 'host',
      isSpeaking: false,
    },
    {
      id: 'ai-mentor',
      name: 'CodeMentor IA',
      avatar: '🤖',
      color: '#06B6D4',
      role: 'ai',
      isSpeaking: false,
    },
    {
      id: 'peer-lucas',
      name: 'Lucas B.',
      avatar: '👨‍🦱',
      color: '#F59E0B',
      cursorLine: 8,
      role: 'peer',
      isSpeaking: false,
    },
    {
      id: 'peer-elena',
      name: 'Elena M.',
      avatar: '👩‍💻',
      color: '#EC4899',
      cursorLine: 18,
      role: 'peer',
      isSpeaking: false,
    },
  ]);

  const [roomMessages, setRoomMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      sender: 'CodeMentor IA',
      avatar: '🤖',
      text: "Bienvenue dans le salon collaboratif ! Je surveille votre code pour vous guider pas à pas.",
      timestamp: Date.now() - 3600000,
      isAi: true,
    },
    {
      id: 'm2',
      sender: 'Lucas B.',
      avatar: '👨‍🦱',
      text: "Salut ! Ravi de coder ensemble sur ce projet.",
      timestamp: Date.now() - 1800000,
    },
  ]);

  // Persist code changes
  useEffect(() => {
    localStorage.setItem('codecraft_code', code);
  }, [code]);

  // Read room query param on load
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const roomParam = params.get('room');
      if (roomParam) {
        setRoomId(roomParam);
      }
    }
  }, []);

  // Peer activity simulation loop
  useEffect(() => {
    if (!isSimulatingPeers) return;

    const interval = setInterval(() => {
      // Pick random simulated peer
      const peerIds = ['peer-lucas', 'peer-elena'];
      const targetId = peerIds[Math.floor(Math.random() * peerIds.length)];
      const randomLine = Math.floor(Math.random() * 20) + 1;

      setCollaborators((prev) =>
        prev.map((c) => {
          if (c.id === targetId) {
            const willSpeak = isVoiceActive && Math.random() > 0.6;
            return {
              ...c,
              cursorLine: randomLine,
              isTyping: Math.random() > 0.5,
              isSpeaking: willSpeak,
            };
          }
          return c;
        })
      );
    }, 4000);

    return () => clearInterval(interval);
  }, [isSimulatingPeers, isVoiceActive]);

  // Execute Code in Sandbox
  const handleRunCode = useCallback(() => {
    setIsRunning(true);
    playBlip();

    setTimeout(() => {
      const result = executeUserCode(code);
      setLogs(result.logs);
      setExecutionTimeMs(result.executionTimeMs);

      // If in a lesson, execute lesson unit tests!
      if (currentLesson && currentLesson.testCases.length > 0) {
        const tests = runLessonTests(code, currentLesson.testCases);
        setTestResults(tests);

        const allPassed = tests.length > 0 && tests.every((t) => t.passed);
        if (allPassed) {
          playSuccessChime();
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
          });

          // Mark lesson complete and award XP
          if (!completedLessonIds.includes(currentLesson.id)) {
            const updatedCompleted = [...completedLessonIds, currentLesson.id];
            const updatedXp = totalXp + currentLesson.xp;
            setCompletedLessonIds(updatedCompleted);
            setTotalXp(updatedXp);
            localStorage.setItem('codecraft_completed_lessons', JSON.stringify(updatedCompleted));
            localStorage.setItem('codecraft_xp', String(updatedXp));
          }
        } else if (result.error) {
          playErrorTone();
        }
      } else {
        if (result.error) {
          playErrorTone();
        }
      }

      setIsRunning(false);
    }, 50);
  }, [code, currentLesson, completedLessonIds, totalXp]);

  // Run code on initial mount
  useEffect(() => {
    handleRunCode();
  }, []);

  // AI Real-time Code Analysis
  const handleAnalyzeCode = async () => {
    setIsAnalyzing(true);
    playBlip();

    try {
      const res = await fetch('/api/ai/analyze-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          language,
          context: currentLesson ? `Leçon active: ${currentLesson.title}` : 'Session libre',
        }),
      });

      const data = await res.json();
      setAnalysis(data);
      setRightPanelMode('ai');

      if (data.hasErrors) {
        playErrorTone();
      } else {
        playSuccessChime();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // AI One-Click Auto-Fix
  const handleAutoFix = async () => {
    setIsFixing(true);
    playBlip();

    try {
      const res = await fetch('/api/ai/fix-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          language,
          instruction: 'Corrige toutes les erreurs, optimise le code et respecte les conventions modernes.',
        }),
      });

      const data = await res.json();
      if (data.fixedCode) {
        setDiffModalData({
          isOpen: true,
          fixedCode: data.fixedCode,
          explanation: data.explanation || 'Correction automatique effectuée par l’IA.',
          changes: data.changes || ['Code optimisé et erreurs résolues.'],
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsFixing(false);
    }
  };

  // Ask AI to explain specific runtime error from console
  const handleAskAiToExplainError = async (errorMessage: string) => {
    playBlip();
    setRightPanelMode('ai');

    try {
      const res = await fetch('/api/ai/explain-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          errorMessage,
          language,
          mode: 'socratique',
        }),
      });

      const data = await res.json();
      setActiveErrorExplanation(data);
    } catch (err) {
      console.error(err);
    }
  };

  // Select a lesson from curriculum
  const handleSelectLesson = (lesson: Lesson) => {
    setCurrentLesson(lesson);
    setCode(lesson.starterCode);
    setLanguage(lesson.language);
    setFileName(`${lesson.id}.js`);
    setLogs([]);
    setTestResults([]);
    setActiveConsoleTab('tests');
    setAnalysis(null);
    setActiveErrorExplanation(null);
    playBlip();

    // Send notification in collaborative room
    const notifyMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'CodeMentor IA',
      avatar: '🤖',
      text: `L'équipe démarre le défi : "${lesson.title}". Tests unitaires activés !`,
      timestamp: Date.now(),
      isAi: true,
    };
    setRoomMessages((prev) => [...prev, notifyMsg]);
  };

  // Generate dynamic custom challenge via Gemini
  const handleGenerateCustomChallenge = async (topic: string, difficulty: string) => {
    setIsGeneratingChallenge(true);
    playBlip();

    try {
      const res = await fetch('/api/ai/generate-challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, difficulty }),
      });

      const data = await res.json();
      const customLesson: Lesson = {
        id: `custom-${Date.now()}`,
        trackId: 'custom',
        title: data.title || `Défi : ${topic}`,
        difficulty: (difficulty.charAt(0).toUpperCase() + difficulty.slice(1)) as any,
        language: 'javascript',
        concept: data.description || topic,
        theory: data.hint || "Faites preuve d'ingéniosité algorithmique.",
        instructions: [data.description || 'Résolvez le problème'],
        starterCode: data.starterCode || '// Votre solution\n',
        solutionCode: data.solution || '',
        hints: [data.hint || 'Découpez le problème en sous-étapes'],
        testCases: [
          {
            id: 'ct1',
            description: 'Validation de la fonction solution',
            testFunctionStr: data.testCode || 'return true;',
          },
        ],
        xp: 100,
      };

      handleSelectLesson(customLesson);
      playSuccessChime();
    } catch (err) {
      console.error(err);
      playErrorTone();
    } finally {
      setIsGeneratingChallenge(false);
    }
  };

  // Send message in room chat
  const handleSendRoomMessage = (text: string) => {
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'Vous',
      avatar: '👨‍💻',
      text,
      timestamp: Date.now(),
    };
    setRoomMessages((prev) => [...prev, userMsg]);
    playBlip();

    // Simulate occasional peer or AI mentor reaction
    if (isSimulatingPeers && Math.random() > 0.4) {
      setTimeout(() => {
        const peerResponses = [
          "Super idée, je teste sur ma machine !",
          "Bien vu ! Regarde la ligne 12 aussi.",
          "J'ai lancé les tests unitaires, ça passe presque !",
          "On fait un super duo sur cette fonction.",
        ];
        const randomResp = peerResponses[Math.floor(Math.random() * peerResponses.length)];
        const peerMsg: ChatMessage = {
          id: `msg-${Date.now()}-peer`,
          sender: 'Lucas B.',
          avatar: '👨‍🦱',
          text: randomResp,
          timestamp: Date.now(),
        };
        setRoomMessages((prev) => [...prev, peerMsg]);
      }, 1500);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#070a0f] text-slate-100 overflow-hidden font-sans">
      {/* Top Application Header */}
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        collaborators={collaborators}
        isVoiceActive={isVoiceActive}
        setIsVoiceActive={setIsVoiceActive}
        isSimulatingPeers={isSimulatingPeers}
        setIsSimulatingPeers={setIsSimulatingPeers}
        onRunCode={handleRunCode}
        isRunning={isRunning}
        onAnalyzeCode={handleAnalyzeCode}
        isAnalyzing={isAnalyzing}
        onFixCode={handleAutoFix}
        isFixing={isFixing}
        onOpenShareModal={() => setIsShareModalOpen(true)}
        onOpenLearningModal={() => setIsLearningModalOpen(true)}
        roomId={roomId}
        totalXp={totalXp}
      />

      {/* Main Workspace Layout */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Left Column: Code Editor (50% desktop width) */}
        <div className="w-full md:w-1/2 h-1/2 md:h-full flex flex-col min-w-0">
          <CodeEditor
            code={code}
            onChange={setCode}
            language={language}
            onLanguageChange={setLanguage}
            collaborators={collaborators}
            issues={analysis ? analysis.issues : []}
            onSelectIssue={(issue) => {
              setActiveErrorExplanation({
                title: issue.title,
                whyItHappened: issue.explanation,
                howToFix: issue.suggestion,
              });
              setRightPanelMode('ai');
            }}
            onResetCode={() => {
              if (currentLesson) setCode(currentLesson.starterCode);
              else setCode(INITIAL_CODE);
            }}
            fileName={fileName}
            onRunCode={handleRunCode}
          />
        </div>

        {/* Right Column: Console / Tests (top or bottom split) & AI / Collab Panel */}
        <div className="w-full md:w-1/2 h-1/2 md:h-full flex flex-col min-w-0 bg-slate-950">
          {/* Top Half of Right Column: Live Console, Test Suites, Web Preview */}
          <div className="h-1/2 flex flex-col min-h-0 border-b border-slate-800/80">
            <ConsoleOutput
              logs={logs}
              testResults={testResults}
              activeTab={activeConsoleTab}
              setActiveTab={setActiveConsoleTab}
              onClearLogs={() => setLogs([])}
              executionTimeMs={executionTimeMs}
              code={code}
              language={language}
              onAskAiToExplainError={handleAskAiToExplainError}
              hasErrors={logs.some((l) => l.type === 'error')}
            />
          </div>

          {/* Bottom Half of Right Column: Switchable AI Assistant vs Team Lounge */}
          <div className="h-1/2 flex flex-col min-h-0 relative">
            {/* Panel Selector Bar */}
            <div className="h-9 bg-slate-900 border-b border-slate-800 px-3 flex items-center justify-between shrink-0 select-none">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setRightPanelMode('ai')}
                  className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded transition cursor-pointer ${
                    rightPanelMode === 'ai'
                      ? 'bg-slate-800 text-cyan-300 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Bot className="w-3.5 h-3.5" />
                  <span>CodeMentor IA (Tuteur)</span>
                </button>

                <button
                  onClick={() => setRightPanelMode('collab')}
                  className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded transition cursor-pointer ${
                    rightPanelMode === 'collab'
                      ? 'bg-slate-800 text-emerald-300 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Salon d'Équipe & Vocal</span>
                  {isVoiceActive && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-1" />
                  )}
                </button>
              </div>
            </div>

            {/* Active Sub-panel */}
            <div className="flex-1 overflow-hidden">
              {rightPanelMode === 'ai' ? (
                <AIAssistant
                  analysis={analysis}
                  isAnalyzing={isAnalyzing}
                  onAnalyzeCode={handleAnalyzeCode}
                  onApplyFix={(newCode) => {
                    setCode(newCode);
                    playSuccessChime();
                  }}
                  currentCode={code}
                  onAutoFixAll={handleAutoFix}
                  isFixing={isFixing}
                  activeErrorExplanation={activeErrorExplanation}
                />
              ) : (
                <CollaborativeLounge
                  collaborators={collaborators}
                  isVoiceActive={isVoiceActive}
                  setIsVoiceActive={setIsVoiceActive}
                  isSimulatingPeers={isSimulatingPeers}
                  setIsSimulatingPeers={setIsSimulatingPeers}
                  messages={roomMessages}
                  onSendMessage={handleSendRoomMessage}
                  roomId={roomId}
                  onOpenShareModal={() => setIsShareModalOpen(true)}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Curriculum & Interactive Challenges Modal */}
      <LearningModal
        isOpen={isLearningModalOpen}
        onClose={() => setIsLearningModalOpen(false)}
        onSelectLesson={handleSelectLesson}
        currentLessonId={currentLesson?.id}
        completedLessonIds={completedLessonIds}
        totalXp={totalXp}
        onGenerateCustomChallenge={handleGenerateCustomChallenge}
        isGeneratingChallenge={isGeneratingChallenge}
      />

      {/* Share Room Modal */}
      <ShareRoomModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        roomId={roomId}
      />

      {/* AI Diff Preview Modal */}
      <DiffPreviewModal
        isOpen={diffModalData.isOpen}
        onClose={() => setDiffModalData((prev) => ({ ...prev, isOpen: false }))}
        originalCode={code}
        fixedCode={diffModalData.fixedCode}
        explanation={diffModalData.explanation}
        changes={diffModalData.changes}
        onApply={() => {
          setCode(diffModalData.fixedCode);
          playSuccessChime();
          // Re-run code after applying fix
          setTimeout(() => handleRunCode(), 100);
        }}
      />
    </div>
  );
}
