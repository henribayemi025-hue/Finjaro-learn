import React, { useEffect, useState } from 'react';
import { Volume2, VolumeX, Mic, MicOff, Sparkles, MessageSquare } from 'lucide-react';
import { LeoAgent } from '../types';

interface AgentFaceProps {
  agent: LeoAgent;
  isSpeaking?: boolean;
  isListening?: boolean;
  isThinking?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showControls?: boolean;
  onVoiceToggle?: () => void;
  onChatOpen?: () => void;
}

export const AgentFace: React.FC<AgentFaceProps> = ({
  agent,
  isSpeaking = false,
  isListening = false,
  isThinking = false,
  size = 'md',
  showControls = false,
  onVoiceToggle,
  onChatOpen,
}) => {
  const [mouthOpen, setMouthOpen] = useState(false);
  const [blink, setBlink] = useState(false);

  // Mouth animation when speaking
  useEffect(() => {
    if (!isSpeaking) {
      setMouthOpen(false);
      return;
    }
    const interval = setInterval(() => {
      setMouthOpen((prev) => !prev);
    }, 140);
    return () => clearInterval(interval);
  }, [isSpeaking]);

  // Periodic natural eye blink
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 180);
    }, 3800);
    return () => clearInterval(blinkInterval);
  }, []);

  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-20 h-20',
    lg: 'w-28 h-28',
    xl: 'w-40 h-40',
  };

  const isMaya = agent.avatarType === 'maya' || agent.name.toLowerCase().includes('maya');
  const isIdris = agent.avatarType === 'idris' || agent.name.toLowerCase().includes('idris');

  return (
    <div className="flex flex-col items-center">
      <div className="relative group">
        {/* Glow halo */}
        <div
          className={`absolute -inset-1.5 rounded-full blur-md opacity-75 transition duration-500 ${
            isSpeaking
              ? 'bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-500 animate-pulse'
              : isThinking
              ? 'bg-gradient-to-r from-purple-500 via-indigo-500 to-pink-500 animate-spin'
              : isListening
              ? 'bg-gradient-to-r from-rose-500 to-amber-500 animate-ping opacity-50'
              : isMaya
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 group-hover:opacity-100'
              : 'bg-gradient-to-r from-emerald-500 to-indigo-600 group-hover:opacity-100'
          }`}
        />

        {/* SVG Face Container */}
        <div
          className={`relative ${sizeClasses[size]} rounded-full bg-slate-900 border-2 ${
            isSpeaking
              ? 'border-emerald-400'
              : isThinking
              ? 'border-purple-400'
              : isListening
              ? 'border-rose-400'
              : isMaya
              ? 'border-cyan-400/80'
              : 'border-emerald-400/80'
          } shadow-xl overflow-hidden flex items-center justify-center`}
        >
          {isMaya ? (
            // Maya Face: friendly, energetic, warm web specialist
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <defs>
                <linearGradient id="mayaSkin" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#fed7aa" />
                  <stop offset="100%" stopColor="#fdba74" />
                </linearGradient>
                <linearGradient id="mayaHair" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#431407" />
                  <stop offset="100%" stopColor="#78350f" />
                </linearGradient>
                <linearGradient id="cyberNeon" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
              </defs>

              {/* Background gradient */}
              <circle cx="50" cy="50" r="50" fill="#0f172a" />

              {/* Cyber circuitry lines */}
              <path
                d="M 10 50 Q 25 35 35 48"
                stroke="#06b6d4"
                strokeWidth="1.2"
                strokeOpacity="0.5"
                fill="none"
              />
              <path
                d="M 65 48 Q 75 35 90 50"
                stroke="#06b6d4"
                strokeWidth="1.2"
                strokeOpacity="0.5"
                fill="none"
              />

              {/* Hair back */}
              <path d="M 22 40 C 20 80, 80 80, 78 40 C 78 15, 22 15, 22 40 Z" fill="url(#mayaHair)" />

              {/* Face contour */}
              <ellipse cx="50" cy="54" rx="26" ry="29" fill="url(#mayaSkin)" />

              {/* Cheeks blush */}
              <circle cx="34" cy="59" r="4.5" fill="#f43f5e" fillOpacity="0.25" />
              <circle cx="66" cy="59" r="4.5" fill="#f43f5e" fillOpacity="0.25" />

              {/* Eyes */}
              {blink ? (
                // Closed eyes
                <>
                  <path d="M 33 50 Q 40 54 47 50" stroke="#1e293b" strokeWidth="2.5" fill="none" />
                  <path d="M 53 50 Q 60 54 67 50" stroke="#1e293b" strokeWidth="2.5" fill="none" />
                </>
              ) : (
                // Open eyes with sparkle
                <>
                  <ellipse cx="40" cy="50" rx="4.5" ry="5.5" fill="#1e293b" />
                  <ellipse cx="60" cy="50" rx="4.5" ry="5.5" fill="#1e293b" />
                  <circle cx="41.5" cy="48" r="1.8" fill="#ffffff" />
                  <circle cx="61.5" cy="48" r="1.8" fill="#ffffff" />
                  <circle cx="39" cy="52" r="0.8" fill="#ffffff" />
                  <circle cx="59" cy="52" r="0.8" fill="#ffffff" />
                </>
              )}

              {/* Eyebrows */}
              <path d="M 34 43 Q 40 40 46 43" stroke="#451a03" strokeWidth="2" fill="none" />
              <path d="M 54 43 Q 60 40 66 43" stroke="#451a03" strokeWidth="2" fill="none" />

              {/* Nose */}
              <path d="M 50 52 L 48.5 56 L 51 56" stroke="#ea580c" strokeWidth="1.2" strokeLinecap="round" fill="none" />

              {/* Mouth */}
              {mouthOpen ? (
                // Open smiling mouth when speaking
                <ellipse cx="50" cy="67" rx="6.5" ry="4.5" fill="#be123c" />
              ) : (
                // Gentle smile
                <path
                  d="M 43 65 Q 50 71 57 65"
                  stroke="#be123c"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  fill="none"
                />
              )}

              {/* Hair front / bangs */}
              <path
                d="M 24 35 C 32 20, 68 20, 76 35 C 68 30, 60 34, 50 32 C 40 34, 32 30, 24 35 Z"
                fill="url(#mayaHair)"
              />

              {/* Cyber headset with blue LED */}
              <path d="M 23 45 Q 50 20 77 45" stroke="#334155" strokeWidth="2.5" fill="none" />
              <rect x="19" y="44" width="7" height="12" rx="3.5" fill="#06b6d4" />
              <rect x="74" y="44" width="7" height="12" rx="3.5" fill="#06b6d4" />
              <circle cx="22.5" cy="50" r="1.5" fill="#ffffff" className="animate-pulse" />
            </svg>
          ) : isIdris ? (
            // Idris Face: analytical, focused, futuristic AI & Python mentor
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <defs>
                <linearGradient id="idrisSkin" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#b45309" />
                  <stop offset="100%" stopColor="#78350f" />
                </linearGradient>
                <linearGradient id="idrisGlasses" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>

              {/* Background */}
              <circle cx="50" cy="50" r="50" fill="#090d16" />

              {/* Data grid background */}
              <line x1="20" y1="20" x2="80" y2="20" stroke="#10b981" strokeWidth="0.5" strokeOpacity="0.3" />
              <line x1="20" y1="40" x2="80" y2="40" stroke="#10b981" strokeWidth="0.5" strokeOpacity="0.3" />
              <line x1="20" y1="60" x2="80" y2="60" stroke="#10b981" strokeWidth="0.5" strokeOpacity="0.3" />
              <line x1="20" y1="80" x2="80" y2="80" stroke="#10b981" strokeWidth="0.5" strokeOpacity="0.3" />

              {/* Face contour */}
              <ellipse cx="50" cy="54" rx="27" ry="29" fill="url(#idrisSkin)" />

              {/* Neat short hair */}
              <path d="M 23 42 C 22 20, 78 20, 77 42 C 68 28, 32 28, 23 42 Z" fill="#0f172a" />

              {/* High-tech Glasses frames */}
              <rect
                x="31"
                y="45"
                width="16"
                height="11"
                rx="3"
                fill="#0f172a"
                stroke="url(#idrisGlasses)"
                strokeWidth="1.8"
              />
              <rect
                x="53"
                y="45"
                width="16"
                height="11"
                rx="3"
                fill="#0f172a"
                stroke="url(#idrisGlasses)"
                strokeWidth="1.8"
              />
              <line x1="47" y1="50" x2="53" y2="50" stroke="#10b981" strokeWidth="2" />

              {/* Eyes inside glasses */}
              {blink ? (
                <>
                  <line x1="34" y1="50" x2="44" y2="50" stroke="#10b981" strokeWidth="2" />
                  <line x1="56" y1="50" x2="66" y2="50" stroke="#10b981" strokeWidth="2" />
                </>
              ) : (
                <>
                  <circle cx="39" cy="50" r="3.5" fill="#34d399" />
                  <circle cx="61" cy="50" r="3.5" fill="#34d399" />
                  <circle cx="40" cy="49" r="1.2" fill="#ffffff" />
                  <circle cx="62" cy="49" r="1.2" fill="#ffffff" />
                </>
              )}

              {/* Nose */}
              <path d="M 50 54 L 48 60 L 52 60" stroke="#451a03" strokeWidth="1.5" strokeLinecap="round" fill="none" />

              {/* Beard line */}
              <path
                d="M 33 64 C 40 76, 60 76, 67 64 C 62 72, 38 72, 33 64 Z"
                fill="#0f172a"
                fillOpacity="0.85"
              />

              {/* Mouth */}
              {mouthOpen ? (
                <ellipse cx="50" cy="68" rx="5.5" ry="3.5" fill="#991b1b" />
              ) : (
                <line x1="45" y1="67" x2="55" y2="67" stroke="#991b1b" strokeWidth="2" strokeLinecap="round" />
              )}
            </svg>
          ) : (
            // Custom Leo Agent: futuristic avatar
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-tr from-slate-900 to-indigo-950 p-2">
              <div className="relative">
                <Sparkles className="w-8 h-8 text-indigo-400 animate-pulse" />
                <span className="absolute -bottom-1 -right-1 text-xs font-bold text-amber-300">
                  LÉO
                </span>
              </div>
              <span className="text-[10px] uppercase tracking-wider text-slate-300 font-semibold mt-1">
                {agent.name.slice(0, 8)}
              </span>
            </div>
          )}

          {/* Real-time speaking soundwaves indicator */}
          {isSpeaking && (
            <div className="absolute bottom-1 inset-x-0 flex items-center justify-center gap-0.5 z-10">
              <span className="w-1 h-3 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
              <span className="w-1 h-4 bg-emerald-300 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
              <span className="w-1 h-2 bg-emerald-400 rounded-full animate-bounce"></span>
            </div>
          )}
        </div>

        {/* Status dot */}
        <div
          className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-slate-950 ${
            isSpeaking
              ? 'bg-emerald-400 ring-2 ring-emerald-500/50'
              : isThinking
              ? 'bg-purple-400 ring-2 ring-purple-500/50 animate-pulse'
              : isListening
              ? 'bg-rose-500 ring-2 ring-rose-500/50'
              : 'bg-cyan-500'
          }`}
          title={
            isSpeaking
              ? 'En train de parler'
              : isThinking
              ? 'Réfléchit...'
              : isListening
              ? 'À votre écoute'
              : 'En ligne'
          }
        />
      </div>

      {/* Agent details */}
      <div className="mt-2 text-center">
        <div className="flex items-center justify-center gap-1.5">
          <span className="font-bold text-sm text-slate-100">{agent.name}</span>
          {agent.isCustom && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Agent Perso
            </span>
          )}
        </div>
        <p className="text-xs text-slate-400 line-clamp-1">{agent.role}</p>
      </div>

      {/* Action buttons (voice call, quick chat) */}
      {showControls && (
        <div className="flex items-center gap-1.5 mt-2">
          {onVoiceToggle && (
            <button
              onClick={onVoiceToggle}
              className={`p-1.5 rounded-lg text-xs flex items-center gap-1 border transition ${
                isListening
                  ? 'bg-rose-600 text-white border-rose-500 animate-pulse'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
              title="Parler à l'agent à la voix"
            >
              {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{isListening ? 'Stop' : 'Voix'}</span>
            </button>
          )}

          {onChatOpen && (
            <button
              onClick={onChatOpen}
              className="p-1.5 rounded-lg text-xs flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              title="Poser une question"
            >
              <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Discuter</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
