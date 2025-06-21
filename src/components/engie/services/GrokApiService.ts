import { ChatMessage } from '../types';
import Groq from 'groq-sdk';

// Basic types for Grok API
interface GrokApiRequest {
  messages: ChatMessage[];
  model: string;
  // Add other parameters like temperature, max_tokens if needed
}

interface GrokApiResponse {
  choices: Array<{
    message: {
      content: string;
    };
    // Add other relevant fields like finish_reason
  }>;
  // Add other response fields if necessary
}

const DEFAULT_MODEL = 'mixtral-8x7b-32768';

export class GrokApiService {
  private static instance: GrokApiService;
  private apiKey: string;
  private groqClient: Groq | null = null;

  constructor(apiKey?: string) {
    // Only attempt to access environment variables on the server
    if (typeof window === 'undefined') {
      this.apiKey = apiKey || process.env.GROQ_API_KEY || "";
      
      if (!this.apiKey) {
        console.warn("GROQ_API_KEY is not set. GrokApiService will not function properly.");
      } else {
        this.groqClient = new Groq({ apiKey: this.apiKey });
      }
    } else {
      // We're on the client, don't try to access server-only environment variables
      // Set apiKey to empty but don't warn, as this is expected behavior for client-side
      this.apiKey = "";
    }
  }

  public static getInstance(): GrokApiService {
    if (!GrokApiService.instance) {
      GrokApiService.instance = new GrokApiService();
    }
    return GrokApiService.instance;
  }
  
  public setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
    this.groqClient = new Groq({ apiKey });
  }

  /**
   * Send a full chat history to Grok for multi-turn chat. Returns the assistant's response.
   */
  public async sendChat(messages: ChatMessage[]): Promise<string | null> {
    // Check if we're on the client-side
    if (typeof window !== 'undefined') {
      console.error("Grok API cannot be called from client-side. Use a server-side API route instead.");
      return null;
    }
    
    if (!this.apiKey || !this.groqClient) {
      console.error("Grok API key not configured. Cannot send chat.");
      return null;
    }

    try {
      const completion = await this.groqClient.chat.completions.create({
        messages,
        model: DEFAULT_MODEL,
        temperature: 0.6,
        max_completion_tokens: 32768,
        top_p: 0.95,
        stream: false,
      });

      if (completion.choices && completion.choices.length > 0 && completion.choices[0].message) {
        return completion.choices[0].message.content || null;
      } else {
        console.error("Grok API response for chat did not contain expected content:", completion);
        return null;
      }
    } catch (error) {
      console.error("Error sending chat to Grok API:", error);
      return null;
    }
  }

  /**
   * Get an opinionated comment on text from Grok
   */
  public async getOpinionatedComment(prompt: string): Promise<string | null> {
    // Check if we're on the client-side
    if (typeof window !== 'undefined') {
      console.error("Grok API cannot be called from client-side. Use a server-side API route instead.");
      return null;
    }
    
    if (!this.apiKey || !this.groqClient) {
      console.error("Grok API key not configured. Cannot fetch opinionated comment.");
      return null;
    }

    try {
      const completion = await this.groqClient.chat.completions.create({
        messages: [
          { role: 'user', content: prompt }
        ],
        model: DEFAULT_MODEL,
        temperature: 0.7,
        max_completion_tokens: 32768,
        top_p: 0.95,
        stream: false,
      });

      if (completion.choices && completion.choices.length > 0 && completion.choices[0].message) {
        return completion.choices[0].message.content || null;
      } else {
        console.error("Grok API response for opinionated comment did not contain expected content:", completion);
        return null;
      }
    } catch (error) {
      console.error("Error fetching opinionated comment from Grok API:", error);
      return null;
    }
  }

  /**
   * Research a topic using Grok
   */
  public async researchTopic(topic: string): Promise<string | null> {
    // Check if we're on the client-side
    if (typeof window !== 'undefined') {
      console.error("Grok API cannot be called from client-side. Use a server-side API route instead.");
      return null;
    }
    
    if (!this.apiKey || !this.groqClient) {
      console.error("Grok API key not configured. Cannot research topic.");
      return null;
    }

    try {
      const completion = await this.groqClient.chat.completions.create({
        messages: [
          { role: 'user', content: `Research the following topic: ${topic}` }
        ],
        model: DEFAULT_MODEL,
        temperature: 0.5,
        max_completion_tokens: 32768,
        top_p: 0.95,
        stream: false,
      });

      if (completion.choices && completion.choices.length > 0 && completion.choices[0].message) {
        return completion.choices[0].message.content || null;
      } else {
        console.error("Grok API response for research did not contain expected content:", completion);
        return null;
      }
    } catch (error) {
      console.error("Error researching topic with Grok API:", error);
      return null;
    }
  }
}
