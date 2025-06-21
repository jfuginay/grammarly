import { NextApiRequest, NextApiResponse } from 'next';
import { GrokApiService } from '@/components/engie/services/GrokApiService';
import { ChatMessage } from '@/components/engie/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, chatHistory } = req.body;
    
    if (!message || !Array.isArray(chatHistory)) {
      return res.status(400).json({ error: 'Invalid request body' });
    }
    
    // Initialize Grok API service with server-side environment variable
    const grokApiService = GrokApiService.getInstance();
    
    // Send the entire chat history to get a contextual response
    const updatedChatHistory: ChatMessage[] = [
      ...chatHistory,
      { role: 'user', content: message }
    ];
    
    const response = await grokApiService.sendChat(updatedChatHistory);
    
    if (!response) {
      return res.status(500).json({ error: 'Failed to get response from Grok API' });
    }
    
    return res.status(200).json({ response });
  } catch (error) {
    console.error('Error processing Grok chat request:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
