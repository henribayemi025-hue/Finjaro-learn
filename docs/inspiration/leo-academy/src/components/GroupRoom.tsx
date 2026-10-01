import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Copy,
  Check,
  Send,
  Code2,
  Sparkles,
  Bot,
  MessageSquare,
  Hash,
  Share2,
  ArrowRight,
} from 'lucide-react';
import { StudyGroup, GroupMessage, LeoAgent } from '../types';

interface GroupRoomProps {
  groups: StudyGroup[];
  activeGroupId: string;
  onSelectGroup: (id: string) => void;
  onCreateGroup: (name: string, topic: string, trackId: any) => void;
  onSendMessage: (groupId: string, text: string, codeSnippet?: string) => void;
  agents: LeoAgent[];
  isAIMode: boolean;
  onInjectCodeToEditor?: (code: string) => void;
}

export const GroupRoom: React.FC<GroupRoomProps> = ({
  groups,
  activeGroupId,
  onSelectGroup,
  onCreateGroup,
  onSendMessage,
  agents,
  isAIMode,
  onInjectCodeToEditor,
}) => {
  const [inputText, setInputText] = useState('');
  const [codeSnippet, setCodeSnippet] = useState('');
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // New Group Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupTopic, setNewGroupTopic] = useState('');

  const currentGroup = groups.find((g) => g.id === activeGroupId) || groups[0];

  const handleCopyInviteLink = () => {
    const inviteUrl = `${window.location.origin}?invite=${currentGroup.code}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() && !codeSnippet.trim()) return;

    onSendMessage(currentGroup.id, inputText, codeSnippet || undefined);
    setInputText('');
    setCodeSnippet('');
    setShowCodeInput(false);
  };

  const handleMentionAgent = (agentName: string) => {
    setInputText((prev) => (prev ? `${prev} @${agentName} ` : `@${agentName} `));
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[780px]">
      {/* Left Sidebar: Groups List */}
      <div className="w-full lg:w-80 bg-slate-900 border border-slate-800 rounded-3xl p-4 flex flex-col shrink-0 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-400" />
            <h2 className="font-bold text-slate-100 text-sm">Salons d'Étude</h2>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="p-1.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 text-xs font-semibold flex items-center gap-1 transition"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Nouveau</span>
          </button>
        </div>

        {/* Groups selection list */}
        <div className="flex-1 overflow-y-auto space-y-2 mt-3 pr-1">
          {groups.map((group) => {
            const isSelected = group.id === currentGroup.id;
            return (
              <button
                key={group.id}
                onClick={() => onSelectGroup(group.id)}
                className={`w-full text-left p-3 rounded-2xl border transition flex flex-col gap-1.5 ${
                  isSelected
                    ? 'bg-slate-800/90 border-cyan-500/50 shadow-md ring-1 ring-cyan-500/30'
                    : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/50 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-100 line-clamp-1">
                    {group.name}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-cyan-400 border border-slate-800">
                    {group.members.length} membres
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-1">{group.topic}</p>
              </button>
            );
          })}
        </div>

        {/* Invite link card */}
        <div className="mt-3 p-3 rounded-2xl bg-slate-950 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <span>Code du salon :</span>
            <span className="font-mono text-cyan-400 font-bold">{currentGroup.code}</span>
          </div>
          <button
            onClick={handleCopyInviteLink}
            className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center justify-center gap-2 transition"
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-300">Lien copié dans le presse-papier !</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Inviter par lien</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Area: Live Study Room & Chat */}
      <div className="flex-1 bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden flex flex-col shadow-2xl">
        {/* Room Header */}
        <div className="px-6 py-4 bg-slate-950/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Hash className="w-4 h-4 text-cyan-400" />
              <h3 className="font-bold text-slate-100 text-base">{currentGroup.name}</h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{currentGroup.topic}</p>
          </div>

          {/* Members Bar */}
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {currentGroup.members.map((m) => (
                <div
                  key={m.id}
                  className="relative w-8 h-8 rounded-full bg-slate-800 border-2 border-slate-950 flex items-center justify-center text-sm shadow"
                  title={`${m.name} (${m.role})`}
                >
                  <span>{m.avatar}</span>
                  {m.isOnline && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-slate-950" />
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={handleCopyInviteLink}
              className="px-3 py-1.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Inviter</span>
            </button>
          </div>
        </div>

        {/* Agent quick mention chip bar */}
        <div className="px-6 py-2.5 bg-slate-950/40 border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-slate-400 flex items-center gap-1 shrink-0 text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Appeler un agent dans le salon :
          </span>
          {agents.map((ag) => (
            <button
              key={ag.id}
              onClick={() => handleMentionAgent(ag.name)}
              className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 shrink-0 transition"
            >
              <Bot className="w-3 h-3 text-cyan-400" />
              <span>@{ag.name}</span>
            </button>
          ))}
        </div>

        {/* Messages Stream */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
          {currentGroup.messages.map((msg) => (
            <div
              key={msg.id}
              className={`p-4 rounded-2xl border ${
                msg.isAgent
                  ? 'bg-purple-950/30 border-purple-800/50 shadow-lg'
                  : 'bg-slate-950/70 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {msg.isAgent ? (
                    <div className="w-6 h-6 rounded-full bg-purple-500/30 border border-purple-400 flex items-center justify-center">
                      <Bot className="w-3.5 h-3.5 text-purple-300" />
                    </div>
                  ) : (
                    <span className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs">
                      💬
                    </span>
                  )}
                  <span
                    className={`font-bold text-xs ${
                      msg.isAgent ? 'text-purple-300' : 'text-slate-200'
                    }`}
                  >
                    {msg.author}
                  </span>
                  {msg.isAgent && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-semibold uppercase">
                      Agent Léo
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-500 font-mono">{msg.timestamp}</span>
              </div>

              <p className="leading-relaxed text-slate-300 whitespace-pre-wrap">{msg.text}</p>

              {/* Code snippet attached in message */}
              {msg.codeSnippet && (
                <div className="mt-3 relative rounded-xl bg-slate-900 border border-slate-800 overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-1.5 bg-slate-950/80 border-b border-slate-800 text-[11px] text-slate-400">
                    <span className="font-mono">Extrait partagé</span>
                    {onInjectCodeToEditor && (
                      <button
                        onClick={() => onInjectCodeToEditor(msg.codeSnippet!)}
                        className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold"
                      >
                        <Code2 className="w-3 h-3" />
                        <span>Tester dans mon éditeur</span>
                      </button>
                    )}
                  </div>
                  <pre className="p-3 text-xs font-mono text-cyan-200 overflow-x-auto leading-relaxed">
                    <code>{msg.codeSnippet}</code>
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="p-4 bg-slate-950 border-t border-slate-800 space-y-2">
          {/* Optional Code Snippet Input Box */}
          {showCodeInput && (
            <div className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="flex items-center justify-between mb-1.5 text-xs text-slate-400">
                <span className="font-mono flex items-center gap-1">
                  <Code2 className="w-3.5 h-3.5 text-cyan-400" />
                  Insérer du code JavaScript / Python :
                </span>
                <button
                  type="button"
                  onClick={() => setShowCodeInput(false)}
                  className="text-slate-500 hover:text-slate-300"
                >
                  Masquer
                </button>
              </div>
              <textarea
                rows={3}
                value={codeSnippet}
                onChange={(e) => setCodeSnippet(e.target.value)}
                placeholder="// Collez votre code ici..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs font-mono text-cyan-200 outline-none focus:border-cyan-500"
              />
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowCodeInput(!showCodeInput)}
              className={`p-3 rounded-2xl border transition ${
                showCodeInput
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                  : 'bg-slate-900 hover:bg-slate-850 text-slate-400 border-slate-800'
              }`}
              title="Ajouter un extrait de code"
            >
              <Code2 className="w-4 h-4" />
            </button>

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Écrivez votre message dans le salon... (Astuce : écrivez @Maya ou @Idris pour les appeler)"
              className="flex-1 bg-slate-900 border border-slate-800 focus:border-cyan-500 text-slate-100 placeholder-slate-500 text-xs sm:text-sm rounded-2xl px-4 py-3 outline-none transition"
            />

            <button
              type="submit"
              disabled={!inputText.trim() && !codeSnippet.trim()}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg transition disabled:opacity-40 flex items-center gap-1.5"
            >
              <span>Envoyer</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>

      {/* Modal: Create new study group */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
            <h3 className="font-bold text-slate-100 text-base mb-1">
              Créer un Salon de Groupe
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Invitez vos pairs et étudiez ensemble avec les agents Léo.
            </p>

            <div className="space-y-3 text-xs sm:text-sm">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Nom du groupe
                </label>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Ex: Groupe d'étude CS50 Paris"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-slate-100 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Sujet d'étude
                </label>
                <input
                  type="text"
                  value={newGroupTopic}
                  onChange={(e) => setNewGroupTopic(e.target.value)}
                  placeholder="Ex: Algorithmes & Prompt Engineering"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-slate-100 outline-none"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  if (newGroupName.trim()) {
                    onCreateGroup(newGroupName.trim(), newGroupTopic.trim(), 'programming');
                    setShowCreateModal(false);
                    setNewGroupName('');
                    setNewGroupTopic('');
                  }
                }}
                disabled={!newGroupName.trim()}
                className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold disabled:opacity-40"
              >
                Créer et Inviter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
