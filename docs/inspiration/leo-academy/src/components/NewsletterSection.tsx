import React, { useState } from 'react';
import {
  Mail,
  Sparkles,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  BookOpen,
} from 'lucide-react';
import { NewsletterArticle } from '../types';

interface NewsletterSectionProps {
  articles: NewsletterArticle[];
}

export const NewsletterSection: React.FC<NewsletterSectionProps> = ({ articles }) => {
  const [selectedArticleId, setSelectedArticleId] = useState<string>(articles[0]?.id || '');
  const [emailInput, setEmailInput] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(() => {
    return localStorage.getItem('leo_newsletter_subscribed') === 'true';
  });

  // Quiz state per article
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);

  const currentArticle = articles.find((a) => a.id === selectedArticleId) || articles[0];

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;
    setIsSubscribed(true);
    localStorage.setItem('leo_newsletter_subscribed', 'true');
    setEmailInput('');
  };

  const handleSelectArticle = (id: string) => {
    setSelectedArticleId(id);
    setSelectedOption(null);
    setHasAnswered(false);
  };

  const isCorrect =
    hasAnswered && selectedOption === currentArticle?.quiz.correctIndex;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Top Banner / Inscription */}
      <div className="p-6 sm:p-8 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold">
            <Mail className="w-3.5 h-3.5" />
            <span>Léo Tech & IA Digest • Veille Hebdomadaire</span>
          </div>
          <h2 className="text-2xl font-black text-slate-100">
            Comprendre l'IA sans jargon marketing
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Chaque semaine, recevez une synthèse concise des avancées réelles en modèles
            d'apprentissage, agents autonomes, architectures RAG et pratiques de code propres.
          </p>
        </div>

        {/* Subscription box */}
        <div className="w-full md:w-80 bg-slate-950/80 p-4 rounded-2xl border border-slate-800 shadow">
          {isSubscribed ? (
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold p-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Vous êtes abonné(e) à l'édition hebdomadaire gratuite !</span>
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="space-y-2 text-xs">
              <span className="font-semibold text-slate-300 block">
                S'abonner gratuitement (0 spam) :
              </span>
              <input
                type="email"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="votre.email@exemple.com"
                className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-slate-100 outline-none"
              />
              <button
                type="submit"
                className="w-full py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition shadow"
              >
                Rejoindre les lecteurs
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Main Content : Article Archive & Reader */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Editions list (Left) */}
        <div className="lg:col-span-4 space-y-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block px-1">
            Éditions Récentes :
          </span>
          {articles.map((art) => {
            const isSelected = art.id === currentArticle.id;
            return (
              <button
                key={art.id}
                onClick={() => handleSelectArticle(art.id)}
                className={`w-full text-left p-4 rounded-2xl border transition flex flex-col gap-2 ${
                  isSelected
                    ? 'bg-slate-900 border-cyan-500 shadow-md ring-1 ring-cyan-500/30'
                    : 'bg-slate-950/70 border-slate-800 hover:bg-slate-900/60 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                  <span>Édition #{art.issue}</span>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{art.readTime}</span>
                  </div>
                </div>

                <h3 className="font-bold text-slate-100 text-xs sm:text-sm line-clamp-2">
                  {art.title}
                </h3>
                <p className="text-[11px] text-slate-400 line-clamp-2">{art.summary}</p>
              </button>
            );
          })}
        </div>

        {/* Article Reader & Interactive Quiz (Right) */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
          {/* Header */}
          <div className="pb-4 border-b border-slate-800 space-y-2">
            <div className="flex items-center gap-3 text-xs text-slate-500 font-mono">
              <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold">
                Édition #{currentArticle.issue}
              </span>
              <span>{currentArticle.date}</span>
              <span>• {currentArticle.readTime} de lecture</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-100 leading-snug">
              {currentArticle.title}
            </h1>
          </div>

          {/* Paragraphs */}
          <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
            {currentArticle.content.map((p, idx) => (
              <p key={idx}>{p}</p>
            ))}
          </div>

          {/* Key Insight Highlight */}
          <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-800/40 text-xs text-indigo-200 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-indigo-300">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>À retenir pour les ingénieurs :</span>
            </div>
            <p className="leading-relaxed">{currentArticle.keyInsight}</p>
          </div>

          {/* Mini-Quiz of the Week */}
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-amber-400" />
              <h4 className="font-bold text-slate-200 text-xs sm:text-sm">
                Quiz de l'Édition : Validez votre veille
              </h4>
            </div>

            <p className="text-xs text-slate-300 font-medium">
              {currentArticle.quiz.question}
            </p>

            <div className="space-y-2">
              {currentArticle.quiz.options.map((opt, oIdx) => {
                let btnStyle = 'bg-slate-900 border-slate-800 hover:bg-slate-850 text-slate-300';
                if (hasAnswered) {
                  if (oIdx === currentArticle.quiz.correctIndex) {
                    btnStyle = 'bg-emerald-950/50 border-emerald-500 text-emerald-200';
                  } else if (selectedOption === oIdx) {
                    btnStyle = 'bg-rose-950/50 border-rose-500 text-rose-200';
                  }
                } else if (selectedOption === oIdx) {
                  btnStyle = 'bg-cyan-950/50 border-cyan-500 text-cyan-200';
                }

                return (
                  <button
                    key={oIdx}
                    disabled={hasAnswered}
                    onClick={() => {
                      setSelectedOption(oIdx);
                      setHasAnswered(true);
                    }}
                    className={`w-full text-left p-3 rounded-xl border text-xs transition flex items-center justify-between ${btnStyle}`}
                  >
                    <span>{opt}</span>
                    {hasAnswered && oIdx === currentArticle.quiz.correctIndex && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    )}
                    {hasAnswered &&
                      selectedOption === oIdx &&
                      oIdx !== currentArticle.quiz.correctIndex && (
                        <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      )}
                  </button>
                );
              })}
            </div>

            {hasAnswered && (
              <div
                className={`p-3 rounded-xl text-xs leading-relaxed ${
                  isCorrect
                    ? 'bg-emerald-500/10 text-emerald-200 border border-emerald-500/30'
                    : 'bg-rose-500/10 text-rose-200 border border-rose-500/30'
                }`}
              >
                <span className="font-bold block mb-0.5">
                  {isCorrect ? 'Bravo ! Excellente réponse 🎯' : 'Pas tout à fait...'}
                </span>
                {currentArticle.quiz.explanation}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
