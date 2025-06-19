export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ToneAnalysisHighlight {
  sentence: string;
  tone: string;
  score: number;
}

export interface ToneAnalysis {
  overallTone: string;
  overallScore: number;
  highlightedSentences: ToneAnalysisHighlight[];
}

export interface Suggestion {
  id: string;
  original: string;
  suggestion: string;
  explanation: string;
  type: 'Spelling' | 'Grammar' | 'Style' | 'Punctuation' | 'Clarity';
  severity: 'High' | 'Medium' | 'Low';
}

export interface EngieProps {
  suggestions: Suggestion[];
  onApply: (suggestion: Suggestion) => void;
  onDismiss: (suggestionId: string) => void;
  onIdeate: () => void;
  targetEditorSelector?: string;
  onIdea?: (idea: string) => void;
  documents: Array<{ id: string; title: string }>;
}

export interface EngieState {
  isChatOpen: boolean;
  currentSuggestionIndex: number;
  isScanning: boolean;
  statusMessage: string;
  internalSuggestions: Suggestion[];
  toneAnalysisResult: ToneAnalysis | null;
  overallPageToneAnalysis: ToneAnalysis | null;
  ideationMessage: ChatMessage | null;
  encouragementMessageApi: ChatMessage | null;
  lastEncouragementTone: string | null;
  isIdeating: boolean;
  chatHistory: ChatMessage[];
  activeTab: string;
  ideaNotifications: string[];
  showSparkle: boolean;
  engiePos: { x: number; y: number };
  notificationOpen: boolean;
  botAnimation: 'idle' | 'walking';
  botSpeed: 'normal' | 'fast';
  botDirection: 'left' | 'right';
  isTouchDevice: boolean;
}

export type BotAnimationState = 'idle' | 'walking';
export type BotSpeed = 'normal' | 'fast';
export type BotDirection = 'left' | 'right'; 