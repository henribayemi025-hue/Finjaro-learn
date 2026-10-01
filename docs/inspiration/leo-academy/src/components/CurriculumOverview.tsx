import React from 'react';
import {
  Code2,
  BarChart3,
  Brain,
  Cpu,
  Sparkles,
  BookOpen,
  Clock,
  Award,
  ArrowRight,
  CheckCircle2,
  Lock,
  Layers,
  GraduationCap,
} from 'lucide-react';
import { Track, TrackId, Lesson } from '../types';

interface CurriculumOverviewProps {
  tracks: Track[];
  selectedTrackId: TrackId;
  onSelectTrack: (trackId: TrackId) => void;
  lessons: Lesson[];
  completedLessonIds: string[];
  onStartLesson: (lessonId: string) => void;
}

export const CurriculumOverview: React.FC<CurriculumOverviewProps> = ({
  tracks,
  selectedTrackId,
  onSelectTrack,
  lessons,
  completedLessonIds,
  onStartLesson,
}) => {
  const currentTrack = tracks.find((t) => t.id === selectedTrackId) || tracks[0];
  const trackLessons = lessons.filter((l) => l.trackId === selectedTrackId);

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Code2':
        return <Code2 className="w-5 h-5" />;
      case 'BarChart3':
        return <BarChart3 className="w-5 h-5" />;
      case 'Brain':
        return <Brain className="w-5 h-5" />;
      case 'Cpu':
        return <Cpu className="w-5 h-5" />;
      case 'Sparkles':
        return <Sparkles className="w-5 h-5" />;
      default:
        return <BookOpen className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-8">
      {/* Harvard & MIT Open Courseware Academic Manifesto */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
              <GraduationCap className="w-4 h-4 text-indigo-400" />
              <span>Inspiration Pédagogique Universitaire Ouverte</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              5 Parcours d'Excellence : Du Premier Script à l'IA Générative
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Nos cursus s'inspirent directement de la pédagogie et des structures de cours gratuits
              de référence mondiale comme <span className="text-cyan-300 font-semibold">Harvard CS50</span> et{' '}
              <span className="text-cyan-300 font-semibold">MIT OpenCourseWare (6.0001, 6.034)</span>.
              <span className="block mt-1 text-slate-400 text-xs italic">
                * Note de transparence : Léo Academy est un projet d'apprentissage indépendant et ouvert,
                non certifié ni affilié formellement à Harvard University ou au MIT.
              </span>
            </p>
          </div>

          <div className="flex flex-col gap-2 shrink-0 bg-slate-950/70 p-4 rounded-2xl border border-slate-800 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Parcours Programmation : <b className="text-emerald-400">Actif & En cours</b></span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>4 Parcours Spécialisés : Syllabus & Inscriptions ouvertes</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5 Tracks Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {tracks.map((track) => {
          const isSelected = track.id === selectedTrackId;
          const isActive = track.status === 'active';
          return (
            <button
              key={track.id}
              onClick={() => onSelectTrack(track.id)}
              className={`p-4 rounded-3xl border text-left transition flex flex-col justify-between relative overflow-hidden group ${
                isSelected
                  ? 'bg-slate-900 border-cyan-500 shadow-xl ring-2 ring-cyan-500/20'
                  : 'bg-slate-950/70 border-slate-800 hover:bg-slate-900/60'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`w-10 h-10 rounded-2xl bg-gradient-to-r ${track.color} flex items-center justify-center text-white shadow`}
                  >
                    {getIcon(track.icon)}
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      isActive
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {track.badge}
                  </span>
                </div>

                <h3 className="font-bold text-slate-100 text-sm group-hover:text-cyan-300 transition">
                  {track.shortTitle}
                </h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {track.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                <span>{track.modulesCount} modules</span>
                <span>{track.durationHours}h estimées</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Track Detailed Syllabus & Interactive Lessons */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-cyan-400 font-semibold uppercase">
                {currentTrack.academicBasis}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-100 mt-1">
              {currentTrack.title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl leading-relaxed">
              {currentTrack.description}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 font-medium">
              Public cible : {currentTrack.targetAudience}
            </span>
          </div>
        </div>

        {/* If Active Track (Programmation), list lessons with completion status and direct launcher */}
        {currentTrack.status === 'active' ? (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-200 text-base flex items-center gap-2">
                <Code2 className="w-5 h-5 text-cyan-400" />
                <span>Leçons interactives avec éditeur et tests unitaires</span>
              </h3>
              <span className="text-xs text-cyan-400 font-mono font-medium">
                {trackLessons.filter((l) => completedLessonIds.includes(l.id)).length} /{' '}
                {trackLessons.length} leçons complétées
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {trackLessons.map((lesson) => {
                const isCompleted = completedLessonIds.includes(lesson.id);
                return (
                  <div
                    key={lesson.id}
                    className={`p-5 rounded-2xl border transition flex flex-col justify-between ${
                      isCompleted
                        ? 'bg-emerald-950/20 border-emerald-800/40 shadow-sm'
                        : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[11px] font-mono text-slate-400">
                          {lesson.academicInspiration}
                        </span>
                        {isCompleted && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Validé
                          </span>
                        )}
                      </div>

                      <h4 className="font-bold text-slate-100 text-sm sm:text-base">
                        {lesson.title}
                      </h4>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                        {lesson.subtitle}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                          {lesson.difficulty}
                        </span>
                        <span>~{lesson.estimatedMinutes} min</span>
                      </div>

                      <button
                        onClick={() => onStartLesson(lesson.id)}
                        className={`px-4 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                          isCompleted
                            ? 'bg-slate-800 hover:bg-slate-700 text-emerald-300'
                            : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-md'
                        }`}
                      >
                        <span>{isCompleted ? 'Recommencer' : 'Coder maintenant'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* For other tracks, show full syllabus breakdown */
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs flex items-center justify-between">
              <span>
                Ce parcours est en préparation active. Les modules théoriques, fiches de révision et
                exercices de prompt sont déjà accessibles dans les sections associées !
              </span>
              <span className="font-mono text-[11px] bg-amber-500/20 px-2 py-1 rounded">
                Rejoignez le salon de groupe pour échanger
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentTrack.syllabus.map((mod, i) => (
                <div
                  key={i}
                  className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 font-bold text-xs flex items-center justify-center">
                      {i + 1}
                    </span>
                    <h4 className="font-bold text-slate-100 text-sm">{mod.title}</h4>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{mod.description}</p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {mod.topics.map((t, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-slate-900 text-slate-300 border border-slate-800 font-mono"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
