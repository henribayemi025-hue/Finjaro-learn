import React, { useRef, useEffect, useState } from 'react';
import { 
  Copy, 
  Check, 
  RotateCcw, 
  AlignLeft, 
  AlertCircle, 
  Info, 
  AlertTriangle,
  Code,
  FileCode2
} from 'lucide-react';
import { Collaborator, CodeIssue, Language } from '../types';

interface CodeEditorProps {
  code: string;
  onChange: (newCode: string) => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  collaborators: Collaborator[];
  issues: CodeIssue[];
  onSelectIssue?: (issue: CodeIssue) => void;
  onResetCode?: () => void;
  fileName?: string;
  onRunCode?: () => void;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  code,
  onChange,
  language,
  onLanguageChange,
  collaborators,
  issues,
  onSelectIssue,
  onResetCode,
  fileName = 'solution.js',
  onRunCode,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [currentLine, setCurrentLine] = useState(1);

  const lines = code.split('\n');

  // Sync gutter scrolling with textarea
  const handleScroll = () => {
    if (textareaRef.current && gutterRef.current) {
      gutterRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  // Keyboard shortcut handlers (Tab, Run on Ctrl+Enter)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      onRunCode?.();
      return;
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;

      // Insert 2 spaces
      const newCode = code.substring(0, start) + '  ' + code.substring(end);
      onChange(newCode);

      // Restore cursor position after state update
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2;
        }
      }, 0);
    }
  };

  const updateCursorLine = () => {
    if (!textareaRef.current) return;
    const pos = textareaRef.current.selectionStart;
    const textBefore = code.substring(0, pos);
    const lineIndex = textBefore.split('\n').length;
    setCurrentLine(lineIndex);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFormat = () => {
    try {
      // Basic aesthetic clean-up for code
      const formatted = code
        .split('\n')
        .map(l => l.trimEnd())
        .join('\n');
      onChange(formatted);
    } catch (e) {
      // Keep as-is
    }
  };

  // Map issues by line number
  const issuesByLine = new Map<number, CodeIssue>();
  issues.forEach((issue) => {
    if (issue.line) {
      issuesByLine.set(issue.line, issue);
    }
  });

  return (
    <div className="flex flex-col h-full bg-slate-950 border-r border-slate-800/80 overflow-hidden select-text">
      {/* Editor Sub-header / File tabs */}
      <div className="h-10 bg-slate-900/90 border-b border-slate-800/80 px-3 flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-950 border-t-2 border-t-emerald-500 border-x border-slate-800 rounded-t text-xs font-mono text-slate-200">
            <FileCode2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>{fileName}</span>
          </div>

          <div className="text-[11px] text-slate-500 pl-2">
            <span>{lines.length} lignes</span>
            <span className="mx-1.5">·</span>
            <span>{code.length} caractères</span>
          </div>
        </div>

        {/* Toolbar items */}
        <div className="flex items-center gap-1">
          {/* Language selector */}
          <select
            value={language}
            onChange={(e) => onLanguageChange(e.target.value as Language)}
            className="bg-slate-950 border border-slate-800 text-slate-300 text-xs px-2 py-1 rounded focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="javascript">JavaScript (ES2024)</option>
            <option value="typescript">TypeScript</option>
            <option value="html">HTML5 / Web</option>
            <option value="python">Python</option>
          </select>

          <button
            onClick={handleFormat}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition cursor-pointer"
            title="Formater le code"
          >
            <AlignLeft className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleCopy}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition cursor-pointer"
            title="Copier le code"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          {onResetCode && (
            <button
              onClick={onResetCode}
              className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded transition cursor-pointer"
              title="Réinitialiser au code de départ"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Editor Content with Line Numbers & Collaborator Cursors */}
      <div className="relative flex-1 flex overflow-hidden font-mono text-xs sm:text-[13px] leading-6 bg-[#0b0f17]">
        {/* Line Gutter with Issue & Collab Indicators */}
        <div
          ref={gutterRef}
          className="w-12 sm:w-14 py-3 bg-[#090d14] border-r border-slate-800/60 select-none text-right pr-2 text-slate-600 overflow-hidden shrink-0"
        >
          {lines.map((_, i) => {
            const lineNum = i + 1;
            const issue = issuesByLine.get(lineNum);
            const isCur = lineNum === currentLine;

            return (
              <div
                key={lineNum}
                className={`relative flex items-center justify-end gap-1 h-6 ${
                  isCur ? 'text-slate-300 font-bold' : ''
                }`}
              >
                {/* Diagnostic icon if issue on this line */}
                {issue && (
                  <button
                    onClick={() => onSelectIssue?.(issue)}
                    title={`${issue.severity.toUpperCase()}: ${issue.title}`}
                    className="cursor-pointer"
                  >
                    {issue.severity === 'error' && (
                      <AlertCircle className="w-3 h-3 text-red-400 animate-pulse" />
                    )}
                    {issue.severity === 'warning' && (
                      <AlertTriangle className="w-3 h-3 text-amber-400" />
                    )}
                    {issue.severity === 'info' && (
                      <Info className="w-3 h-3 text-cyan-400" />
                    )}
                  </button>
                )}
                <span>{lineNum}</span>
              </div>
            );
          })}
        </div>

        {/* Textarea code container */}
        <div className="relative flex-1 h-full overflow-hidden">
          {/* Active collaborator badges pinned to lines */}
          <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
            {collaborators
              .filter((c) => c.cursorLine && c.role !== 'host')
              .map((c) => {
                const topOffset = (c.cursorLine! - 1) * 24 + 12; // 24px line height + 12px padding
                return (
                  <div
                    key={c.id}
                    className="absolute left-4 flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-sans font-medium text-white shadow-lg transition-all duration-300 pointer-events-auto"
                    style={{
                      top: `${topOffset}px`,
                      backgroundColor: c.color,
                      opacity: 0.95,
                    }}
                  >
                    <span>{c.avatar}</span>
                    <span>{c.name}</span>
                    {c.isTyping && <span className="animate-pulse">écrit...</span>}
                  </div>
                );
              })}
          </div>

          {/* Real synchronized textarea */}
          <textarea
            ref={textareaRef}
            value={code}
            onChange={(e) => {
              onChange(e.target.value);
              updateCursorLine();
            }}
            onKeyUp={updateCursorLine}
            onClick={updateCursorLine}
            onScroll={handleScroll}
            onKeyDown={handleKeyDown}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            className="w-full h-full p-3 bg-transparent text-slate-100 placeholder-slate-600 resize-none font-mono focus:outline-none leading-6 selection:bg-emerald-500/25 z-0"
            placeholder="// Écrivez ou collez votre code ici..."
          />
        </div>
      </div>

      {/* Editor Status Bar */}
      <div className="h-6 bg-slate-950 border-t border-slate-800/80 px-3 flex items-center justify-between text-[11px] text-slate-400 shrink-0 select-none">
        <div className="flex items-center gap-3">
          <span>Ligne {currentLine}, Colonne 1</span>
          <span className="hidden sm:inline">UTF-8</span>
          <span className="hidden sm:inline">Espaces: 2</span>
        </div>

        <div className="flex items-center gap-2">
          {issues.length > 0 ? (
            <div className="flex items-center gap-1.5 text-amber-400">
              <AlertTriangle className="w-3 h-3" />
              <span>{issues.length} observation(s) IA</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-emerald-400">
              <Check className="w-3 h-3" />
              <span>Code valide</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
