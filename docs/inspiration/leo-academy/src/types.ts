export type TrackId =
  | 'programming'
  | 'datascience'
  | 'ai'
  | 'ai-engineering'
  | 'prompt-engineering';

export interface TestCase {
  description: string;
  testFnCode: string; // JavaScript code to evaluate returning boolean or throws
  expected: string;
}

export interface Lesson {
  id: string;
  trackId: TrackId;
  moduleNumber: number;
  lessonNumber: number;
  title: string;
  subtitle: string;
  difficulty: 'Débutant' | 'Intermédiaire' | 'Avancé';
  estimatedMinutes: number;
  academicInspiration: string; // e.g. "Inspiré de CS50x Lecture 1 & MIT 6.0001 (Non certifié)"
  theory: {
    overview: string;
    keyPoints: string[];
    codeExamples: Array<{
      title: string;
      code: string;
      explanation: string;
    }>;
    commonPitfalls?: string[];
  };
  exercise: {
    instruction: string;
    task: string;
    expectedBehavior: string;
    starterCode: string;
    testCases: TestCase[];
    hints: string[];
    solutionCode: string;
    solutionExplanation: string;
  };
  recommendedAgent: 'maya' | 'idris';
}

export interface Track {
  id: TrackId;
  title: string;
  shortTitle: string;
  icon: string;
  color: string;
  badge: string;
  status: 'active' | 'coming-soon';
  academicBasis: string;
  description: string;
  targetAudience: string;
  modulesCount: number;
  durationHours: number;
  syllabus: Array<{
    title: string;
    description: string;
    topics: string[];
  }>;
}

export interface LeoAgent {
  id: string;
  name: string;
  role: string;
  specialty: string;
  personality: string;
  avatarColor: string;
  avatarType: 'maya' | 'idris' | 'custom' | 'robot';
  systemPrompt: string;
  isCustom?: boolean;
}

export interface GroupMember {
  id: string;
  name: string;
  avatar: string;
  role: string;
  isOnline: boolean;
}

export interface GroupMessage {
  id: string;
  author: string;
  isAgent?: boolean;
  agentAvatar?: string;
  text: string;
  codeSnippet?: string;
  timestamp: string;
}

export interface StudyGroup {
  id: string;
  name: string;
  topic: string;
  trackId: TrackId;
  code: string;
  members: GroupMember[];
  messages: GroupMessage[];
}

export interface Flashcard {
  id: string;
  category: string;
  trackId: TrackId;
  question: string;
  answer: string;
  codeSnippet?: string;
  keyTakeaway: string;
}

export interface NewsletterArticle {
  id: string;
  issue: number;
  date: string;
  title: string;
  readTime: string;
  summary: string;
  content: string[];
  keyInsight: string;
  quiz: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
}

export interface CommunityReply {
  id: string;
  author: string;
  isAgent?: boolean;
  avatar: string;
  text: string;
  codeSnippet?: string;
  timestamp: string;
  upvotes: number;
}

export interface CommunityPost {
  id: string;
  author: string;
  authorAvatar: string;
  title: string;
  category: 'Question de cours' | 'Debug de code' | 'Projet IA' | 'Conseil Carrière';
  trackId: TrackId;
  content: string;
  codeSnippet?: string;
  replies: CommunityReply[];
  upvotes: number;
  isResolved: boolean;
  timestamp: string;
}
