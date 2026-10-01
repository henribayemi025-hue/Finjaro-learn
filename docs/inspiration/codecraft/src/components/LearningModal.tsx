import React, { useState } from 'react';
import { 
  X, 
  BookOpen, 
  CheckCircle2, 
  Flame, 
  Award, 
  Sparkles, 
  ArrowRight, 
  Code, 
  Zap,
  Filter,
  Brain,
  Check
} from 'lucide-react';
import { Lesson, Track } from '../types';
import { TRACKS, LESSONS } from '../data/lessons';

interface LearningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLesson: (lesson: Lesson) => void;
  currentLessonId?: string;
  completedLessonIds: string[];
  totalXp: number;
  onGenerateCustomChallenge: (topic: string, difficulty: string) => Promise<void>;
  isGeneratingChallenge: boolean;
}

export const LearningModal: React.FC<LearningModalProps> = ({
  isOpen,
  onClose,
  onSelectLesson,
  currentLessonId,
  completedLessonIds,
  totalXp,
  onGenerateCustomChallenge,
  isGeneratingChallenge,
}) => {
  const [selectedTrack, setSelectedTrack] = useState<string>('all');
  const [customTopic, setCustomTopic] = useState('');
  const [customDifficulty, setCustomDifficulty] = useState('moyen');
  const [showAiGenerator, setShowAiGenerator] = useState(false);

  if (!isOpen) return null;

  const filteredLessons = selectedTrack === 'all'
    ? LESSONS
    : LESSONS.filter(l => l.trackId === selectedTrack);

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTopic.trim() || isGeneratingChallenge) return;
    await onGenerateCustomChallenge(customTopic, customDifficulty);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-emerald-500/20">
              <BookOpen className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Académie de Code & Défis Interactifs
                <span className="text-[11px] font-normal bg-emerald-950 text-emerald-300 border border-emerald-800/60 px-2 py-0.5 rounded-full">
                  Apprentissage guidé
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Sélectionnez un module pratique avec tests unitaires en direct ou demandez à l'IA d'en générer un.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Stats Header */}
            <div className="hidden sm:flex items-center gap-3 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 text-xs font-medium">
              <div className="flex items-center gap-1.5 text-amber-400">
                <Flame className="w-4 h-4 fill-amber-400" />
                <span>3 Jours de série</span>
              </div>
              <div className="w-px h-4 bg-slate-800" />
              <div className="flex items-center gap-1.5 text-emerald-400 font-mono">
                <Award className="w-4 h-4" />
                <span>{totalXp} XP</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tracks Filter Bar & Custom AI Challenge trigger */}
        <div className="px-6 py-3 border-b border-slate-800/80 bg-slate-950/40 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
            <button
              onClick={() => setSelectedTrack('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                selectedTrack === 'all'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Tous les cours ({LESSONS.length})
            </button>

            {TRACKS.map((track) => (
              <button
                key={track.id}
                onClick={() => setSelectedTrack(track.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                  selectedTrack === track.id
                    ? 'bg-slate-800 text-emerald-300'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>{track.icon}</span>
                <span>{track.title}</span>
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowAiGenerator(!showAiGenerator)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-slate-950 font-bold text-xs rounded-lg shadow transition cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Générer un défi IA sur-mesure</span>
          </button>
        </div>

        {/* Custom AI Challenge Form (Accordion) */}
        {showAiGenerator && (
          <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 animate-in slide-in-from-top-4">
            <form onSubmit={handleCustomSubmit} className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-2">
                  <Brain className="w-4 h-4 text-emerald-400" />
                  Créer un exercice personnalisé avec l'IA
                </span>
                <span className="text-[11px] text-slate-500">
                  Généré par Gemini 3.8 avec assertions et tests unitaires
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <input
                    type="text"
                    value={customTopic}
                    onChange={(e) => setCustomTopic(e.target.value)}
                    placeholder="Ex: Les promesses en cascade, algorithme de Dijkstra, Regex pour emails..."
                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div className="flex gap-2">
                  <select
                    value={customDifficulty}
                    onChange={(e) => setCustomDifficulty(e.target.value)}
                    className="bg-slate-900 border border-slate-700 text-slate-200 text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-emerald-500 flex-1"
                  >
                    <option value="débutant">Niveau Débutant</option>
                    <option value="moyen">Niveau Intermédiaire</option>
                    <option value="avancé">Niveau Expert</option>
                  </select>

                  <button
                    type="submit"
                    disabled={isGeneratingChallenge || !customTopic.trim()}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-lg transition shrink-0 cursor-pointer"
                  >
                    {isGeneratingChallenge ? 'Génération...' : 'Créer'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Lessons Grid */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredLessons.map((lesson) => {
              const isCompleted = completedLessonIds.includes(lesson.id);
              const isCurrent = lesson.id === currentLessonId;

              return (
                <div
                  key={lesson.id}
                  onClick={() => {
                    onSelectLesson(lesson);
                    onClose();
                  }}
                  className={`p-4 rounded-xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                    isCurrent
                      ? 'bg-emerald-950/20 border-emerald-500/80 shadow-lg shadow-emerald-950/30 ring-1 ring-emerald-500'
                      : isCompleted
                      ? 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                      : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                  }`}
                >
                  <div>
                    {/* Header tags */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-medium ${
                          lesson.difficulty === 'Débutant'
                            ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/50'
                            : lesson.difficulty === 'Intermédiaire'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800/50'
                            : 'bg-purple-950 text-purple-300 border border-purple-800/50'
                        }`}>
                          {lesson.difficulty}
                        </span>

                        <span className="text-[11px] text-slate-500 font-mono">
                          +{lesson.xp} XP
                        </span>
                      </div>

                      {isCompleted && (
                        <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Validé</span>
                        </div>
                      )}
                    </div>

                    <h3 className="text-sm font-bold text-white mb-1.5 leading-snug">
                      {lesson.title}
                    </h3>

                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-3">
                      {lesson.concept}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs">
                    <span className="text-slate-500">
                      {lesson.testCases.length} cas de test unitaires
                    </span>

                    <div className="flex items-center gap-1 font-semibold text-emerald-400 group-hover:translate-x-1 transition">
                      <span>{isCurrent ? 'En cours' : 'Commencer'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
