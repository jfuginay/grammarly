import { DocumentContext, DocumentType } from '../types/contextTypes';

export class ContextDetectionService {
  private static instance: ContextDetectionService;

  static getInstance(): ContextDetectionService {
    if (!ContextDetectionService.instance) {
      ContextDetectionService.instance = new ContextDetectionService();
    }
    return ContextDetectionService.instance;
  }

  /**
   * Detects the context of a document based on its content
   * @param text The document text to analyze
   * @returns Promise with the detected document context
   */
  async detectContext(text: string): Promise<DocumentContext | null> {
    try {
      if (!text || text.length < 50) {
        return null;
      }

      const response = await fetch('/api/detect-context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.slice(0, 2000) }), // Limiting to 2000 chars for faster analysis
      });

      if (!response.ok) {
        console.error('Failed to detect document context:', response.statusText);
        return null;
      }

      const data = await response.json();
      return data.context || null;
    } catch (error) {
      console.error('Error detecting document context:', error);
      return null;
    }
  }

  /**
   * Gets context-specific writing tips based on document type
   * @param documentType The detected document type
   * @returns Context-specific writing tips
   */
  getContextSpecificTips(documentType: DocumentType): string[] {
    const tips: Record<DocumentType, string[]> = {
      email: [
        'Keep emails concise and to the point',
        'Use clear subject lines',
        'Maintain a professional tone unless appropriate otherwise',
        'Include a clear call to action if needed'
      ],
      blog: [
        'Use engaging headers and subheaders',
        'Break up text with visuals and short paragraphs',
        'Write in a conversational tone',
        'Include a compelling introduction and conclusion'
      ],
      technical: [
        'Use precise, unambiguous language',
        'Define specialized terminology',
        'Organize content with clear structure',
        'Include relevant data and examples'
      ],
      marketing: [
        'Focus on benefits rather than features',
        'Use persuasive language that resonates with your audience',
        'Include strong calls to action',
        'Maintain brand voice consistency'
      ],
      academic: [
        'Use formal language and third-person perspective',
        'Cite sources properly',
        'Structure with clear thesis and supporting arguments',
        'Avoid colloquialisms and contractions'
      ],
      social: [
        'Keep content brief and engaging',
        'Use relevant hashtags where appropriate',
        'Write in a conversational, authentic voice',
        'Consider adding engaging questions or calls for interaction'
      ],
      unknown: [
        'Focus on clarity and conciseness',
        'Organize your content logically',
        'Consider your target audience',
        'Proofread carefully for errors'
      ]
    };

    return tips[documentType] || tips.unknown;
  }
}
