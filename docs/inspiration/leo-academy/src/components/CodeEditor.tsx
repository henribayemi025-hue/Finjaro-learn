import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Lightbulb,
  HelpCircle,
  Eye,
  Copy,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Terminal,
  AlertCircle,
  BookOpen,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Lesson, LeoAgent } from '../types';

interface CodeEditorProps {
  lesson: Lesson;
  userCode: string;
  onChangeUserCode: (code: string) => void;
  onLessonCompleted: (lessonId: string) => void;
  isAIMode: boolean;
  agent: LeoAgent;
  onAskAgentAboutCode?: (code: string, errorContext?: string) => void;
}

interface TestResult {
  description: string;
  passed: boolean;
  error?: string;
  expected: string;
  actual?: string;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  lesson,
  userCode,
  onChangeUserCode,
  onLessonCompleted,
  isAIMode,
  agent,
  onAskAgentAboutCode,
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
  const [hasRun, setHasRun] = useState(false);
  const [allPassed, setAllPassed] = useState(false);

  // Progressive hints state (Sans IA & Avec IA)
  const [revealedHintIndex, setRevealedHintIndex] = useState<number>(-1);
  const [showSolution, setShowSolution] = useState(false);

  // AI Code review loading
  const [isAiReviewing, setIsAiReviewing] = useState(false);
  const [aiReviewText, setAiReviewText] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Reset hints when lesson changes
  useEffect(() => {
    setTestResults([]);
    setConsoleLogs([]);
    setHasRun(false);
    setAllPassed(false);
    setRevealedHintIndex(-1);
    setShowSolution(false);
    setAiReviewText(null);
  }, [lesson.id]);

  // Handle Tab key in textarea for code indentation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const newCode = userCode.substring(0, start) + '  ' + userCode.substring(end);
      onChangeUserCode(newCode);
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 2;
      }, 0);
    }
    // Shortcut Ctrl+Enter / Cmd+Enter to run
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      runCodeAndTests();
    }
  };

  // Run code safely in a client sandbox and evaluate assertions
  const runCodeAndTests = async () => {
    setIsRunning(true);
    setHasRun(true);
    setAiReviewText(null);

    const logs: string[] = [];
    const customConsole = {
      log: (...args: any[]) => {
        logs.push(
          args
            .map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a)))
            .join(' ')
        );
      },
      warn: (...args: any[]) => {
        logs.push('[WARN] ' + args.map(String).join(' '));
      },
      error: (...args: any[]) => {
        logs.push('[ERR] ' + args.map(String).join(' '));
      },
    };

    const results: TestResult[] = [];
    let passedCount = 0;

    try {
      // Evaluate user code in sandboxed Function wrapper
      const userCodeWrapped = `
        ${userCode}
        return {
          ${
            userCode.includes('genererBadge') ? 'genererBadge,' : ''
          }
          ${
            userCode.includes('calculerTarif') ? 'calculerTarif,' : ''
          }
          ${
            userCode.includes('calculerFactorielle') ? 'calculerFactorielle,' : ''
          }
          ${
            userCode.includes('filtrerEtMultiplier') ? 'filtrerEtMultiplier,' : ''
          }
          ${
            userCode.includes('synthetiserPanier') ? 'synthetiserPanier,' : ''
          }
          ${
            userCode.includes('estParenthesageValide') ? 'estParenthesageValide,' : ''
          }
          ${
            userCode.includes('executerBatchPrompts') ? 'executerBatchPrompts,' : ''
          }
        };
      `;

      // Execute each test case
      for (const tc of lesson.exercise.testCases) {
        try {
          // Build safe evaluation context
          const testRunner = new Function('console', `
            "use strict";
            ${userCode}
            try {
              return (${tc.testFnCode});
            } catch (err) {
              return { __error: err.message };
            }
          `);

          const evalResult = await Promise.resolve(testRunner(customConsole));

          if (evalResult && evalResult.__error) {
            results.push({
              description: tc.description,
              passed: false,
              error: evalResult.__error,
              expected: tc.expected,
            });
          } else if (evalResult === true) {
            results.push({
              description: tc.description,
              passed: true,
              expected: tc.expected,
            });
            passedCount++;
          } else {
            results.push({
              description: tc.description,
              passed: false,
              expected: tc.expected,
              actual: String(evalResult),
            });
          }
        } catch (testErr: any) {
          results.push({
            description: tc.description,
            passed: false,
            error: testErr.message || 'Erreur d\'exécution du test',
            expected: tc.expected,
          });
        }
      }
    } catch (syntaxErr: any) {
      logs.push(`[Erreur de syntaxe] : ${syntaxErr.message}`);
      for (const tc of lesson.exercise.testCases) {
        results.push({
          description: tc.description,
          passed: false,
          error: syntaxErr.message,
          expected: tc.expected,
        });
      }
    }

    setConsoleLogs(logs);
    setTestResults(results);
    const success = passedCount === lesson.exercise.testCases.length && results.length > 0;
    setAllPassed(success);

    if (success) {
      onLessonCompleted(lesson.id);
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#06b6d4', '#3b82f6', '#10b981', '#fbbf24'],
        });
      } catch (e) {
        // ignore if canvas not supported
      }
    }

    setIsRunning(false);
  };

  const handleResetStarter = () => {
    if (confirm('Voulez-vous réinitialiser le code de départ pour cette leçon ?')) {
      onChangeUserCode(lesson.exercise.starterCode);
      setTestResults([]);
      setConsoleLogs([]);
      setHasRun(false);
      setAllPassed(false);
      setAiReviewText(null);
    }
  };

  const handleCopySolution = () => {
    onChangeUserCode(lesson.exercise.solutionCode);
  };

  // Call server-side AI Code Review
  const handleRequestAiReview = async () => {
    setIsAiReviewing(true);
    setAiReviewText(null);
    try {
      const res = await fetch('/api/code/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: userCode,
          exerciseTitle: lesson.title,
          instructions: lesson.exercise.instruction,
          testsFailed: testResults.filter((t) => !t.passed),
        }),
      });
      const data = await res.json();
      if (data.review) {
        setAiReviewText(data.review);
      } else if (data.error) {
        setAiReviewText(`Note de l'agent : ${data.error}`);
      }
    } catch (e: any) {
      setAiReviewText(
        "Impossible de contacter l'agent en ligne actuellement. Utilisez les indices progressifs intégrés ci-dessous !"
      );
    } finally {
      setIsAiReviewing(false);
    }
  };

  const lineCount = userCode.split('\n').length;
  const lineNumbers = Array.from({ length: Math.max(lineCount, 12) }, (_, i) => i + 1);

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
      {/* Editor Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-slate-950/80 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 mr-2">
            <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
          </div>
          <span className="text-xs font-mono font-medium text-slate-300">
            solution.js
          </span>
          <span className="text-[11px] text-slate-500 px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
            Raccourci : Ctrl + Entrée
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetStarter}
            className="px-2.5 py-1.5 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition flex items-center gap-1.5"
            title="Réinitialiser le code de départ"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Réinitialiser</span>
          </button>

          <button
            onClick={runCodeAndTests}
            disabled={isRunning}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg shadow-md transition flex items-center gap-2 ${
              allPassed
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white'
            }`}
          >
            <Play className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
            <span>{isRunning ? 'Évaluation...' : 'Exécuter & Corriger'}</span>
          </button>
        </div>
      </div>

      {/* Editor Content Area (Line numbers + Textarea) */}
      <div className="relative flex-1 flex bg-slate-950 font-mono text-sm overflow-hidden min-h-[300px]">
        {/* Line numbers */}
        <div className="w-12 py-3 bg-slate-950/60 select-none text-right pr-3 text-slate-600 border-r border-slate-800/60 font-mono text-xs leading-6">
          {lineNumbers.map((num) => (
            <div key={num}>{num}</div>
          ))}
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={userCode}
          onChange={(e) => onChangeUserCode(e.target.value)}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          className="flex-1 p-3 bg-transparent text-slate-100 resize-none outline-none font-mono text-xs sm:text-sm leading-6 selection:bg-cyan-500/30 whitespace-pre overflow-auto"
          placeholder="// Écrivez votre code JavaScript ici..."
        />
      </div>

      {/* Test Results & Console Output Drawer */}
      <div className="border-t border-slate-800 bg-slate-950/95 flex flex-col">
        {/* Summary Status Bar */}
        <div className="px-4 py-2.5 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-semibold text-slate-200">
              Résultats de la correction automatique
            </span>
          </div>

          <div className="flex items-center gap-2">
            {hasRun && (
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1 ${
                  allPassed
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}
              >
                {allPassed ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Tous les tests validés ! (+50 XP)
                  </>
                ) : (
                  <>
                    <XCircle className="w-3.5 h-3.5" />
                    {testResults.filter((t) => t.passed).length} / {testResults.length} validés
                  </>
                )}
              </span>
            )}
          </div>
        </div>

        {/* Tests List & Console Logs */}
        <div className="p-4 space-y-3 max-h-56 overflow-y-auto text-xs">
          {!hasRun && (
            <p className="text-slate-500 italic">
              Cliquez sur « Exécuter & Corriger » pour tester votre implémentation automatiquement.
            </p>
          )}

          {/* Test cases badges */}
          {testResults.length > 0 && (
            <div className="space-y-2">
              {testResults.map((t, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-lg border flex flex-col gap-1 ${
                    t.passed
                      ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-200'
                      : 'bg-rose-950/30 border-rose-800/40 text-rose-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-medium">
                      {t.passed ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      )}
                      Test {idx + 1} : {t.description}
                    </span>
                    <span className="text-[10px] uppercase font-mono tracking-wider opacity-75">
                      {t.passed ? 'Succès' : 'Échec'}
                    </span>
                  </div>

                  {!t.passed && (
                    <div className="text-[11px] font-mono pl-5 text-rose-300/90 space-y-0.5">
                      <div>Attendu : <span className="text-emerald-300 font-semibold">{t.expected}</span></div>
                      {t.actual !== undefined && <div>Reçu : <span className="text-amber-300 font-semibold">{t.actual}</span></div>}
                      {t.error && <div>Erreur : <span className="text-rose-400">{t.error}</span></div>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Console logs output */}
          {consoleLogs.length > 0 && (
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-[11px] text-slate-300">
              <span className="text-slate-500 uppercase tracking-wider text-[10px] block mb-1">
                Sortie console standard (console.log) :
              </span>
              {consoleLogs.map((log, i) => (
                <div key={i} className="text-cyan-300">
                  {'>'} {log}
                </div>
              ))}
            </div>
          )}

          {/* AI Code Review diagnosis box */}
          {aiReviewText && (
            <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-800/50 text-purple-200 space-y-2">
              <div className="flex items-center gap-2 font-semibold text-xs text-purple-300">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>Diagnostic de l'agent ({agent.name}) :</span>
              </div>
              <div className="text-xs leading-relaxed whitespace-pre-line text-purple-100">
                {aiReviewText}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions : Hints, Solution, and AI Review */}
        <div className="p-3 bg-slate-900/90 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
          {/* Progressive Hints & Solution buttons (Sans IA & Avec IA) */}
          <div className="flex flex-wrap items-center gap-2">
            {lesson.exercise.hints.map((_, hIdx) => {
              const isRevealed = revealedHintIndex >= hIdx;
              return (
                <button
                  key={hIdx}
                  onClick={() => setRevealedHintIndex(isRevealed ? hIdx - 1 : hIdx)}
                  className={`px-2.5 py-1 text-xs rounded-lg border transition flex items-center gap-1.5 ${
                    isRevealed
                      ? 'bg-amber-500/20 text-amber-200 border-amber-500/40'
                      : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border-slate-700'
                  }`}
                >
                  <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isRevealed ? `Masquer Indice ${hIdx + 1}` : `Indice ${hIdx + 1}`}</span>
                </button>
              );
            })}

            <button
              onClick={() => setShowSolution((prev) => !prev)}
              className={`px-2.5 py-1 text-xs rounded-lg border transition flex items-center gap-1.5 ${
                showSolution
                  ? 'bg-cyan-500/20 text-cyan-200 border-cyan-500/40'
                  : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border-slate-700'
              }`}
            >
              <Eye className="w-3.5 h-3.5 text-cyan-400" />
              <span>{showSolution ? 'Masquer la Solution' : 'Voir la Solution'}</span>
            </button>
          </div>

          {/* AI Helper Button (Only when AI is on) */}
          {isAIMode ? (
            <button
              onClick={handleRequestAiReview}
              disabled={isAiReviewing}
              className="px-3 py-1 text-xs rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium shadow transition flex items-center gap-1.5"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isAiReviewing ? 'animate-spin' : ''}`} />
              <span>{isAiReviewing ? 'Analyse...' : `Aide intelligente de ${agent.name}`}</span>
            </button>
          ) : (
            <div className="text-[11px] text-emerald-400/90 flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
              <CheckCircle2 className="w-3 h-3" />
              <span>Mode Sans IA (0€) : Indices et solutions 100% disponibles</span>
            </div>
          )}
        </div>

        {/* Revealed Hints Accordion */}
        {revealedHintIndex >= 0 && (
          <div className="p-4 bg-amber-950/20 border-t border-amber-900/30 text-amber-100 text-xs space-y-2">
            {lesson.exercise.hints.slice(0, revealedHintIndex + 1).map((hint, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="px-1.5 py-0.5 rounded bg-amber-500/30 font-semibold text-[10px] text-amber-200 shrink-0">
                  Indice {i + 1}
                </span>
                <p className="leading-relaxed text-amber-200/90">{hint}</p>
              </div>
            ))}
          </div>
        )}

        {/* Revealed Official Solution Accordion */}
        {showSolution && (
          <div className="p-4 bg-slate-950 border-t border-cyan-900/50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-cyan-300">
                  Solution Officielle Pédagogique
                </span>
              </div>
              <button
                onClick={handleCopySolution}
                className="px-2.5 py-1 text-xs rounded bg-cyan-600 hover:bg-cyan-500 text-white flex items-center gap-1 transition"
              >
                <Copy className="w-3 h-3" />
                <span>Injecter dans mon éditeur</span>
              </button>
            </div>

            <pre className="p-3 rounded-lg bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto border border-slate-800 leading-relaxed">
              <code>{lesson.exercise.solutionCode}</code>
            </pre>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
              <span className="font-semibold text-cyan-400">Explication détaillée : </span>
              {lesson.exercise.solutionExplanation}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
