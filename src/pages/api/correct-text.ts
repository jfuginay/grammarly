import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ message: 'Text is required' });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a professional writing assistant. Analyze the given text for grammar, spelling, and style issues. Return a JSON array of suggestions, where each suggestion has: type ('spelling', 'grammar', or 'style'), text (the original text), replacement (the corrected text), explanation (why the change is needed), startIndex (where the issue starts), endIndex (where the issue ends), and severity ('error', 'warning', or 'suggestion')."
        },
        {
          role: "user",
          content: text
        }
      ],
      response_format: { type: "json_object" }
    });

    const suggestions = JSON.parse(completion.choices[0].message.content).suggestions;
    return res.status(200).json({ suggestions });
  } catch (error) {
    console.error('Error in text correction:', error);
    return res.status(500).json({ message: 'Error processing text correction' });
  }
} 