import React, { useState } from 'react';
import {
  RotateCw,
  CheckCircle,
  XCircle,
  Layers,
  Sparkles,
  BookOpen,
  Filter,
  Brain,
  Code2,
} from 'lucide-react';
import { Flashcard, TrackId } from '../types';

interface RevisionFlashcardsProps {
  flashcards: Flashcard[];
}

export const RevisionFlashcards: React.FC<RevisionFlashcardsProps> = ({ flashcards }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [masteredIds, setMasteredIds] = useState<string[]>([]);
  const [toReviewIds, setToReviewIds] = useState<string[]>([]);

  const categories = ['all', ...Array.from(new Set(flashcards.map((f) => f.category)))];

  const filteredCards =
    selectedCategory === 'all'
      ? flashcards
      : flashcards.filter((f) => f.category === selectedCategory);

  const currentCard = filteredCards[currentIndex] || filteredCards[0];

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % filteredCards.length);
  };

  const handleMarkMastered = () => {
    if (!masteredIds.includes(currentCard.id)) {
      setMasteredIds([...masteredIds, currentCard.id]);
      setToReviewIds(toReviewIds.filter((id) => id !== currentCard.id));
    }
    handleNext();
  };

  const handleMarkToReview = () => {
    if (!toReviewIds.includes(currentCard.id)) {
      setToReviewIds([...toReviewIds, currentCard.id]);
      setMasteredIds(masteredIds.filter((id) => id !== currentCard.id));
    }
    handleNext();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold">
            <Brain className="w-3.5 h-3.5" />
            <span>Mémorisation Active & Répétition Espacée</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-100">
            Fiches de Révision Tech & IA
          </h2>
          <p className="text-xs text-slate-400">
            Fixez durablement les concepts clés du code et de l'intelligence artificielle.
          </p>
        </div>

        {/* Score chips */}
        <div className="flex items-center gap-3 bg-slate-950 p-3 rounded-2xl border border-slate-800 text-xs">
          <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
            <CheckCircle className="w-4 h-4" />
            <span>{masteredIds.length} maîtrisées</span>
          </div>
          <div className="h-4 w-px bg-slate-800" />
          <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
            <XCircle className="w-4 h-4" />
            <span>{toReviewIds.length} à revoir</span>
          </div>
        </div>
      </div>

      {/* Category filter pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <Filter className="w-4 h-4 text-slate-500 shrink-0 ml-1" />
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => {
              setSelectedCategory(cat);
              setCurrentIndex(0);
              setIsFlipped(false);
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition shrink-0 border ${
              selectedCategory === cat
                ? 'bg-cyan-600 text-white border-cyan-500 shadow-md'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
            }`}
          >
            {cat === 'all' ? 'Toutes les fiches' : cat}
          </button>
        ))}
      </div>

      {/* Flashcard 3D Card */}
      {currentCard && (
        <div className="relative flex flex-col items-center">
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="w-full min-h-[380px] cursor-pointer rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 p-8 shadow-2xl transition-all duration-300 flex flex-col justify-between relative overflow-hidden group select-none"
          >
            {/* Ambient background glow */}
            <div className="absolute top-0 right-0 -mt-12 -mr-12 w-48 h-48 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

            {/* Card Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  {currentCard.category}
                </span>
                <span className="text-xs text-slate-500">
                  Carte {currentIndex + 1} sur {filteredCards.length}
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-400 group-hover:text-cyan-300 transition">
                <RotateCw className="w-3.5 h-3.5" />
                <span>{isFlipped ? 'Voir question' : 'Retourner (clic)'}</span>
              </div>
            </div>

            {/* Card Body */}
            <div className="py-6 flex-1 flex flex-col justify-center">
              {!isFlipped ? (
                // Front: Question
                <div className="space-y-4">
                  <span className="text-xs font-mono text-slate-500 uppercase tracking-wider block">
                    Question fondamentale :
                  </span>
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-100 leading-snug">
                    {currentCard.question}
                  </h3>
                  <p className="text-xs text-slate-400 italic">
                    Prenez 10 secondes pour formuler la réponse dans votre tête avant de retourner la carte...
                  </p>
                </div>
              ) : (
                // Back: Answer & Explanation
                <div className="space-y-4">
                  <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider block">
                    Réponse & Démonstration :
                  </span>
                  <div className="text-sm sm:text-base text-slate-200 leading-relaxed whitespace-pre-line">
                    {currentCard.answer}
                  </div>

                  {currentCard.codeSnippet && (
                    <div className="rounded-xl bg-slate-950 p-3 border border-slate-800 font-mono text-xs text-cyan-300 overflow-x-auto">
                      <pre>
                        <code>{currentCard.codeSnippet}</code>
                      </pre>
                    </div>
                  )}

                  <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-800/40 text-xs text-cyan-200 flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <p>
                      <strong className="text-cyan-300">À retenir pour les entretiens : </strong>
                      {currentCard.keyTakeaway}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Progress Bar */}
            <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
              <span>Astuce : Révisez 5 cartes chaque matin pour maximiser la rétention.</span>
              <span className="font-mono text-cyan-400">
                {Math.round(((currentIndex + 1) / filteredCards.length) * 100)}%
              </span>
            </div>
          </div>

          {/* Action buttons (À revoir / Maîtrisé) */}
          <div className="flex items-center gap-4 mt-6">
            <button
              onClick={handleMarkToReview}
              className="px-6 py-3 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold text-xs sm:text-sm flex items-center gap-2 shadow transition"
            >
              <XCircle className="w-4 h-4" />
              <span>À revoir plus tard</span>
            </button>

            <button
              onClick={() => setIsFlipped(!isFlipped)}
              className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
              title="Retourner la carte"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            <button
              onClick={handleMarkMastered}
              className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg transition"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Je sais parfaitement !</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
