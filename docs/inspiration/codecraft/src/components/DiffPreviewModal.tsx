import React from 'react';
import { X, Check, Wand2, ArrowRight } from 'lucide-react';

interface DiffPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalCode: string;
  fixedCode: string;
  explanation: string;
  changes: string[];
  onApply: () => void;
}

export const DiffPreviewModal: React.FC<DiffPreviewModalProps> = ({
  isOpen,
  onClose,
  originalCode,
  fixedCode,
  explanation,
  changes,
  onApply,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Wand2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Correction Automatique Proposée par l'IA</h3>
              <p className="text-xs text-slate-400">Examinez les modifications avant d'appliquer au fichier</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Explanation & Changes List */}
        <div className="p-5 border-b border-slate-800/80 bg-slate-950/40 space-y-3">
          <p className="text-xs text-slate-300 leading-relaxed font-sans">
            {explanation}
          </p>

          {changes && changes.length > 0 && (
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-slate-400">Modifications apportées :</span>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-300">
                {changes.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Code Diff Comparison */}
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
          {/* Original */}
          <div className="flex flex-col bg-slate-950 border border-red-900/40 rounded-xl overflow-hidden">
            <div className="px-3 py-1.5 bg-red-950/30 border-b border-red-900/40 text-red-300 font-sans font-semibold text-[11px] flex items-center justify-between">
              <span>Code Actuel</span>
              <span className="text-[10px] text-red-400">Avant</span>
            </div>
            <pre className="p-3 text-red-200/90 overflow-x-auto whitespace-pre-wrap leading-relaxed flex-1">
              {originalCode}
            </pre>
          </div>

          {/* Fixed */}
          <div className="flex flex-col bg-slate-950 border border-emerald-900/40 rounded-xl overflow-hidden">
            <div className="px-3 py-1.5 bg-emerald-950/30 border-b border-emerald-900/40 text-emerald-300 font-sans font-semibold text-[11px] flex items-center justify-between">
              <span>Code Corrigé</span>
              <span className="text-[10px] text-emerald-400">Après (Recommandé)</span>
            </div>
            <pre className="p-3 text-emerald-200/90 overflow-x-auto whitespace-pre-wrap leading-relaxed flex-1">
              {fixedCode}
            </pre>
          </div>
        </div>

        {/* Actions Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition cursor-pointer"
          >
            Conserver le code actuel
          </button>

          <button
            onClick={() => {
              onApply();
              onClose();
            }}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold rounded-xl shadow-lg transition flex items-center gap-1.5 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Appliquer la correction</span>
          </button>
        </div>
      </div>
    </div>
  );
};
