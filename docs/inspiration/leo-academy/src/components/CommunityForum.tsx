import React, { useState } from 'react';
import {
  MessageSquare,
  ThumbsUp,
  Plus,
  CheckCircle2,
  Clock,
  Sparkles,
  Bot,
  Filter,
  Search,
  Code2,
  Send,
  X,
} from 'lucide-react';
import { CommunityPost, TrackId, LeoAgent } from '../types';

interface CommunityForumProps {
  posts: CommunityPost[];
  onAddPost: (post: Omit<CommunityPost, 'id' | 'replies' | 'upvotes' | 'timestamp'>) => void;
  onAddReply: (postId: string, text: string, codeSnippet?: string) => void;
  onUpvotePost: (postId: string) => void;
  isAIMode: boolean;
  agents: LeoAgent[];
}

export const CommunityForum: React.FC<CommunityForumProps> = ({
  posts,
  onAddPost,
  onAddReply,
  onUpvotePost,
  isAIMode,
  agents,
}) => {
  const [selectedPostId, setSelectedPostId] = useState<string | null>(posts[0]?.id || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showNewModal, setShowNewModal] = useState(false);

  // New post form
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<any>('Question de cours');
  const [newContent, setNewContent] = useState('');
  const [newCodeSnippet, setNewCodeSnippet] = useState('');

  // Reply form
  const [replyText, setReplyText] = useState('');
  const [replyCode, setReplyCode] = useState('');
  const [isAskingAgent, setIsAskingAgent] = useState(false);

  const categories = [
    'all',
    'Question de cours',
    'Debug de code',
    'Projet IA',
    'Conseil Carrière',
  ];

  const filteredPosts = posts.filter((p) => {
    const matchesCat = categoryFilter === 'all' || p.category === categoryFilter;
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const selectedPost = posts.find((p) => p.id === selectedPostId);

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    onAddPost({
      author: 'Vous (Membre Actif)',
      authorAvatar: '👨‍💻',
      title: newTitle.trim(),
      category: newCategory,
      trackId: 'programming',
      content: newContent.trim(),
      codeSnippet: newCodeSnippet.trim() || undefined,
      isResolved: false,
    });

    setNewTitle('');
    setNewContent('');
    setNewCodeSnippet('');
    setShowNewModal(false);
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPostId || (!replyText.trim() && !replyCode.trim())) return;

    onAddReply(selectedPostId, replyText.trim(), replyCode.trim() || undefined);
    setReplyText('');
    setReplyCode('');
  };

  const handleAskAgentReply = async (agentName: 'Maya' | 'Idris') => {
    if (!selectedPost) return;
    setIsAskingAgent(true);

    try {
      if (isAIMode) {
        const res = await fetch('/api/agent/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agent: agentName.toLowerCase(),
            message: `Un membre de la communauté a posé cette question : "${selectedPost.title}". Contenu : ${selectedPost.content}. Peux-tu rédiger une réponse d'entraide pédagogique et constructive ?`,
            codeContext: selectedPost.codeSnippet,
          }),
        });
        const data = await res.json();
        if (data.reply) {
          onAddReply(selectedPost.id, data.reply);
        }
      } else {
        // Mode Sans IA
        onAddReply(
          selectedPost.id,
          `[Conseil Pédagogique Communautaire Sans IA] : Pour résoudre ce point, vérifiez les cas limites (valeurs nulles, listes vides) et ajoutez des console.log intermédiaires pour inspecter les variables à chaque étape.`
        );
      }
    } catch (e) {
      // ignore
    } finally {
      setIsAskingAgent(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Banner */}
      <div className="p-6 sm:p-8 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Entraide Active & Peer Learning</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-100">
            Plateforme Communautaire d'Entraide
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Posez vos questions de code, partagez vos projets et recevez l'aide des pairs et des agents Léo.
          </p>
        </div>

        <button
          onClick={() => setShowNewModal(true)}
          className="px-5 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs sm:text-sm shadow-lg transition flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Poser une Question</span>
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par mot-clé (ex: stack, embedding, boucle)..."
            className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-100 outline-none"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition shrink-0 border ${
                categoryFilter === cat
                  ? 'bg-cyan-600 text-white border-cyan-500 shadow-sm'
                  : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-850'
              }`}
            >
              {cat === 'all' ? 'Toutes les discussions' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Post List & Thread Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[550px]">
        {/* Left: Posts Feed */}
        <div className="lg:col-span-5 space-y-3 overflow-y-auto max-h-[650px] pr-1">
          {filteredPosts.map((post) => {
            const isSelected = post.id === selectedPostId;
            return (
              <div
                key={post.id}
                onClick={() => setSelectedPostId(post.id)}
                className={`p-4 rounded-2xl border transition cursor-pointer flex flex-col gap-2 ${
                  isSelected
                    ? 'bg-slate-900 border-cyan-500 shadow-md ring-1 ring-cyan-500/30'
                    : 'bg-slate-950/70 border-slate-800 hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-cyan-400 border border-slate-800 font-bold">
                    {post.category}
                  </span>
                  {post.isResolved && (
                    <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-semibold">
                      <CheckCircle2 className="w-3 h-3" /> Résolu
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-slate-100 text-xs sm:text-sm line-clamp-2">
                  {post.title}
                </h3>
                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                  {post.content}
                </p>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-850">
                  <div className="flex items-center gap-1.5">
                    <span>{post.authorAvatar}</span>
                    <span>{post.author}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="w-3 h-3 text-cyan-400" />
                      {post.upvotes}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />
                      {post.replies.length}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Selected Thread Detail */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col shadow-xl">
          {selectedPost ? (
            <div className="flex flex-col h-full space-y-4">
              {/* Question Header */}
              <div className="pb-4 border-b border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{selectedPost.authorAvatar}</span>
                    <div>
                      <span className="font-bold text-xs text-slate-200">
                        {selectedPost.author}
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        {selectedPost.timestamp}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => onUpvotePost(selectedPost.id)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition"
                  >
                    <ThumbsUp className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{selectedPost.upvotes}</span>
                  </button>
                </div>

                <h2 className="text-lg font-bold text-slate-100">{selectedPost.title}</h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {selectedPost.content}
                </p>

                {selectedPost.codeSnippet && (
                  <div className="rounded-xl bg-slate-950 p-3 border border-slate-800 font-mono text-xs text-cyan-300 overflow-x-auto">
                    <pre>
                      <code>{selectedPost.codeSnippet}</code>
                    </pre>
                  </div>
                )}

                {/* Quick Agent invocation for community */}
                <div className="flex items-center gap-2 pt-2 text-xs">
                  <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Demander l'avis d'un mentor :
                  </span>
                  <button
                    disabled={isAskingAgent}
                    onClick={() => handleAskAgentReply('Maya')}
                    className="px-2.5 py-1 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 font-medium transition flex items-center gap-1"
                  >
                    <Bot className="w-3 h-3" />
                    <span>Réponse de Maya</span>
                  </button>
                  <button
                    disabled={isAskingAgent}
                    onClick={() => handleAskAgentReply('Idris')}
                    className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-medium transition flex items-center gap-1"
                  >
                    <Bot className="w-3 h-3" />
                    <span>Réponse d'Idris</span>
                  </button>
                </div>
              </div>

              {/* Replies Feed */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
                <span className="font-bold text-slate-400 uppercase tracking-wider block text-[11px]">
                  Réponses de la communauté ({selectedPost.replies.length}) :
                </span>

                {selectedPost.replies.map((rep) => (
                  <div
                    key={rep.id}
                    className={`p-3.5 rounded-2xl border ${
                      rep.isAgent
                        ? 'bg-purple-950/30 border-purple-800/40'
                        : 'bg-slate-950/70 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-200">{rep.author}</span>
                        {rep.isAgent && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-semibold uppercase">
                            Mentor Léo
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {rep.timestamp}
                      </span>
                    </div>

                    <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{rep.text}</p>

                    {rep.codeSnippet && (
                      <div className="mt-2 rounded-lg bg-slate-900 p-2.5 border border-slate-800 font-mono text-[11px] text-cyan-200">
                        <pre>
                          <code>{rep.codeSnippet}</code>
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Reply Form */}
              <form onSubmit={handleSendReply} className="pt-3 border-t border-slate-800 space-y-2">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Partager votre solution ou conseil d'entraide..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-2xl px-4 py-2.5 text-xs text-slate-100 outline-none"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={!replyText.trim()}
                    className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs disabled:opacity-40 transition flex items-center gap-1.5"
                  >
                    <span>Répondre</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-500 text-xs">
              Sélectionnez une discussion pour afficher les réponses.
            </div>
          )}
        </div>
      </div>

      {/* Modal: New Question */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="font-bold text-slate-100 text-base">Poser une Question d'Entraide</h3>
              <button
                onClick={() => setShowNewModal(false)}
                className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-3 text-xs sm:text-sm">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Titre précis</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ex: Pourquoi mon test de parenthèses échoue sur '()' ?"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-slate-100 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Catégorie</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-slate-100 outline-none"
                >
                  <option value="Question de cours">Question de cours</option>
                  <option value="Debug de code">Debug de code</option>
                  <option value="Projet IA">Projet IA</option>
                  <option value="Conseil Carrière">Conseil Carrière</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Détail de votre blocage</label>
                <textarea
                  rows={4}
                  required
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Expliquez ce que vous essayez d'accomplir et ce qui ne marche pas..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl p-3 text-slate-100 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Extrait de code (optionnel)
                </label>
                <textarea
                  rows={3}
                  value={newCodeSnippet}
                  onChange={(e) => setNewCodeSnippet(e.target.value)}
                  placeholder="// Collez votre fonction ici..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl p-3 font-mono text-xs text-cyan-200 outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs"
                >
                  Publier la question
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
