import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  Sparkles, 
  Wand2, 
  Volume2, 
  VolumeX, 
  MessageSquare, 
  Send, 
  CheckCircle, 
  AlertCircle, 
  AlertTriangle, 
  Info, 
  Check, 
  ArrowRight, 
  HelpCircle, 
  BrainCircuit, 
  Zap,
  Code
} from 'lucide-react';
import { CodeAnalysisResult, CodeIssue, ChatMessage } from '../types';

interface AIAssistantProps {
  analysis: CodeAnalysisResult | null;
  isAnalyzing: boolean;
  onAnalyzeCode: () => void;
  onApplyFix: (newCode: string) => void;
  currentCode: string;
  onAutoFixAll: () => void;
  isFixing: boolean;
  activeErrorExplanation?: any;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({
  analysis,
  isAnalyzing,
  onAnalyzeCode,
  onApplyFix,
  currentCode,
  onAutoFixAll,
  isFixing,
  activeErrorExplanation,
}) => {
  const [activeTab, setActiveTab] = useState<'diagnostic' | 'chat'>('diagnostic');
  const [mode, setMode] = useState<'socratique' | 'direct'>('socratique');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'init-ai',
      sender: 'CodeMentor IA',
      avatar: '🤖',
      text: "Bonjour ! Je suis votre tuteur virtuel et pair-programmer. Je surveille votre code en temps réel pour vous expliquer chaque erreur et vous aider à progresser. Que souhaitez-vous faire ?",
      timestamp: Date.now(),
      isAi: true,
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Auto-switch to diagnostic tab when a new error explanation arrives
  useEffect(() => {
    if (activeErrorExplanation) {
      setActiveTab('diagnostic');
    }
  }, [activeErrorExplanation]);

  // Voice Speech (TTS) using Web Speech API
  const handleToggleVoice = (textToRead: string) => {
    if (!('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.lang = 'fr-FR';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = customPrompt || inputMessage.trim();
    if (!textToSend || isSendingMessage) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'Vous',
      avatar: '👨‍💻',
      text: textToSend,
      timestamp: Date.now(),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    if (!customPrompt) setInputMessage('');
    setIsSendingMessage(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...chatMessages, userMsg],
          currentCode,
        }),
      });

      const data = await res.json();
      const aiReply: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'CodeMentor IA',
        avatar: '🤖',
        text: data.reply || "J'ai bien analysé votre demande.",
        timestamp: Date.now(),
        isAi: true,
      };

      setChatMessages((prev) => [...prev, aiReply]);
    } catch (err) {
      const errorReply: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'CodeMentor IA',
        avatar: '🤖',
        text: "Désolé, une petite erreur est survenue lors de la communication. Réessayez dans un instant.",
        timestamp: Date.now(),
        isAi: true,
      };
      setChatMessages((prev) => [...prev, errorReply]);
    } finally {
      setIsSendingMessage(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 border-l border-slate-800/80 overflow-hidden select-text">
      {/* Top Header */}
      <div className="h-10 bg-slate-900/90 border-b border-slate-800/80 px-3 flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveTab('diagnostic')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition cursor-pointer ${
              activeTab === 'diagnostic'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Diagnostic & Erreurs</span>
            {analysis && analysis.issues.length > 0 && (
              <span className="text-[10px] bg-red-950 text-red-300 border border-red-800/60 px-1.5 rounded-full font-mono">
                {analysis.issues.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition cursor-pointer ${
              activeTab === 'chat'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bot className="w-3.5 h-3.5 text-emerald-400" />
            <span>Mentor & Pair</span>
          </button>
        </div>

        {/* Mode switch (Socratique vs Direct) */}
        <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded border border-slate-800 text-[10px]">
          <button
            onClick={() => setMode('socratique')}
            className={`px-1.5 py-0.5 rounded transition ${
              mode === 'socratique'
                ? 'bg-emerald-950 text-emerald-300 font-medium'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Mode Socratique : Donne des indices et explications sans spoiler la solution"
          >
            Socratique
          </button>
          <button
            onClick={() => setMode('direct')}
            className={`px-1.5 py-0.5 rounded transition ${
              mode === 'direct'
                ? 'bg-cyan-950 text-cyan-300 font-medium'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Mode Direct : Solution complète et directe"
          >
            Direct
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-4 font-sans text-xs bg-[#090d14]">
        {/* TAB 1: DIAGNOSTIC & REAL-TIME ERRORS */}
        {activeTab === 'diagnostic' && (
          <div className="space-y-4">
            {/* Dedicated Runtime Error Focus (if triggered from console) */}
            {activeErrorExplanation && (
              <div className="p-3.5 rounded-xl bg-gradient-to-br from-red-950/40 to-slate-900 border border-red-800/80 shadow-lg shadow-red-950/20">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-red-900/60 flex items-center justify-center text-red-200">
                      <AlertCircle className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-red-200 text-sm">
                      {activeErrorExplanation.title || "Explication de l'Erreur"}
                    </span>
                  </div>

                  {/* Voice Button */}
                  <button
                    onClick={() => handleToggleVoice(`${activeErrorExplanation.title}. ${activeErrorExplanation.whyItHappened}. ${activeErrorExplanation.howToFix}`)}
                    className="p-1.5 bg-red-900/40 hover:bg-red-800/50 text-red-300 rounded-lg transition cursor-pointer"
                    title={isSpeaking ? "Arrêter la lecture vocale" : "Écouter l'explication à voix haute"}
                  >
                    {isSpeaking ? <VolumeX className="w-3.5 h-3.5 animate-pulse" /> : <Volume2 className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="space-y-2 text-slate-300 leading-relaxed text-[12px]">
                  <p className="bg-slate-950/60 p-2.5 rounded-lg border border-red-900/40 text-red-100">
                    <strong className="text-red-300 block mb-1">Pourquoi cette erreur ?</strong>
                    {activeErrorExplanation.whyItHappened}
                  </p>

                  {mode === 'socratique' && activeErrorExplanation.socraticHint && (
                    <div className="bg-emerald-950/40 p-2.5 rounded-lg border border-emerald-800/60 text-emerald-200">
                      <strong className="text-emerald-300 flex items-center gap-1.5 mb-1">
                        <BrainCircuit className="w-3.5 h-3.5" />
                        Piste de réflexion socratique :
                      </strong>
                      <p>{activeErrorExplanation.socraticHint}</p>
                    </div>
                  )}

                  {activeErrorExplanation.analogies && (
                    <p className="text-slate-400 italic bg-slate-900/80 p-2 rounded">
                      💡 <strong>Analogie :</strong> {activeErrorExplanation.analogies}
                    </p>
                  )}

                  {mode === 'direct' && activeErrorExplanation.howToFix && (
                    <div className="mt-2 pt-2 border-t border-red-900/40">
                      <strong className="text-cyan-300 block mb-1">Comment corriger :</strong>
                      <p className="text-slate-300">{activeErrorExplanation.howToFix}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Code Health Overview Card */}
            {analysis ? (
              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-200">Score de Qualité de Code</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className={`text-base font-bold font-mono ${
                      analysis.overallScore >= 80 ? 'text-emerald-400' : analysis.overallScore >= 50 ? 'text-amber-400' : 'text-red-400'
                    }`}>
                      {analysis.overallScore}/100
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      analysis.overallScore >= 80 ? 'bg-emerald-500' : analysis.overallScore >= 50 ? 'bg-amber-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.max(5, analysis.overallScore)}%` }}
                  />
                </div>

                <p className="text-slate-400 text-[11px] leading-relaxed">
                  {analysis.summary}
                </p>

                {analysis.teachingTip && (
                  <div className="p-2.5 bg-emerald-950/30 border border-emerald-800/40 rounded-lg text-emerald-200 text-[11px] flex items-start gap-2">
                    <span className="text-emerald-400 shrink-0 mt-0.5">💡</span>
                    <span><strong>Conseil pédagogique :</strong> {analysis.teachingTip}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center space-y-2">
                <Sparkles className="w-6 h-6 text-cyan-400 mx-auto" />
                <p className="font-medium text-slate-300">Analyse de code prête</p>
                <p className="text-[11px] text-slate-500">
                  L'IA examine vos lignes en temps réel pour détecter les fautes de syntaxe, erreurs de typage et anti-patterns.
                </p>
                <button
                  onClick={onAnalyzeCode}
                  disabled={isAnalyzing}
                  className="mt-2 px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-semibold text-xs rounded-lg transition cursor-pointer"
                >
                  {isAnalyzing ? 'Analyse en cours...' : 'Lancer le diagnostic'}
                </button>
              </div>
            )}

            {/* List of Detected Issues */}
            {analysis && analysis.issues.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-300 text-xs">
                    Observations détectées ({analysis.issues.length})
                  </span>

                  <button
                    onClick={onAutoFixAll}
                    disabled={isFixing}
                    className="flex items-center gap-1 text-[11px] font-medium text-amber-300 hover:text-amber-200 transition cursor-pointer"
                  >
                    <Wand2 className="w-3 h-3" />
                    <span>Tout corriger avec l'IA</span>
                  </button>
                </div>

                <div className="space-y-2.5">
                  {analysis.issues.map((issue, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg border transition-all ${
                        issue.severity === 'error'
                          ? 'bg-red-950/20 border-red-800/60 text-red-200'
                          : issue.severity === 'warning'
                          ? 'bg-amber-950/20 border-amber-800/60 text-amber-200'
                          : 'bg-cyan-950/20 border-cyan-800/60 text-cyan-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                            issue.severity === 'error'
                              ? 'bg-red-900/60 text-red-300'
                              : issue.severity === 'warning'
                              ? 'bg-amber-900/60 text-amber-300'
                              : 'bg-cyan-900/60 text-cyan-300'
                          }`}>
                            Ligne {issue.line}
                          </span>
                          <span className="font-bold text-slate-200">{issue.title}</span>
                        </div>

                        {/* Read issue aloud */}
                        <button
                          onClick={() => handleToggleVoice(`${issue.title}. ${issue.explanation}`)}
                          className="text-slate-400 hover:text-slate-200 cursor-pointer p-1"
                          title="Écouter l'explication"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <p className="text-slate-300 text-[11px] leading-relaxed mb-2">
                        {issue.explanation}
                      </p>

                      {issue.suggestion && (
                        <div className="p-2 bg-slate-950/80 rounded border border-slate-800/80 text-[11px] font-mono text-emerald-300 mb-2 overflow-x-auto whitespace-pre-wrap">
                          <span className="text-slate-500 font-sans block text-[10px]">Suggestion :</span>
                          {issue.suggestion}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PAIR PROGRAMMER CHAT */}
        {activeTab === 'chat' && (
          <div className="flex flex-col h-full min-h-[380px]">
            {/* Quick Prompts */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {[
                "Trouver les bugs cachés",
                "Explique ce code simplement",
                "Générer des tests unitaires",
                "Optimiser en O(n)",
              ].map((p, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(p)}
                  className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-[11px] rounded-md transition cursor-pointer"
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Conversation Flow */}
            <div className="flex-1 space-y-3 overflow-y-auto pr-1">
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 ${msg.isAi ? 'items-start' : 'items-start flex-row-reverse'}`}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 ${
                      msg.isAi ? 'bg-emerald-950 border border-emerald-600/60' : 'bg-cyan-900'
                    }`}
                  >
                    {msg.avatar}
                  </div>

                  <div
                    className={`p-2.5 rounded-xl max-w-[85%] text-[11px] leading-relaxed ${
                      msg.isAi
                        ? 'bg-slate-900 border border-slate-800 text-slate-200'
                        : 'bg-emerald-600 text-slate-950 font-medium'
                    }`}
                  >
                    <div className="font-semibold text-[10px] text-slate-400 mb-1">
                      {msg.sender}
                    </div>
                    <div className="whitespace-pre-wrap">{msg.text}</div>
                  </div>
                </div>
              ))}

              {isSendingMessage && (
                <div className="flex items-center gap-2 text-slate-500 text-xs p-2">
                  <Bot className="w-4 h-4 text-emerald-400 animate-spin" />
                  <span>CodeMentor réfléchit...</span>
                </div>
              )}
            </div>

            {/* Input Bar */}
            <div className="pt-3 border-t border-slate-800/80 flex items-center gap-1.5 mt-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Posez une question sur votre code..."
                className="flex-1 bg-slate-900 border border-slate-800 text-slate-200 text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-emerald-500"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputMessage.trim() || isSendingMessage}
                className="p-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-slate-950 rounded-lg transition cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
