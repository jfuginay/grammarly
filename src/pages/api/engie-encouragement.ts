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

  const { overallPageTone, overallScore } = req.body;

  if (!overallPageTone || typeof overallPageTone !== 'string') {
    return res.status(400).json({ message: 'overallPageTone (string) is required.' });
  }
  if (overallScore !== undefined && typeof overallScore !== 'number') {
    return res.status(400).json({ message: 'overallScore must be a number if provided.' });
  }

  let scoreInfo = "The confidence score for this tone was not provided.";
  if (typeof overallScore === 'number') {
    scoreInfo = `The confidence score for this tone is ${overallScore.toFixed(2)} out of 1.`;
  }

  const systemPrompt = `You are Engie, a friendly and supportive AI writing assistant.
The user is writing on a page that has an overall tone of: "${overallPageTone}".
${scoreInfo}

Your task is to provide a very short (1, maximum 2 sentences), positive, and encouraging comment for the user.
- If the tone is generally positive (e.g., 'Friendly', 'Confident', 'Joyful', 'Optimistic', 'Assertive', 'Happy'), affirm it or offer a light compliment. Example: "Your writing is coming across as very [overallPageTone], that's great!" or "Nice! The [overallPageTone] tone really shines through."
- If the tone is neutral (e.g., 'Neutral', 'Formal', 'Analytical', 'Objective', 'Informative'), offer general encouragement for their writing process. Example: "Keep up the great work, your focus is clear!" or "Looking good, that's a well-structured piece."
- If the tone is generally negative (e.g., 'Critical', 'Stressed', 'Anxious', 'Frustrated', 'Sad', 'Worried', 'Serious' but in a negative context), offer gentle support or a positive perspective, without being dismissive. Example: "Writing can be tough, but you're making progress!" or "Remember to be kind to yourself as you write. You've got this!" or "It's okay if it feels challenging, keep going!"
- Do not be repetitive. Keep your messages varied if this system is called multiple times for similar tones.
- Focus on encouragement related to their writing or creative process.
- Do not ask questions. Provide a statement.
- Make sure your response is just the encouraging message, no extra pleasantries or self-introduction.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // Using gpt-3.5-turbo for speed and cost-effectiveness
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        // No explicit user message is needed here as the system prompt contains all context.
        // Alternatively, a very short user message could be: "User is writing."
        {
            role: "user",
            content: `Current page tone: ${overallPageTone}.` // Simple user message to give context if system prompt isn't dynamic enough or for logging.
        }
      ],
      temperature: 0.8, // Slightly higher temperature for more varied encouragements
      max_tokens: 50,   // Encouragement should be short
      n: 1,             // We only need one message
    });

    const encouragementMessage = completion.choices[0].message.content?.trim();

    if (!encouragementMessage) {
      return res.status(500).json({ message: 'Failed to generate an encouragement message.' });
    }

    res.status(200).json({ encouragementMessage });

  } catch (error) {
    console.error('Error in Engie encouragement API:', error);
    if (error instanceof OpenAI.APIError) {
        return res.status(error.status || 500).json({ message: 'An error occurred with the AI service.' });
    }
    return res.status(500).json({ message: 'An internal server error occurred.' });
  }
}
