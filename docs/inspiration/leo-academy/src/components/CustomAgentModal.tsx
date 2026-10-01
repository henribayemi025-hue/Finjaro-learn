import React, { useState } from 'react';
import { X, Plus, Sparkles, Check, Bot, Sliders, ShieldCheck } from 'lucide-react';
import { LeoAgent } from '../types';

interface CustomAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveAgent: (newAgent: LeoAgent) => void;
}

export const CustomAgentModal: React.FC<CustomAgentModalProps> = ({
  isOpen,
  onClose,
  onSaveAgent,
}) => {
  const [name, setName] = useState('');
  const [role, setRole] = useState('Coach Spécialisé');
  const [specialty, setSpecialty] = useState('TypeScript, Architecture & Performance');
  const [personality, setPersonality] = useState('Pédagogue, bienveillant et orienté bonnes pratiques');
  const [systemPrompt, setSystemPrompt] = useState(
    'Tu es un agent d\'apprentissage Léo sur-mesure. Analyse le code de l\'élève et donne des explications limpides en français.'
  );
  const [avatarColor, setAvatarColor] = useState('from-purple-500 to-indigo-600');
  const [avatarType, setAvatarType] = useState<'custom' | 'robot'>('custom');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newAgent: LeoAgent = {
      id: `custom-${Date.now()}`,
      name: name.trim(),
      role: role.trim(),
      specialty: specialty.trim(),
      personality: personality.trim(),
      avatarColor,
      avatarType,
      systemPrompt: systemPrompt.trim(),
      isCustom: true,
    };

    onSaveAgent(newAgent);
    onClose();
  };

  const presetColors = [
    { label: 'Violet Mystique', val: 'from-purple-500 to-indigo-600' },
    { label: 'Cyan Laser', val: 'from-cyan-400 to-blue-600' },
    { label: 'Émeraude Futuriste', val: 'from-emerald-400 to-teal-600' },
    { label: 'Ambre Énergie', val: 'from-amber-400 to-orange-600' },
    { label: 'Rose Néon', val: 'from-pink-500 to-rose-600' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 flex items-center justify-center shadow">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-base">
                Brancher un Agent Léo Personnalisé
              </h3>
              <p className="text-xs text-slate-400">
                Connectez votre propre mentor IA avec votre persona et vos consignes
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
          {/* Name & Role */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Nom de l'Agent Léo *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Théo, Sofia, CyberMentor..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-slate-100 outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Rôle / Titre
              </label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Ex: Architecte Logiciel, Mentor Algo..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-slate-100 outline-none"
              />
            </div>
          </div>

          {/* Specialty */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Domaine d'expertise
            </label>
            <input
              type="text"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              placeholder="Ex: JavaScript, Python, Architecture RAG, Rust..."
              className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-slate-100 outline-none"
            />
          </div>

          {/* Avatar Style & Color */}
          <div>
            <label className="block text-slate-300 font-semibold mb-2">
              Couleur & Visuel du Halo
            </label>
            <div className="flex flex-wrap gap-2">
              {presetColors.map((color) => (
                <button
                  type="button"
                  key={color.val}
                  onClick={() => setAvatarColor(color.val)}
                  className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 transition ${
                    avatarColor === color.val
                      ? 'bg-slate-800 border-cyan-400 text-white shadow'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className={`w-3.5 h-3.5 rounded-full bg-gradient-to-r ${color.val}`} />
                  <span className="text-xs">{color.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* System Prompt */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-slate-300 font-semibold">
                Prompt Système / Consignes d'apprentissage
              </label>
              <span className="text-[11px] text-slate-500">Injecté dans l'orchestrateur</span>
            </div>
            <textarea
              rows={4}
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="Décrivez les règles pédagogiques de cet agent..."
              className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl p-3 text-slate-100 text-xs font-mono leading-relaxed outline-none"
            />
          </div>

          {/* Leo Connection Info */}
          <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-800/40 text-xs text-indigo-200 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Cet agent Léo sera sauvegardé dans votre espace. Vous pourrez l'invoquer dans
              l'éditeur de code, l'appeler à la voix ou le mentionner dans vos salons de groupe avec{' '}
              <code className="bg-indigo-900/60 px-1 py-0.5 rounded text-amber-300">
                @{name || 'MonAgent'}
              </code>.
            </p>
          </div>

          {/* Footer Action */}
          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Brancher mon Agent</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
