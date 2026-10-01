import React, { useState } from 'react';
import { 
  Users, 
  Headphones, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  MessageSquare, 
  Send, 
  UserCheck, 
  Sparkles,
  Radio,
  Share2,
  Smile,
  Bot
} from 'lucide-react';
import { Collaborator, ChatMessage } from '../types';

interface CollaborativeLoungeProps {
  collaborators: Collaborator[];
  isVoiceActive: boolean;
  setIsVoiceActive: (active: boolean) => void;
  isSimulatingPeers: boolean;
  setIsSimulatingPeers: (sim: boolean) => void;
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  roomId: string;
  onOpenShareModal: () => void;
}

export const CollaborativeLounge: React.FC<CollaborativeLoungeProps> = ({
  collaborators,
  isVoiceActive,
  setIsVoiceActive,
  isSimulatingPeers,
  setIsSimulatingPeers,
  messages,
  onSendMessage,
  roomId,
  onOpenShareModal,
}) => {
  const [inputText, setInputText] = useState('');
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);

  const handleSend = () => {
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 border-t md:border-t-0 md:border-l border-slate-800/80 overflow-hidden select-text">
      {/* Lounge Header */}
      <div className="h-10 bg-slate-900/90 border-b border-slate-800/80 px-3 flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center gap-2">
          <Users className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-xs font-semibold text-slate-200">
            Salon d'Équipe ({collaborators.length})
          </span>
          <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
            #{roomId}
          </span>
        </div>

        <button
          onClick={onOpenShareModal}
          className="text-slate-400 hover:text-slate-200 p-1 rounded transition cursor-pointer"
          title="Partager le salon"
        >
          <Share2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main content: Voice Area + Peer Presence + Team Chat */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4 font-sans text-xs bg-[#090d14]">
        {/* Voice Lounge Simulation Panel */}
        <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isVoiceActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
              <span className="font-semibold text-slate-200 text-xs">Salon Vocal de l'Équipe</span>
            </div>

            <button
              onClick={() => setIsVoiceActive(!isVoiceActive)}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition cursor-pointer ${
                isVoiceActive
                  ? 'bg-red-950/60 border border-red-800/60 text-red-300 hover:bg-red-900/60'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold'
              }`}
            >
              {isVoiceActive ? 'Quitter le vocal' : 'Rejoindre le vocal'}
            </button>
          </div>

          {/* Voice Members grid */}
          {isVoiceActive && (
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="grid grid-cols-2 gap-2">
                {collaborators.map((c) => (
                  <div
                    key={c.id}
                    className={`p-2 rounded-lg border flex items-center gap-2 transition ${
                      c.isSpeaking
                        ? 'bg-emerald-950/40 border-emerald-500 text-emerald-200 shadow-sm shadow-emerald-500/10'
                        : 'bg-slate-950 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0 relative"
                      style={{ backgroundColor: c.color }}
                    >
                      {c.avatar}
                      {c.isSpeaking && (
                        <span className="absolute -inset-1 rounded-full border-2 border-emerald-400 animate-ping opacity-75"></span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="font-semibold truncate text-[11px]">{c.name}</div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-1">
                        {c.isSpeaking ? (
                          <span className="text-emerald-400 font-medium">Parle...</span>
                        ) : (
                          <span>En ligne</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Local User Audio Controls */}
              <div className="flex items-center justify-between pt-2 px-1 text-slate-400">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsMicMuted(!isMicMuted)}
                    className={`p-1.5 rounded-lg border transition cursor-pointer ${
                      isMicMuted
                        ? 'bg-red-950 border-red-800 text-red-400'
                        : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                    }`}
                    title={isMicMuted ? 'Activer le micro' : 'Couper le micro'}
                  >
                    {isMicMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    onClick={() => setIsDeafened(!isDeafened)}
                    className={`p-1.5 rounded-lg border transition cursor-pointer ${
                      isDeafened
                        ? 'bg-red-950 border-red-800 text-red-400'
                        : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                    }`}
                    title={isDeafened ? 'Activer le son' : 'Couper le son des pairs'}
                  >
                    {isDeafened ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <span className="text-[10px] text-slate-500 font-mono">Audio HD activé</span>
              </div>
            </div>
          )}
        </div>

        {/* Peer Simulation Toggle */}
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-2">
          <div>
            <div className="font-semibold text-slate-200 text-xs">Simuler des collègues en direct</div>
            <div className="text-[11px] text-slate-500">
              Lucas & Elena collaborent, modifient le code et posent des questions.
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={isSimulatingPeers}
              onChange={(e) => setIsSimulatingPeers(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
          </label>
        </div>

        {/* Collaborative Team Chat */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span className="flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
              Discussion de salon
            </span>
            <span className="text-[10px] text-slate-500">{messages.length} messages</span>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`p-2.5 rounded-lg border text-[11px] leading-relaxed ${
                  m.isAi
                    ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-100'
                    : 'bg-slate-900/80 border-slate-800 text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <span>{m.avatar}</span>
                    <span className="font-bold text-slate-300">{m.sender}</span>
                    {m.isAi && (
                      <span className="text-[9px] bg-emerald-900/80 text-emerald-300 px-1 rounded">
                        IA
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500">
                    {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="text-slate-300">{m.text}</div>
              </div>
            ))}
          </div>

          {/* Chat Input */}
          <div className="flex items-center gap-1.5 pt-1">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Écrire à l'équipe..."
              className="flex-1 bg-slate-900 border border-slate-800 text-slate-200 text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-emerald-500"
            />
            <button
              onClick={handleSend}
              disabled={!inputText.trim()}
              className="p-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-slate-950 rounded-lg transition cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
