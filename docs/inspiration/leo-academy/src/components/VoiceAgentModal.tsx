import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
  Send,
  Sparkles,
  Bot,
  User,
  RotateCcw,
  Zap,
} from 'lucide-react';
import { LeoAgent } from '../types';
import { AgentFace } from './AgentFace';

interface VoiceAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  agent: LeoAgent;
  currentLessonContext?: string;
  currentCodeContext?: string;
  isAIMode: boolean;
  onSwitchAIMode?: (val: boolean) => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: string;
}

export const VoiceAgentModal: React.FC<VoiceAgentModalProps> = ({
  isOpen,
  onClose,
  agent,
  currentLessonContext,
  currentCodeContext,
  isAIMode,
  onSwitchAIMode,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [transcriptPreview, setTranscriptPreview] = useState('');

  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize initial welcome message from the agent
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcome =
        agent.avatarType === 'maya'
          ? "Bonjour ! Je suis Maya, ta mentore JavaScript et logique web. Parle-moi au micro ou écris-moi si tu as une question sur la leçon !"
          : agent.avatarType === 'idris'
          ? "Salutations ! Je suis Idris, spécialisé en IA et Python. Je suis à ton écoute pour explorer les concepts mathématiques et algorithmiques."
          : `Bonjour ! Je suis ${agent.name}, ton agent Léo. Prêt à t'accompagner dans ton apprentissage.`;

      setMessages([
        {
          id: 'welcome',
          sender: 'agent',
          text: welcome,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);

      if (soundEnabled && isAIMode) {
        speakResponse(welcome);
      }
    }
  }, [isOpen, agent.id]);

  // Scroll to bottom on message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  // Setup Web Speech Recognition
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = 'fr-FR';
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            const finalTranscript = event.results[i][0].transcript;
            setInputText(finalTranscript);
            setTranscriptPreview('');
            handleSendMessage(finalTranscript);
            return;
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        setTranscriptPreview(interim);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
        setTranscriptPreview('');
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          // ignore
        }
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert(
        "La reconnaissance vocale native n'est pas supportée sur ce navigateur. Vous pouvez saisir votre message au clavier ci-dessous !"
      );
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      // Stop speech playback if speaking
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      }
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.warn(e);
      }
    }
  };

  const speakResponse = (text: string) => {
    if (!window.speechSynthesis || !soundEnabled) return;

    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*_#`]/g, ''); // strip markdown for cleaner TTS
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'fr-FR';
    utterance.rate = 1.05;

    // Pick best French voice if available
    const voices = window.speechSynthesis.getVoices();
    const frVoice = voices.find(
      (v) =>
        v.lang.startsWith('fr') &&
        (agent.avatarType === 'maya' ? v.name.includes('Female') || v.name.includes('Amelie') || v.name.includes('Hortense') : true)
    );
    if (frVoice) {
      utterance.voice = frVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setTranscriptPreview('');

    // If AI Mode is OFF, give local deterministic reply
    if (!isAIMode) {
      setTimeout(() => {
        const replyText =
          "Mode Sans IA actif : les agents vocaux avec génération libre nécessitent d'activer le mode IA (gratuit pour tester avec le switch ci-dessus). Vous avez toutefois accès complet à tous les cours, indices et tests !";
        const agentMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: 'agent',
          text: replyText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, agentMsg]);
        if (soundEnabled) speakResponse(replyText);
      }, 500);
      return;
    }

    // Call server-side Gemini Agent API
    setIsThinking(true);
    try {
      const res = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent: agent.id,
          message: query,
          lessonContext: currentLessonContext,
          codeContext: currentCodeContext,
        }),
      });

      const data = await res.json();
      const reply = data.reply || data.error || "Désolé, je n'ai pas pu générer de réponse.";

      const agentMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'agent',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, agentMsg]);
      if (soundEnabled) {
        speakResponse(reply);
      }
    } catch (err: any) {
      const errMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'agent',
        text: "Désolé, une erreur réseau est survenue lors de l'appel à l'agent.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsThinking(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[85vh] max-h-[750px]">
        {/* Modal Top Header */}
        <div className="px-5 py-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AgentFace
              agent={agent}
              isSpeaking={isSpeaking}
              isListening={isListening}
              isThinking={isThinking}
              size="sm"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-100 text-base">{agent.name}</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-medium">
                  {agent.role}
                </span>
              </div>
              <p className="text-xs text-slate-400">{agent.specialty}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setSoundEnabled(!soundEnabled);
                if (soundEnabled && window.speechSynthesis) {
                  window.speechSynthesis.cancel();
                  setIsSpeaking(false);
                }
              }}
              className={`p-2 rounded-xl border transition ${
                soundEnabled
                  ? 'bg-slate-800 text-cyan-400 border-slate-700'
                  : 'bg-slate-900 text-slate-500 border-slate-800'
              }`}
              title={soundEnabled ? 'Son activé' : 'Son coupé'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-100 border border-slate-700 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* AI Mode Banner if Off */}
        {!isAIMode && (
          <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 flex items-center justify-between text-xs text-amber-200">
            <span>Le mode Sans IA est actif. L'agent vocal est en mode simulation.</span>
            {onSwitchAIMode && (
              <button
                onClick={() => onSwitchAIMode(true)}
                className="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-semibold text-[11px]"
              >
                Activer l'IA
              </button>
            )}
          </div>
        )}

        {/* Animated Central Avatar Spotlight */}
        <div className="py-6 px-4 bg-gradient-to-b from-slate-950 to-slate-900 flex flex-col items-center justify-center border-b border-slate-800/80">
          <AgentFace
            agent={agent}
            isSpeaking={isSpeaking}
            isListening={isListening}
            isThinking={isThinking}
            size="lg"
          />

          <div className="mt-3 text-center">
            <span
              className={`text-xs px-3 py-1 rounded-full font-medium inline-flex items-center gap-1.5 ${
                isSpeaking
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : isListening
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse'
                  : isThinking
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  : 'bg-slate-800 text-slate-300'
              }`}
            >
              {isSpeaking ? (
                <>
                  <Volume2 className="w-3.5 h-3.5 animate-bounce" />
                  {agent.name} parle...
                </>
              ) : isListening ? (
                <>
                  <Mic className="w-3.5 h-3.5" />
                  À votre écoute (parlez maintenant)...
                </>
              ) : isThinking ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                  {agent.name} réfléchit...
                </>
              ) : (
                'Appuyez sur le micro pour parler'
              )}
            </span>
          </div>

          {/* Realtime voice transcription stream preview */}
          {transcriptPreview && (
            <div className="mt-2 text-xs italic text-cyan-300 bg-cyan-950/40 px-3 py-1 rounded-lg border border-cyan-800/40">
              « {transcriptPreview} »
            </div>
          )}
        </div>

        {/* Chat Feed */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 text-sm">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-3 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.sender === 'agent' && (
                <div className="w-7 h-7 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center shrink-0 mt-1">
                  <Bot className="w-4 h-4 text-cyan-400" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm ${
                  m.sender === 'user'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-none'
                    : 'bg-slate-800/90 text-slate-100 border border-slate-700/80 rounded-bl-none shadow-md'
                }`}
              >
                <p className="leading-relaxed whitespace-pre-wrap">{m.text}</p>
                <span className="block text-[10px] opacity-60 text-right mt-1 font-mono">
                  {m.timestamp}
                </span>
              </div>
              {m.sender === 'user' && (
                <div className="w-7 h-7 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center shrink-0 mt-1">
                  <User className="w-4 h-4 text-blue-400" />
                </div>
              )}
            </div>
          ))}

          {isThinking && (
            <div className="flex gap-3 justify-start">
              <div className="w-7 h-7 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="bg-slate-800/90 text-slate-300 border border-slate-700/80 rounded-2xl rounded-bl-none px-4 py-2 flex items-center gap-1.5 text-xs">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                <span>{agent.name} prépare son explication...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar with Voice Button & Send */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
          {/* Big Voice Button */}
          <button
            onClick={toggleListening}
            className={`p-3 rounded-2xl transition shadow-lg flex items-center justify-center ${
              isListening
                ? 'bg-rose-600 text-white animate-pulse ring-4 ring-rose-500/30'
                : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white'
            }`}
            title={isListening ? 'Arrêter d\'écouter' : 'Parler à la voix'}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder={`Posez une question à ${agent.name} (ou parlez à voix haute)...`}
            className="flex-1 bg-slate-900 border border-slate-800 focus:border-cyan-500 text-slate-100 placeholder-slate-500 text-xs sm:text-sm rounded-2xl px-4 py-3 outline-none transition"
          />

          <button
            onClick={() => handleSendMessage()}
            disabled={!inputText.trim()}
            className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed transition"
            title="Envoyer le message"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
