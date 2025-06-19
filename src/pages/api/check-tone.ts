import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import { setCorsHeaders } from '@/lib/cors';

interface ToneAnalysisHighlight {
  sentence: string;
  tone: string;
  score: number;
  startIndex?: number;
  endIndex?: number;
}

interface ToneAnalysis {
  overallTone: string;
  overallScore: number;
  highlightedSentences: ToneAnalysisHighlight[];
}

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
      "sentence": "The sentence or phrase to highlight.",
      "tone": "The specific tone of this sentence (e.g., 'Formal', 'Confident').",
      "score": 0.9 // Add this: AI's confidence in the tone for this specific sentence, a number between 0 and 1.
    }
  ]
}
Analyze the text and identify up to 3-5 key sentences or phrases that most strongly contribute to the overall tone.
For the "overallTone", provide an "overallScore" which is a number between 0 and 1 representing your confidence in this assessment.
For each highlighted sentence, provide the "sentence", its specific "tone", and a "score" (a number between 0 and 1) representing your confidence in the tone identified for that specific sentence.
IMPORTANT: The "sentence" must be an exact substring from the original text, not paraphrased.
Ensure your response is only the JSON object.`;

// Helper function to find all occurrences of a substring in text
function findAllOccurrences(text: string, substring: string): number[] {
  const indices: number[] = [];
  let index = text.indexOf(substring);
  
  while (index !== -1) {
    indices.push(index);
    index = text.indexOf(substring, index + 1);
  }
  
  return indices;
}

// Add indices to the highlighted sentences
function addIndicesToHighlights(text: string, highlights: ToneAnalysisHighlight[]): ToneAnalysisHighlight[] {
  return highlights.map(highlight => {
    // Only calculate indices if they're not already present
    if (highlight.startIndex === undefined || highlight.endIndex === undefined) {
      const occurrences = findAllOccurrences(text, highlight.sentence);
      
      // If we found the text, use the first occurrence
      if (occurrences.length > 0) {
        highlight.startIndex = occurrences[0];
        highlight.endIndex = occurrences[0] + highlight.sentence.length;
      }
    }
    
    return highlight;
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log('API: check-tone endpoint called');
  console.log('API: OpenAI API key present:', !!process.env.OPENAI_API_KEY);
  console.log('API: OpenAI API key length:', process.env.OPENAI_API_KEY?.length || 0);
  
  setCorsHeaders(res, req.headers.origin);
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
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
    
    if (!responseContent) {
      console.log('API: No response content from OpenAI for tone analysis');
      return res.status(500).json({ message: 'No response from OpenAI' });
    }
    
    const analysis = JSON.parse(responseContent || '{}') as ToneAnalysis;
    console.log('API: Parsed tone analysis:', analysis.overallTone);
    
    // Add indices to highlighted sentences
    if (analysis.highlightedSentences) {
      analysis.highlightedSentences = addIndicesToHighlights(text, analysis.highlightedSentences);
    }

    res.status(200).json(analysis);
  } catch (error: any) {
    console.error('API: Error analyzing tone:', error);
    console.error('API: Error details:', {
      name: error?.name,
      message: error?.message,
      stack: error?.stack
    });
    
    if (error instanceof OpenAI.APIError) {
      console.error('API: OpenAI API Error details:', {
        status: error.status,
        code: error.code,
        type: error.type
      });
      return res.status(error.status || 500).json({ message: 'OpenAI API Error' });
    }
    
    res.status(500).json({ message: 'Internal Server Error' });
  }
}