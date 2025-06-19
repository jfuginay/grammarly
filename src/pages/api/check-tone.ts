import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const toneSystemPrompt = `You are a sophisticated writing assistant. Your task is to analyze the tone of the provided text.
Respond with a JSON object that has the following structure:
{
  "overallTone": "A one or two-word description of the dominant tone (e.g., 'Formal', 'Confident & Assertive', 'Friendly & Casual').",
  "overallScore": 0.85, // Add this: AI's confidence in the overallTone, a number between 0 and 1.
  "highlightedSentences": [
    {
      "text": "The sentence or phrase to highlight.",
      "tone": "The specific tone of this sentence (e.g., 'Formal', 'Confident').",
      "score": 0.9, // Add this: AI's confidence in the tone for this specific sentence, a number between 0 and 1.
      "startIndex": 0,
      "endIndex": 25
    }
  ]
}
Analyze the text and identify up to 3-5 key sentences or phrases that most strongly contribute to the overall tone.
For the "overallTone", provide an "overallScore" which is a number between 0 and 1 representing your confidence in this assessment.
For each highlighted sentence, provide the "text", its specific "tone", its start and end "startIndex" and "endIndex" in the original text, and a "score" (a number between 0 and 1) representing your confidence in the tone identified for that specific sentence.
Do not include the "toneScores" object that was previously requested.
Ensure your response is only the JSON object.`;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log('API: check-tone endpoint called');
  
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { text } = req.body;
  console.log('API: Received text length for tone analysis:', text?.length || 0);

  if (!text) {
    console.log('API: No text provided for tone analysis');
    return res.status(400).json({ message: 'Text is required' });
  }

  try {
    console.log('API: Making OpenAI call for tone analysis');
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [
        { role: 'system', content: toneSystemPrompt },
        { role: 'user', content: text },
      ],
      response_format: { type: 'json_object' },
    });

    const responseContent = completion.choices[0].message.content;
    console.log('API: OpenAI tone response received, content length:', responseContent?.length || 0);
    
    const analysis = JSON.parse(responseContent || '{}');
    console.log('API: Parsed tone analysis:', analysis.overallTone);

    res.status(200).json(analysis);
  } catch (error) {
    console.error('API: Error analyzing tone:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
} 