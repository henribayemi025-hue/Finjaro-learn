import React, { useState } from 'react';
import { 
  Terminal, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Trash2, 
  Sparkles, 
  Globe, 
  Clock, 
  Check, 
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { ConsoleEntry, TestResult, Language } from '../types';

interface ConsoleOutputProps {
  logs: ConsoleEntry[];
  testResults: TestResult[];
  activeTab: 'terminal' | 'tests' | 'preview';
  setActiveTab: (tab: 'terminal' | 'tests' | 'preview') => void;
  onClearLogs: () => void;
  executionTimeMs?: number;
  code: string;
  language: Language;
  onAskAiToExplainError: (errorMessage: string) => void;
  hasErrors: boolean;
}

export const ConsoleOutput: React.FC<ConsoleOutputProps> = ({
  logs,
  testResults,
  activeTab,
  setActiveTab,
  onClearLogs,
  executionTimeMs,
  code,
  language,
  onAskAiToExplainError,
  hasErrors,
}) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const passedTestsCount = testResults.filter(t => t.passed).length;
  const totalTestsCount = testResults.length;
  const allTestsPassed = totalTestsCount > 0 && passedTestsCount === totalTestsCount;

  // Find the last error log if any
  const lastErrorLog = logs.slice().reverse().find(l => l.type === 'error');

  return (
    <div className="flex flex-col h-full bg-slate-950 border-t md:border-t-0 md:border-l border-slate-800/80 overflow-hidden select-text">
      {/* Console Tab Bar */}
      <div className="h-10 bg-slate-900/90 border-b border-slate-800/80 px-3 flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveTab('terminal')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition cursor-pointer ${
              activeTab === 'terminal'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            <span>Terminal & Logs</span>
            {logs.length > 0 && (
              <span className="text-[10px] bg-slate-700 text-slate-300 px-1.5 rounded-full font-mono">
                {logs.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('tests')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition cursor-pointer ${
              activeTab === 'tests'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CheckCircle2 className={`w-3.5 h-3.5 ${allTestsPassed ? 'text-emerald-400' : 'text-cyan-400'}`} />
            <span>Tests Unitaires</span>
            {totalTestsCount > 0 && (
              <span className={`text-[10px] px-1.5 rounded-full font-mono ${
                allTestsPassed 
                  ? 'bg-emerald-900/80 text-emerald-300' 
                  : 'bg-slate-700 text-slate-300'
              }`}>
                {passedTestsCount}/{totalTestsCount}
              </span>
            )}
          </button>

          {language === 'html' && (
            <button
              onClick={() => setActiveTab('preview')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition cursor-pointer ${
                activeTab === 'preview'
                  ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span>Aperçu Web</span>
            </button>
          )}
        </div>

        {/* Console Action Bar */}
        <div className="flex items-center gap-2">
          {executionTimeMs !== undefined && (
            <div className="hidden sm:flex items-center gap-1 text-[11px] text-slate-500 font-mono">
              <Clock className="w-3 h-3 text-slate-500" />
              <span>{executionTimeMs} ms</span>
            </div>
          )}

          <button
            onClick={onClearLogs}
            className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition cursor-pointer"
            title="Effacer la console"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-y-auto p-3 font-mono text-xs leading-relaxed space-y-2 bg-[#090d14]">
        {/* TAB 1: TERMINAL & LOGS */}
        {activeTab === 'terminal' && (
          <div className="space-y-2">
            {logs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center py-16 text-slate-500 text-center font-sans">
                <Terminal className="w-8 h-8 text-slate-600 mb-2" />
                <p className="text-xs text-slate-400 font-medium">Terminal prêt pour l'exécution</p>
                <p className="text-[11px] text-slate-500 mt-1 max-w-xs">
                  Cliquez sur "Exécuter" (ou Ctrl+Entrée) pour tester votre code et voir les sorties console.
                </p>
              </div>
            ) : (
              logs.map((log, index) => {
                const isErr = log.type === 'error';
                const isWarn = log.type === 'warn';

                return (
                  <div
                    key={index}
                    className={`p-2.5 rounded-lg border transition-all ${
                      isErr
                        ? 'bg-red-950/30 border-red-800/60 text-red-200'
                        : isWarn
                        ? 'bg-amber-950/30 border-amber-800/60 text-amber-200'
                        : 'bg-slate-900/60 border-slate-800/60 text-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 overflow-x-auto whitespace-pre-wrap break-all">
                        {isErr && <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />}
                        {isWarn && <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />}
                        <span>{log.message}</span>
                      </div>

                      {/* Prompt AI Button directly on Error Logs! */}
                      {isErr && (
                        <button
                          onClick={() => onAskAiToExplainError(log.message)}
                          className="shrink-0 flex items-center gap-1 px-2 py-0.5 bg-red-900/50 hover:bg-red-800/60 border border-red-700/60 text-red-200 rounded text-[11px] font-sans transition cursor-pointer active:scale-95"
                          title="Demander à l'IA d'expliquer pourquoi cette erreur s'est produite"
                        >
                          <Sparkles className="w-3 h-3 text-red-300" />
                          <span>Expliquer l'erreur</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {/* Quick banner if error detected */}
            {lastErrorLog && (
              <div className="mt-3 p-3 bg-gradient-to-r from-red-950/40 to-slate-900 border border-red-800/60 rounded-lg flex items-center justify-between gap-3 font-sans">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-red-900/80 flex items-center justify-center shrink-0">
                    <Sparkles className="w-3.5 h-3.5 text-red-300" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-red-200">Erreur d'exécution détectée</div>
                    <div className="text-[11px] text-red-300/80">L'assistant IA peut vous expliquer le problème et vous guider.</div>
                  </div>
                </div>

                <button
                  onClick={() => onAskAiToExplainError(lastErrorLog.message)}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-md shadow transition cursor-pointer shrink-0"
                >
                  Résoudre avec l'IA
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: UNIT TEST SUITE */}
        {activeTab === 'tests' && (
          <div className="space-y-3 font-sans">
            {totalTestsCount === 0 ? (
              <div className="py-12 text-center text-slate-500">
                <CheckCircle2 className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-400 font-medium">Aucun test unitaire actif</p>
                <p className="text-[11px] text-slate-500 mt-1 max-w-xs mx-auto">
                  Sélectionnez une leçon dans l'onglet "Académie & Défis" pour exécuter des tests automatisés sur votre code.
                </p>
              </div>
            ) : (
              <div>
                {/* Score Header */}
                <div className={`p-3 rounded-lg border mb-3 flex items-center justify-between ${
                  allTestsPassed
                    ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-200'
                    : 'bg-slate-900/90 border-slate-800 text-slate-300'
                }`}>
                  <div className="flex items-center gap-2.5">
                    {allTestsPassed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-cyan-400" />
                    )}
                    <div>
                      <div className="text-xs font-bold">
                        {allTestsPassed ? '🎉 Félicitations ! Tous les tests sont validés' : 'Validation des tests'}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {passedTestsCount} sur {totalTestsCount} test(s) réussi(s)
                      </div>
                    </div>
                  </div>

                  <div className="text-right font-mono font-bold text-sm">
                    {Math.round((passedTestsCount / totalTestsCount) * 100)}%
                  </div>
                </div>

                {/* Individual Test Cases */}
                <div className="space-y-2">
                  {testResults.map((t, idx) => (
                    <div
                      key={t.id || idx}
                      className={`p-3 rounded-lg border transition ${
                        t.passed
                          ? 'bg-emerald-950/20 border-emerald-800/50 text-emerald-100'
                          : 'bg-red-950/20 border-red-800/50 text-red-100'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2">
                          {t.passed ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                          )}
                          <div>
                            <div className="text-xs font-medium">{t.description}</div>
                            {t.error && (
                              <div className="mt-1 font-mono text-[11px] text-red-300 bg-red-950/40 p-1.5 rounded">
                                {t.error}
                              </div>
                            )}
                          </div>
                        </div>

                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                          t.passed ? 'bg-emerald-900/60 text-emerald-300' : 'bg-red-900/60 text-red-300'
                        }`}>
                          {t.passed ? 'RÉUSSI' : 'ÉCHEC'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: WEB / HTML PREVIEW */}
        {activeTab === 'preview' && (
          <div className="h-full flex flex-col">
            <div className="flex-1 bg-white rounded-lg overflow-hidden border border-slate-700 min-h-[300px]">
              <iframe
                title="Preview"
                srcDoc={code}
                sandbox="allow-scripts"
                className="w-full h-full border-0"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
