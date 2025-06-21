import { ChatMessage } from '../types';
import OpenAI from 'openai';

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

const GROK_API_ENDPOINT = 'https://api.groq.com/v1/chat/completions';
const DEFAULT_MODEL = 'mixtral-8x7b-32768';

export class GrokApiService {
  private static instance: GrokApiService;
  private apiKey: string;
  private openaiClient: OpenAI | null = null;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GROQ_API_KEY || "";
    
    if (!this.apiKey) {
      console.warn("GROQ_API_KEY is not set. GrokApiService will not function properly.");
    } else {
      this.openaiClient = new OpenAI({
        apiKey: this.apiKey,
        baseURL: 'https://api.groq.com/v1',
      });
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
    this.openaiClient = new OpenAI({
      apiKey,
      baseURL: 'https://api.groq.com/v1',
    });
  }

  /**
   * Send a full chat history to Grok for multi-turn chat. Returns the assistant's response.
   */
  public async sendChat(messages: ChatMessage[]): Promise<string | null> {
    if (!this.apiKey || !this.openaiClient) {
      console.error("Grok API key not configured. Cannot send chat.");
      return null;
    }

    try {
      const completion = await this.openaiClient.chat.completions.create({
        messages,
        model: DEFAULT_MODEL,
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
    if (!this.apiKey || !this.openaiClient) {
      console.error("Grok API key not configured. Cannot fetch opinionated comment.");
      return null;
    }

    try {
      const completion = await this.openaiClient.chat.completions.create({
        messages: [
          { role: 'user', content: prompt }
        ],
        model: DEFAULT_MODEL,
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
    if (!this.apiKey || !this.openaiClient) {
      console.error("Grok API key not configured. Cannot research topic.");
      return null;
    }

    try {
      const completion = await this.openaiClient.chat.completions.create({
        messages: [
          { role: 'user', content: `Research the following topic: ${topic}` }
        ],
        model: DEFAULT_MODEL,
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
