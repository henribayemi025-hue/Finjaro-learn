import React from 'react';
import {
  Code2,
  GraduationCap,
  Users,
  Layers,
  Briefcase,
  Mail,
  MessageSquare,
  Bot,
  Sparkles,
  Zap,
  Mic,
  ShieldCheck,
  Flame,
  Award,
} from 'lucide-react';
import { LeoAgent } from '../types';

export type NavTab =
  | 'editor'
  | 'tracks'
  | 'groups'
  | 'flashcards'
  | 'career'
  | 'newsletter'
  | 'community';

interface NavbarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isAIMode: boolean;
  onToggleAIMode: () => void;
  completedLessonsCount: number;
  totalLessonsCount: number;
  activeAgent: LeoAgent;
  onOpenVoiceModal: () => void;
  onOpenCustomAgentModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  isAIMode,
  onToggleAIMode,
  completedLessonsCount,
  totalLessonsCount,
  activeAgent,
  onOpenVoiceModal,
  onOpenCustomAgentModal,
}) => {
  const xp = completedLessonsCount * 50;

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Top brand & controls bar */}
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onSelectTab('editor')}
              className="flex items-center gap-2.5 text-left group"
            >
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition">
                <Code2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-base sm:text-lg text-white tracking-tight">
                    Léo Academy
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold uppercase tracking-wider">
                    Code & IA
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                  Apprendre à coder & l'IA • Inspiration MIT & Harvard
                </p>
              </div>
            </button>
          </div>

          {/* Right actions: AI Switch, XP, Voice Call Button, Leo Agents */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* AI Toggle Switch (Core requirement: "Avec ou sans IA : un interrupteur. Sans IA, les leçons restent complètes et ne coûtent rien.") */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-inner">
              <div className="flex flex-col text-right hidden sm:block">
                <span className="text-[11px] font-bold text-slate-200">
                  {isAIMode ? 'Mode IA' : 'Mode Sans IA'}
                </span>
                <span
                  className={`text-[9px] font-semibold ${
                    isAIMode ? 'text-cyan-400' : 'text-emerald-400'
                  }`}
                >
                  {isAIMode ? 'Agents actifs' : '0€ • 100% Gratuit'}
                </span>
              </div>

              {/* The Toggle Button */}
              <button
                onClick={onToggleAIMode}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isAIMode ? 'bg-cyan-500' : 'bg-slate-700'
                }`}
                title={
                  isAIMode
                    ? 'Mode IA actif. Cliquez pour basculer en mode Sans IA (0 coût, leçons complètes)'
                    : 'Mode Sans IA actif (0€). Cliquez pour activer les agents IA (Maya & Idris)'
                }
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    isAIMode ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Voice call direct button */}
            <button
              onClick={onOpenVoiceModal}
              className="px-3 py-1.5 rounded-2xl bg-gradient-to-r from-cyan-500/20 to-blue-600/20 hover:from-cyan-500/30 hover:to-blue-600/30 border border-cyan-500/40 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 transition shadow"
              title="Appeler Maya ou Idris à la voix"
            >
              <Mic className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden md:inline">Parler à</span>
              <span className="font-bold">{activeAgent.name}</span>
            </button>

            {/* Custom Leo Agents Connector */}
            <button
              onClick={onOpenCustomAgentModal}
              className="p-2 sm:px-3 sm:py-1.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition"
              title="Brancher ses propres agents Léo"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden lg:inline">Brancher Agent Léo</span>
            </button>

            {/* XP & Progress Badge */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs font-mono">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-amber-300 font-bold">{xp} XP</span>
            </div>
          </div>
        </div>

        {/* Bottom Navigation Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto py-2 border-t border-slate-900/60 no-scrollbar text-xs">
          <button
            onClick={() => onSelectTab('editor')}
            className={`px-3 py-1.5 rounded-xl font-medium transition flex items-center gap-1.5 shrink-0 ${
              currentTab === 'editor'
                ? 'bg-cyan-600 text-white font-bold shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Leçons & Éditeur de Code</span>
          </button>

          <button
            onClick={() => onSelectTab('tracks')}
            className={`px-3 py-1.5 rounded-xl font-medium transition flex items-center gap-1.5 shrink-0 ${
              currentTab === 'tracks'
                ? 'bg-cyan-600 text-white font-bold shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>5 Parcours (Harvard / MIT)</span>
          </button>

          <button
            onClick={() => onSelectTab('groups')}
            className={`px-3 py-1.5 rounded-xl font-medium transition flex items-center gap-1.5 shrink-0 ${
              currentTab === 'groups'
                ? 'bg-cyan-600 text-white font-bold shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Salon de Groupe (@Agent)</span>
          </button>

          <button
            onClick={() => onSelectTab('flashcards')}
            className={`px-3 py-1.5 rounded-xl font-medium transition flex items-center gap-1.5 shrink-0 ${
              currentTab === 'flashcards'
                ? 'bg-cyan-600 text-white font-bold shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Fiches de Révision</span>
          </button>

          <button
            onClick={() => onSelectTab('career')}
            className={`px-3 py-1.5 rounded-xl font-medium transition flex items-center gap-1.5 shrink-0 ${
              currentTab === 'career'
                ? 'bg-cyan-600 text-white font-bold shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>CV & Lettres</span>
          </button>

          <button
            onClick={() => onSelectTab('newsletter')}
            className={`px-3 py-1.5 rounded-xl font-medium transition flex items-center gap-1.5 shrink-0 ${
              currentTab === 'newsletter'
                ? 'bg-cyan-600 text-white font-bold shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Newsletter IA & Quiz</span>
          </button>

          <button
            onClick={() => onSelectTab('community')}
            className={`px-3 py-1.5 rounded-xl font-medium transition flex items-center gap-1.5 shrink-0 ${
              currentTab === 'community'
                ? 'bg-cyan-600 text-white font-bold shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Entraide Communauté</span>
          </button>
        </div>
      </div>
    </header>
  );
};
