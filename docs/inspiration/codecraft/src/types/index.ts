export type Language = 'javascript' | 'typescript' | 'html' | 'python';

export interface Collaborator {
  id: string;
  name: string;
  avatar: string;
  color: string;
  cursorLine?: number;
  isTyping?: boolean;
  isSpeaking?: boolean;
  isMuted?: boolean;
  role: 'host' | 'peer' | 'ai';
}

export interface ChatMessage {
  id: string;
  sender: string;
  avatar: string;
  text: string;
  timestamp: number;
  isAi?: boolean;
  codeSnippet?: string;
}

export interface CodeIssue {
  line: number;
  severity: 'error' | 'warning' | 'info';
  title: string;
  explanation: string;
  suggestion: string;
  fixedSnippet?: string;
}

export interface CodeAnalysisResult {
  hasErrors: boolean;
  summary: string;
  overallScore: number;
  teachingTip: string;
  issues: CodeIssue[];
}

export interface TestCase {
  id: string;
  description: string;
  input?: string;
  expected?: any;
  testFunctionStr?: string;
}

export interface Lesson {
  id: string;
  trackId: string;
  title: string;
  difficulty: 'Débutant' | 'Intermédiaire' | 'Avancé';
  language: Language;
  concept: string;
  theory: string;
  instructions: string[];
  starterCode: string;
  solutionCode: string;
  hints: string[];
  testCases: TestCase[];
  xp: number;
}

export interface Track {
  id: string;
  title: string;
  description: string;
  icon: string;
  level: string;
  totalLessons: number;
  badge: string;
}

export interface ConsoleEntry {
  type: 'log' | 'error' | 'warn' | 'info' | 'result';
  message: string;
  timestamp: number;
  line?: number;
}

export interface TestResult {
  id: string;
  description: string;
  passed: boolean;
  error?: string;
  expected?: any;
  received?: any;
}
