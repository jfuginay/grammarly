  /**
   * Send a full chat history to Grok for multi-turn chat. Returns the assistant's response.
   */
  public async sendChat(messages: ChatMessage[]): Promise<string | null> {
    if (!this.apiKey) {
      console.error("Grok API key not configured. Cannot send chat.");
      return null;
    }

    const requestBody: GrokApiRequest = {
      messages,
      model: 'mixtral-8x7b-32768', // Use the same model as other methods
    };

    try {
      const response = await fetch(GROK_API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        console.error(`Grok API error for chat: ${response.status} ${response.statusText}`);
        const errorBody = await response.text();
        console.error("Error details:", errorBody);
        return null;
      }

      const data: GrokApiResponse = await response.json();

      if (data.choices && data.choices.length > 0 && data.choices[0].message) {
        return data.choices[0].message.content.trim();
      } else {
        console.error("Grok API response for chat did not contain expected content:", data);
        return null;
      }
    } catch (error) {
      console.error("Error sending chat to Grok API:", error);
      return null;
    }
  }
import { ChatMessage } from '../types';

// Basic types for Grok API (can be expanded later)
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

const GROK_API_ENDPOINT = 'https://api.groq.com/v1/chat/completions'; // Placeholder

export class GrokApiService {

  /**
   * Send a full chat history to Grok for multi-turn chat. Returns the assistant's response.
   */
  public async sendChat(messages: ChatMessage[]): Promise<string | null> {
    if (!this.apiKey) {
      console.error("Grok API key not configured. Cannot send chat.");
      return null;
    }

    const requestBody: GrokApiRequest = {
      messages,
      model: 'mixtral-8x7b-32768', // Use the same model as other methods
    };

    try {
      const response = await fetch(GROK_API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        console.error(`Grok API error for chat: ${response.status} ${response.statusText}`);
        const errorBody = await response.text();
        console.error("Error details:", errorBody);
        return null;
      }

      const data: GrokApiResponse = await response.json();

      if (data.choices && data.choices.length > 0 && data.choices[0].message) {
        return data.choices[0].message.content.trim();
      } else {
        console.error("Grok API response for chat did not contain expected content:", data);
        return null;
      }
    } catch (error) {
      console.error("Error sending chat to Grok API:", error);
      return null;
    }
  }
  private static instance: GrokApiService;
  private apiKey: string;

  private constructor() {
    this.apiKey = process.env.GROQ_API_KEY || "";

    if (!this.apiKey) {
      console.error("GROQ_API_KEY is not set in environment variables. GrokApiService will not function.");
      // Depending on desired behavior, you could throw an error here:
      // throw new Error("GROQ_API_KEY is not set.");
    }
  }

  public static getInstance(): GrokApiService {
    if (!GrokApiService.instance) {
      GrokApiService.instance = new GrokApiService();
    }
    return GrokApiService.instance;
  }

  public async getOpinionatedComment(prompt: string): Promise<string | null> {
    if (!this.apiKey) {
      console.error("Grok API key not configured. Cannot fetch opinionated comment.");
      return null;
    }

    const requestBody: GrokApiRequest = {
      messages: [
        { role: 'user', content: prompt },
        // Potentially add a system message here to guide Grok's "opinionated" style
        { role: 'system', content: 'You are an assistant that provides concise, witty, and slightly opinionated comments.' }
      ],
      model: 'mixtral-8x7b-32768', // Example model, replace with actual if known
    };

    try {
      const response = await fetch(GROK_API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        console.error(`Grok API error for opinionated comment: ${response.status} ${response.statusText}`);
        const errorBody = await response.text();
        console.error("Error details:", errorBody);
        return null;
      }

      const data: GrokApiResponse = await response.json();

      if (data.choices && data.choices.length > 0 && data.choices[0].message) {
        return data.choices[0].message.content.trim();
      } else {
        console.error("Grok API response for opinionated comment did not contain expected content:", data);
        return null;
      }
    } catch (error) {
      console.error("Error fetching opinionated comment from Grok API:", error);
      return null;
    }
  }

  public async researchTopic(topic: string): Promise<string | null> {
    if (!this.apiKey) {
      console.error("Grok API key not configured. Cannot research topic.");
      return null;
    }

    const requestBody: GrokApiRequest = {
      messages: [
        { role: 'user', content: `Research the following topic: ${topic}` },
        { role: 'system', content: 'You are a helpful research assistant. Provide a concise summary of the topic.' }
      ],
      model: 'mixtral-8x7b-32768', // Example model
    };

    try {
      const response = await fetch(GROK_API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        console.error(`Grok API error for research topic: ${response.status} ${response.statusText}`);
        const errorBody = await response.text();
        console.error("Error details:", errorBody);
        return null;
      }

      const data: GrokApiResponse = await response.json();

      if (data.choices && data.choices.length > 0 && data.choices[0].message) {
        return data.choices[0].message.content.trim();
      } else {
        console.error("Grok API response for research topic did not contain expected content:", data);
        return null;
      }
    } catch (error) {
      console.error("Error researching topic with Grok API:", error);
      return null;
    }
  }
}
