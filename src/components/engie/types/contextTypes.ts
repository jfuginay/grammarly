// DocumentContext represents the detected context of the current document
export interface DocumentContext {
  documentType: DocumentType;
  confidence: number; // 0-1 value representing confidence in the detection
  tone: string;       // Detected tone like formal, casual, technical, etc.
  improvementSuggestion: string; // Context-specific improvement suggestion
}

// Types of documents Engie can recognize
export type DocumentType = 'email' | 'blog' | 'technical' | 'marketing' | 'academic' | 'social' | 'unknown';
