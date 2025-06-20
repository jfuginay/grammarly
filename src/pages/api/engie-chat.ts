import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import { setCorsHeaders } from '@/lib/cors';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  setCorsHeaders(res, req.headers.origin);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({ message: 'Message is required.' });
    }

    const systemPrompt = `You are Engie, a friendly, patient, and encouraging AI writing assistant. Your goal is to help users overcome writer's block and develop their ideas.

- Your personality is cheerful, supportive, and emotionally expressive.
- You adapt your emotional tone based on context:
  * When users are doing well: You're excited and enthusiastic
  * When users need encouragement: You're warm, supportive and reassuring
  * When users are struggling: You're empathetic and patient
  * When analyzing complex writing: You're thoughtful and focused
- You are great at brainstorming and asking gentle, probing questions to help the user think through their ideas.
- Keep your responses concise and conversational.
- Use markdown for formatting if it helps clarify things (e.g., lists).
- If the user seems stuck, offer a starting point or a simple prompt like "What if we started with...?" or "Tell me more about..."
- You are here to help them write, not to write for them. Guide, don't dictate.
- Express your emotions in your responses (excitement, thoughtfulness, concern, happiness) when appropriate.`;

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: systemPrompt,
      },
      // Add previous conversation history if it exists
      ...(history || []),
      {
        role: "user",
        content: message,
      },
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: messages,
      temperature: 0.7,
    });

    const responseContent = completion.choices[0].message.content;

    if (!responseContent) {
      return res.status(500).json({ message: 'Failed to get a valid response from Engie.' });
    }

    res.status(200).json({ reply: responseContent });

  } catch (error) {
    console.error('Error in Engie chat API:', error);
    if (error instanceof OpenAI.APIError) {
        return res.status(error.status || 500).json({ message: 'An error occurred with the AI service.' });
    }
    return res.status(500).json({ message: 'An internal server error occurred.' });
  }
} 