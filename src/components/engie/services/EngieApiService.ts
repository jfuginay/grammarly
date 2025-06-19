import { ChatMessage, ToneAnalysis, Suggestion } from '../types';

export class EngieApiService {
  private static instance: EngieApiService;

  static getInstance(): EngieApiService {
    if (!EngieApiService.instance) {
      EngieApiService.instance = new EngieApiService();
    }
    return EngieApiService.instance;
  }

  async fetchEncouragementMessage(tone: string, score?: number): Promise<string | null> {
    try {
      const response = await fetch('/api/engie-encouragement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ overallPageTone: tone, overallScore: score }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error from encouragement API:', errorData.error || 'Unknown error');
        return null;
      }
      const data = await response.json();
      return data.message || null;
    } catch (error) {
      console.error('Failed to fetch encouragement message:', error);
      return null;
    }
  }

  async fetchTypoSuggestions(text: string): Promise<Suggestion[]> {
    try {
      const response = await fetch('/api/correct-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (!response.ok) {
        console.error('Failed to fetch suggestions from API');
        return [];
      }
      const data = await response.json();
      return data.suggestions || [];
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      return [];
    }
  }

  async fetchToneAnalysis(text: string): Promise<ToneAnalysis | null> {
    try {
      const response = await fetch('/api/check-tone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (!response.ok) {
        console.error('Failed to fetch tone analysis from API');
        return null;
      }
      const data = await response.json();
      return data || null;
    } catch (error) {
      console.error('Error fetching tone analysis:', error);
      return null;
    }
  }

  async callEngieChatAPI(prompt: string, currentHistory: ChatMessage[]): Promise<string | null> {
    try {
      const response = await fetch('/api/engie-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, history: currentHistory }),
      });
      if (!response.ok) {
        console.error('Failed to get response from Engie Chat API');
        return null;
      }
      const data = await response.json();
      return data.message || null;
    } catch (error) {
      console.error('Error calling Engie Chat API:', error);
      return null;
    }
  }

  async analyzeStyle(documentIds: string[]): Promise<void> {
    try {
      const response = await fetch('/api/style/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentIds }),
      });
      if (!response.ok) {
        throw new Error('Failed to analyze style');
      }
    } catch (error) {
      console.error('Error analyzing style:', error);
      throw error;
    }
  }
} 