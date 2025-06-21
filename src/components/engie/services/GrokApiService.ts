import { Groq } from 'groq-sdk';
import { ChatMessage } from '../types'; // Assuming ChatMessage is compatible or we'll adjust

// Interface for Groq SDK's expected message format if different from internal ChatMessage
// For groq-sdk, messages are typically: { role: 'user' | 'assistant' | 'system', content: string }
// We'll assume ChatMessage matches this for now.

const MODEL_NAME = 'mixtral-8x7b-32768'; // Or any other model you prefer

export class GrokApiService {
  private static instance: GrokApiService;
  private groq: Groq | null = null;
  private apiKeyLoaded: boolean = false;

  constructor(apiKey?: string) {
    const effectiveApiKey = apiKey || process.env.GROQ_API_KEY || "";
    
    if (effectiveApiKey && effectiveApiKey.length > 0) {
      console.log("GrokApiService: GROQ_API_KEY is loaded. Length:", effectiveApiKey.length);
      try {
        this.groq = new Groq({ apiKey: effectiveApiKey });
        this.apiKeyLoaded = true;
        console.log("GrokApiService: Groq SDK initialized successfully.");
      } catch (error: any) {
        console.error("GrokApiService: Failed to initialize Groq SDK:", error.message);
        this.groq = null;
      }
    } else {
      console.warn("GrokApiService: GROQ_API_KEY is NOT SET or empty. GrokApiService will not function properly.");
      this.groq = null;
    }
  }

  public static getInstance(): GrokApiService {
    if (!GrokApiService.instance) {
      GrokApiService.instance = new GrokApiService();
    }
    return GrokApiService.instance;
  }
  
  public setApiKey(apiKey: string): void {
    if (apiKey && apiKey.length > 0) {
      try {
        this.groq = new Groq({ apiKey });
        this.apiKeyLoaded = true;
        console.log("GrokApiService: API key set and Groq SDK re-initialized.");
      } catch (error: any) {
        console.error("GrokApiService: Failed to re-initialize Groq SDK with new key:", error.message);
        this.groq = null;
        this.apiKeyLoaded = false;
      }
    } else {
      console.warn("GrokApiService: Attempted to set an empty API key.");
      this.groq = null;
      this.apiKeyLoaded = false;
    }
  }

  private async makeApiCall(messages: Groq.Chat.Completions.ChatCompletionMessageParam[]): Promise<string | null> {
    if (!this.groq || !this.apiKeyLoaded) {
      console.error("GrokApiService: SDK not initialized or API key missing. Cannot make API call.");
      return null;
    }

    try {
      const chatCompletion = await this.groq.chat.completions.create({
        messages,
        model: MODEL_NAME,
        // temperature: 0.7, // Optional: add other parameters if needed
        // max_tokens: 1024, // Optional
      });

      const content = chatCompletion.choices[0]?.message?.content;
      if (content) {
        return content.trim();
      } else {
        console.error("GrokApiService: API response did not contain expected content:", chatCompletion);
        return null;
      }
    } catch (error: any) {
      console.error("GrokApiService: Error calling Groq API:", error.message);
      if (error instanceof Groq.APIError) {
        console.error("Grok APIError Details:", {
          status: error.status,
          headers: error.headers,
          error: error.error,
        });
      }
      return null;
    }
  }

  /**
   * Send a full chat history to Grok for multi-turn chat. Returns the assistant's response.
   * Assumes ChatMessage[] is compatible with Groq.Chat.Completions.ChatCompletionMessageParam[]
   */
  public async sendChat(messages: ChatMessage[]): Promise<string | null> {
    // Ensure messages conform to Groq.Chat.Completions.ChatCompletionMessageParam[]
    // This might require a mapping if ChatMessage type is different.
    // For now, assuming direct compatibility.
    const groqMessages: Groq.Chat.Completions.ChatCompletionMessageParam[] = messages.map(m => ({
        role: m.role as 'user' | 'assistant' | 'system', // Add necessary type assertion or mapping
        content: m.content
    }));
    return this.makeApiCall(groqMessages);
  }

  /**
   * Get an opinionated comment on text from Grok
   */
  public async getOpinionatedComment(prompt: string): Promise<string | null> {
    const messages: Groq.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'user', content: prompt }
    ];
    return this.makeApiCall(messages);
  }

  /**
   * Research a topic using Grok
   */
  public async researchTopic(topic: string): Promise<string | null> {
    const messages: Groq.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'user', content: `Research the following topic: ${topic}` }
    ];
    return this.makeApiCall(messages);
  }
}
