import React, { useState } from 'react';
import {
  FileText,
  Briefcase,
  Sparkles,
  Send,
  Copy,
  Check,
  Download,
  Award,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import { Lesson } from '../types';

interface CareerStudioProps {
  completedLessonIds: string[];
  allLessons: Lesson[];
  isAIMode: boolean;
}

export const CareerStudio: React.FC<CareerStudioProps> = ({
  completedLessonIds,
  allLessons,
  isAIMode,
}) => {
  const [activeTab, setActiveTab] = useState<'cv' | 'letter'>('cv');
  const [targetRole, setTargetRole] = useState('Développeur Frontend / Fullstack Junior');
  const [targetCompany, setTargetCompany] = useState('Entreprise Tech / Startup Innovante');
  const [skillsText, setSkillsText] = useState('JavaScript ES6+, TypeScript, Algorithmique, Git, APIs REST, Node.js');
  const [backgroundText, setBackgroundText] = useState(
    'En reconversion tech ou fin d\'études, passionné par la résolution de problèmes et la rigueur du code inspirée du MIT & CS50.'
  );

  const [isLoading, setIsLoading] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<string>('');
  const [copied, setCopied] = useState(false);

  // Calculate user's validated curriculum accomplishments
  const completedLessons = allLessons.filter((l) => completedLessonIds.includes(l.id));
  const accomplishmentsSummary =
    completedLessons.length > 0
      ? `Modules validés chez Léo Academy (${completedLessons.length} cours) : ${completedLessons
          .map((l) => l.title)
          .join(', ')}.`
      : 'Modules de programmation fondamentale en cours (structures de données, complexité algorithmique, piles et programmation asynchrone).';

  const handleGenerate = async () => {
    setIsLoading(true);
    setGeneratedResult('');

    if (!isAIMode) {
      // Deterministic offline recruiter-approved template (0 tokens, 100% free)
      setTimeout(() => {
        if (activeTab === 'cv') {
          setGeneratedResult(`PROFIL PROFESSIONNEL :
Développeur passionné doté d'une solide formation aux principes computationnels fondamentaux (CS50x / MIT). Capacité démontrée à concevoir des algorithmes robustes en complexité optimale O(N), manipuler des structures de données complexes (Stacks, Collections fonctionnelles) et architecturer des flux asynchrones fiables.

COMPÉTENCES CLÉS :
• Langages & Frameworks : ${skillsText}
• Fondations Théoriques : Piles (Stacks), Tableaux fonctionnels (map/filter/reduce), Algorithmes de recherche, Complexité Big-O
• Méthodes & Outils : Tests unitaires automatisés, Git/GitHub, Clean Code, Approche STAR

RÉALISATIONS & PROJETS TECHNIQUES :
• Moteur de Validation Algorithmique & Résolution de Parenthèses (Stack LIFO)
  - Implémentation d'une structure de pile pour la validation de syntaxe en O(N) temps et O(N) espace.
  - Résolution exhaustive des cas limites et automatisation des suites de tests unitaires.
• Orchestration de Batch Asynchrone & Intégration d'APIs
  - Parallélisation de requêtes asynchrones avec Promise.all, divisant la latence par 3.
  - Gestion résiliente des exceptions avec blocs try/catch et normalisation des flux de données.
• Cursus Léo Academy validé :
  - ${accomplishmentsSummary}

CONSEIL RECRUTEUR (Sans IA) :
Pour les entretiens techniques, entraînez-vous à expliquer à haute voix votre démarche ("Thinking out loud") avant d'écrire la moindre ligne de code.`);
        } else {
          setGeneratedResult(`Madame, Monsieur,

Actuellement engagé dans un cursus rigoureux d'apprentissage du développement logiciel et de l'intelligence artificielle chez Léo Academy, je vous adresse ma candidature avec un vif enthousiasme pour le poste de ${targetRole} au sein de ${targetCompany}.

Mon parcours m'a permis d'acquérir une compréhension profonde des mécanismes fondamentaux du code, au-delà de la simple syntaxe. Formé selon les méthodes computationnelles inspirées des cours de référence de Harvard et du MIT, j'ai notamment consolidé mes compétences autour de :
• La conception d'algorithmes efficients et la maîtrise de structures de données clés (piles, dictionnaires, collections fonctionnelles) ;
• Le développement d'applications asynchrones modernes avec JavaScript/TypeScript (${skillsText}) ;
• La rigueur des tests automatisés et le souci constant de la maintenabilité logicielle.

Rejoindre ${targetCompany} représente pour moi l'opportunité de mettre cette exigence technique et ma curiosité intellectuelle au service de projets concrets à fort impact.

Je me tiens à votre entière disposition pour un entretien afin de vous présenter mes réalisations et mon code.

Dans cette attente, je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.`);
        }
        setIsLoading(false);
      }, 400);
      return;
    }

    // Call server-side Gemini API
    try {
      const res = await fetch('/api/career/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: activeTab,
          role: targetRole,
          skills: skillsText.split(',').map((s) => s.trim()),
          experience: backgroundText,
          projects: accomplishmentsSummary,
          targetCompany,
        }),
      });

      const data = await res.json();
      setGeneratedResult(data.result || data.error || 'Erreur lors de la génération.');
    } catch (e: any) {
      setGeneratedResult("Erreur réseau lors de la génération. Vous pouvez utiliser le modèle hors-ligne !");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            <Briefcase className="w-3.5 h-3.5" />
            <span>Studio Carrière Tech & IA</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-100">
            Valorisez vos Compétences : CV & Lettres de Motivation
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Transformez vos cours et projets validés dans Léo Academy en arguments percutants
            pour décrocher des stages, alternances ou postes de Développeur et AI Engineer.
          </p>
        </div>

        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs shrink-0 space-y-1">
          <div className="text-slate-400">Vos cours validés à valoriser :</div>
          <div className="font-mono text-cyan-400 font-bold">
            {completedLessons.length} leçons terminées (+{completedLessons.length * 50} XP)
          </div>
        </div>
      </div>

      {/* Tabs Switcher (CV vs Lettre) */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-900 border border-slate-800 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('cv')}
          className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
            activeTab === 'cv'
              ? 'bg-cyan-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Générateur de Puces CV Tech</span>
        </button>

        <button
          onClick={() => setActiveTab('letter')}
          className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
            activeTab === 'letter'
              ? 'bg-cyan-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>Lettre de Motivation Personnalisée</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Inputs (Left) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl text-xs sm:text-sm">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Poste / Rôle ciblé
            </label>
            <input
              type="text"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="Ex: Développeur JavaScript, Stagiaire AI Engineer..."
              className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-slate-100 outline-none"
            />
          </div>

          {activeTab === 'letter' && (
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Entreprise visée
              </label>
              <input
                type="text"
                value={targetCompany}
                onChange={(e) => setTargetCompany(e.target.value)}
                placeholder="Ex: Doctolib, Mistral AI, Startup FinTech..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-slate-100 outline-none"
              />
            </div>
          )}

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Compétences techniques clés
            </label>
            <input
              type="text"
              value={skillsText}
              onChange={(e) => setSkillsText(e.target.value)}
              placeholder="Ex: JS, TS, React, Python, RAG, Git..."
              className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-slate-100 outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Votre parcours ou profil résumé
            </label>
            <textarea
              rows={3}
              value={backgroundText}
              onChange={(e) => setBackgroundText(e.target.value)}
              placeholder="Quelques lignes sur votre parcours..."
              className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl p-3 text-slate-100 outline-none resize-none leading-relaxed"
            />
          </div>

          {/* Validated projects badge */}
          <div className="p-3 rounded-2xl bg-cyan-950/20 border border-cyan-800/30 text-xs text-cyan-200">
            <div className="flex items-center gap-1.5 font-bold mb-1">
              <Award className="w-3.5 h-3.5 text-cyan-400" />
              <span>Projets automatiquement injectés :</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              {accomplishmentsSummary}
            </p>
          </div>

          <button
            onClick={handleGenerate}
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs sm:text-sm shadow-lg transition flex items-center justify-center gap-2"
          >
            <Sparkles className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>
              {isLoading
                ? 'Rédaction en cours...'
                : isAIMode
                ? `Optimiser avec l'IA (${activeTab === 'cv' ? 'Puces CV' : 'Lettre'})`
                : `Générer le modèle structuré (Sans IA - 0€)`}
            </span>
          </button>
        </div>

        {/* Output Preview (Right) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col shadow-xl min-h-[450px]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
            <span className="font-bold text-xs sm:text-sm text-slate-200 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-emerald-400" />
              <span>Document généré prêt à l'emploi</span>
            </span>

            {generatedResult && (
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-300">Copié !</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Copier le texte</span>
                  </>
                )}
              </button>
            )}
          </div>

          <div className="flex-1 bg-slate-950 rounded-2xl p-5 border border-slate-800/80 font-mono text-xs leading-relaxed text-slate-200 overflow-y-auto whitespace-pre-wrap">
            {isLoading ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-3">
                <Sparkles className="w-8 h-8 text-cyan-400 animate-spin" />
                <p>Rédaction de votre document professionnel en cours...</p>
              </div>
            ) : generatedResult ? (
              generatedResult
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-2 text-center p-6">
                <Briefcase className="w-8 h-8 text-slate-600" />
                <p>
                  Cliquez sur « {isAIMode ? 'Optimiser avec l\'IA' : 'Générer le modèle'} » pour
                  obtenir votre document personnalisé avec la méthode STAR et vos cours validés.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
