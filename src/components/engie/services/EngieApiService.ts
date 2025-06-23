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
      console.log('Engie: Fetching suggestions for text length:', text.length);
      const response = await fetch('/api/correct-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      
      console.log('Engie: Suggestions API response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Engie: Failed to fetch suggestions from API. Status:', response.status, 'Error:', errorText);
        return [];
      }
      
      const data = await response.json();
      console.log('Engie: Received suggestions:', data.suggestions?.length || 0);
      return data.suggestions || [];
    } catch (error) {
      console.error('Engie: Error fetching suggestions:', error);
      return [];
    }
  }

  async fetchToneAnalysis(text: string): Promise<ToneAnalysis | null> {
    try {
      console.log('Engie: Fetching tone analysis for text length:', text.length);
      
      // Firefox-specific headers and fetch options
      const isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      
      // Firefox sometimes has issues with certain header configurations
      if (isFirefox) {
        headers['Cache-Control'] = 'no-cache';
      }
      
      const response = await fetch('/api/check-tone', {
        method: 'POST',
        headers,
        body: JSON.stringify({ text }),
        // Firefox-specific fetch options
        ...(isFirefox && {
          credentials: 'same-origin',
          mode: 'cors'
        })
      });
      
      console.log('Engie: Tone API response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Engie: Failed to fetch tone analysis from API. Status:', response.status, 'Error:', errorText);
        return null;
      }
      
      const data = await response.json();
      console.log('Engie: Received tone analysis:', data);
      return data || null;
    } catch (error) {
      console.error('Engie: Error fetching tone analysis:', error);
      // Firefox-specific error handling
      const isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
      if (isFirefox && error instanceof TypeError && error.message.includes('NetworkError')) {
        console.error('Engie: Firefox network error detected, retrying...');
        // Retry once for Firefox network issues
        try {
          const retryResponse = await fetch('/api/check-tone', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text }),
            credentials: 'same-origin'
          });
          if (retryResponse.ok) {
            const retryData = await retryResponse.json();
            return retryData || null;
          }
        } catch (retryError) {
          console.error('Engie: Firefox retry also failed:', retryError);
        }
      }
      return null;
    }
  }

  async callEngieChatAPI(prompt: string, currentHistory: ChatMessage[]): Promise<string | null> {
    try {
      const response = await fetch('/api/engie-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: prompt, history: currentHistory }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to get response from Engie Chat API. Status:', response.status, 'Error:', errorText);
        return null;
      }
      const data = await response.json();
      return data.reply || null;
    } catch (error) {
      console.error('Error calling Engie Chat API:', error);
      return null;
    }
  }

  async sendGrokChat(message: string, chatHistory: ChatMessage[]): Promise<string | null> {
    try {
      console.log('Engie: Sending Grok chat message via API');
      const response = await fetch('/api/grok-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message,
          chatHistory 
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Engie: Failed to send Grok chat. Status:', response.status, 'Error:', errorText);
        return null;
      }
      
      const data = await response.json();
      return data.response || null;
    } catch (error) {
      console.error('Engie: Error sending Grok chat:', error);
      return null;
    }
  }
}