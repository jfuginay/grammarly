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
          content: `You are a professional writing assistant. Analyze the given text for grammar, spelling, and style issues. 

Return a JSON object with this exact structure:
{
  "suggestions": [
    {
      "id": "unique-id",
      "type": "spelling|grammar|style",
      "text": "original problematic text",
      "replacement": "corrected text",
      "explanation": "explanation of why this change is needed",
      "startIndex": number,
      "endIndex": number,
      "severity": "error|warning|suggestion"
    }
  ]
}

Rules:
- Use "spelling" for misspelled words
- Use "grammar" for grammatical errors
- Use "style" for style improvements
- Use "error" severity for spelling mistakes and serious grammar errors
- Use "warning" severity for minor grammar issues
- Use "suggestion" severity for style improvements
- Calculate exact startIndex and endIndex positions in the original text
- Generate unique IDs for each suggestion
- Focus on finding actual typos and spelling mistakes`
        },
        {
          role: "user",
          content: text
        }
      ],
      response_format: { type: "json_object" }
    });

    const responseContent = completion.choices[0].message.content;

    if (!responseContent) {
      return res.status(500).json({ message: 'Failed to get a valid response from the assistant.' });
    }

    const suggestions = JSON.parse(responseContent).suggestions;
    return res.status(200).json({ suggestions });
  } catch (error) {
    console.error('Error in text correction:', error);
    return res.status(500).json({ message: 'Error processing text correction' });
  }
} 