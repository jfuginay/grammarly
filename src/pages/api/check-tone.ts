import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const toneSystemPrompt = `You are a sophisticated writing assistant. Your task is to analyze the tone of the provided text.
Respond with a JSON object that has the following structure:
{
  "overallTone": "A one or two-word description of the dominant tone (e.g., 'Formal', 'Confident & Assertive', 'Friendly & Casual').",
  "toneScores": {
    "Formal": 0.8,
    "Friendly": 0.2,
    "Confident": 0.9,
    "Analytical": 0.6,
    "Optimistic": 0.7
  },
  "highlightedSentences": [
    {
      "text": "The sentence or phrase to highlight.",
      "tone": "The specific tone of this sentence (e.g., 'Formal', 'Confident').",
      "startIndex": 0,
      "endIndex": 25
    }
  ]
}
Analyze the text and identify up to 5 key sentences or phrases that most strongly contribute to the overall tone. For each, provide the text, the specific tone, and its start and end index in the original text.
The tone scores should be a rating from 0 to 1 for a few dominant tones you identify.
Ensure your response is only the JSON object.`;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ message: 'Text is required' });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [
        { role: 'system', content: toneSystemPrompt },
        { role: 'user', content: text },
      ],
      response_format: { type: 'json_object' },
    });

    const analysis = JSON.parse(completion.choices[0].message.content || '{}');

    res.status(200).json({ analysis });
  } catch (error) {
    console.error('Error analyzing tone:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
} 