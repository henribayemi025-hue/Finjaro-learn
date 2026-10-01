import React from 'react';
import { 
  Play, 
  Sparkles, 
  Wand2, 
  Users, 
  Headphones, 
  Share2, 
  BookOpen, 
  Code2, 
  Terminal, 
  Bot, 
  Volume2, 
  VolumeX, 
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { Collaborator } from '../types';

interface HeaderProps {
  currentTab: 'studio' | 'learn' | 'sandbox';
  setCurrentTab: (tab: 'studio' | 'learn' | 'sandbox') => void;
  collaborators: Collaborator[];
  isVoiceActive: boolean;
  setIsVoiceActive: (active: boolean) => void;
  isSimulatingPeers: boolean;
  setIsSimulatingPeers: (sim: boolean) => void;
  onRunCode: () => void;
  isRunning: boolean;
  onAnalyzeCode: () => void;
  isAnalyzing: boolean;
  onFixCode: () => void;
  isFixing: boolean;
  onOpenShareModal: () => void;
  onOpenLearningModal: () => void;
  roomId: string;
  totalXp: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  collaborators,
  isVoiceActive,
  setIsVoiceActive,
  isSimulatingPeers,
  setIsSimulatingPeers,
  onRunCode,
  isRunning,
  onAnalyzeCode,
  isAnalyzing,
  onFixCode,
  isFixing,
  onOpenShareModal,
  onOpenLearningModal,
  roomId,
  totalXp,
}) => {
  return (
    <header className="h-14 bg-slate-950 border-b border-slate-800/80 px-4 flex items-center justify-between select-none z-30 shrink-0">
      {/* Left: Branding & Navigation Mode */}
      <div className="flex items-center gap-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Code2 className="w-5 h-5 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight text-white font-mono">
                CodeCraft<span className="text-emerald-400">.studio</span>
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-1.5 py-0.5 rounded">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Collab & IA
              </span>
            </div>
          </div>
        </div>

        {/* Workspace mode tabs */}
        <div className="hidden md:flex items-center p-0.5 bg-slate-900 border border-slate-800 rounded-lg text-xs">
          <button
            onClick={() => setCurrentTab('studio')}
            className={`flex items-center gap-1.5 px-3 py-1.5 font-medium rounded-md transition-all ${
              currentTab === 'studio'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            Studio Principal
          </button>
          <button
            onClick={() => onOpenLearningModal()}
            className={`flex items-center gap-1.5 px-3 py-1.5 font-medium rounded-md transition-all ${
              currentTab === 'learn'
                ? 'bg-slate-800 text-emerald-400 shadow-sm'
                : 'text-slate-400 hover:text-emerald-300'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Académie & Défis
            <span className="ml-1 text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.2 rounded font-mono">
              {totalXp} XP
            </span>
          </button>
        </div>
      </div>

      {/* Center: Quick Execution & AI actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onRunCode}
          disabled={isRunning}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-slate-950 font-semibold text-xs rounded-lg transition shadow-md shadow-emerald-950/40 cursor-pointer disabled:opacity-50"
          title="Exécuter le code (Ctrl + Enter)"
        >
          {isRunning ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-current" />
          )}
          <span>{isRunning ? 'Exécution...' : 'Exécuter'}</span>
          <span className="hidden sm:inline-block text-[10px] bg-emerald-700/50 px-1 rounded text-slate-900">
            Ctrl+↵
          </span>
        </button>

        <button
          onClick={onAnalyzeCode}
          disabled={isAnalyzing}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-cyan-300 hover:text-cyan-200 font-medium text-xs rounded-lg transition active:scale-95 cursor-pointer disabled:opacity-50"
          title="Analyser le code avec l'IA pour détecter les erreurs et bonnes pratiques"
        >
          <Sparkles className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin text-cyan-400' : 'text-cyan-400'}`} />
          <span className="hidden sm:inline">{isAnalyzing ? 'Analyse...' : 'Diagnostic IA'}</span>
        </button>

        <button
          onClick={onFixCode}
          disabled={isFixing}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-amber-300 hover:text-amber-200 font-medium text-xs rounded-lg transition active:scale-95 cursor-pointer disabled:opacity-50"
          title="Correction automatique intelligente par l'IA"
        >
          <Wand2 className={`w-3.5 h-3.5 ${isFixing ? 'animate-pulse text-amber-400' : 'text-amber-400'}`} />
          <span className="hidden sm:inline">{isFixing ? 'Correction...' : 'Auto-Fix IA'}</span>
        </button>
      </div>

      {/* Right: Collaborative Presence, Voice Lounge, Share */}
      <div className="flex items-center gap-3">
        {/* Collaborators avatars */}
        <div className="flex items-center -space-x-1.5">
          {collaborators.map((c) => (
            <div
              key={c.id}
              className="relative group cursor-pointer"
              title={`${c.name} (${c.role === 'ai' ? 'Assistant IA' : c.role === 'host' ? 'Vous' : 'Collègue'})`}
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 border-slate-950 shadow-sm"
                style={{ backgroundColor: c.color }}
              >
                {c.avatar}
              </div>
              {c.isSpeaking && (
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-slate-950 animate-ping"></span>
              )}
            </div>
          ))}
        </div>

        {/* Voice Lounge Toggle */}
        <button
          onClick={() => setIsVoiceActive(!isVoiceActive)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer ${
            isVoiceActive
              ? 'bg-emerald-950/60 border-emerald-600/70 text-emerald-300 shadow-sm shadow-emerald-900/30'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
          title={isVoiceActive ? 'Quitter le salon vocal' : 'Rejoindre le salon vocal de l’équipe'}
        >
          {isVoiceActive ? (
            <>
              <Headphones className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span className="hidden lg:inline text-[11px]">Vocal actif</span>
            </>
          ) : (
            <>
              <Headphones className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden lg:inline text-[11px]">Salon Vocal</span>
            </>
          )}
        </button>

        {/* Share Room Button */}
        <button
          onClick={onOpenShareModal}
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-medium rounded-lg transition cursor-pointer"
          title="Partager le salon et inviter des amis"
        >
          <Share2 className="w-3.5 h-3.5 text-slate-300" />
          <span className="hidden md:inline">Inviter</span>
        </button>
      </div>
    </header>
  );
};
