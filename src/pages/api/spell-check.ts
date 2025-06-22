import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import { setCorsHeaders } from '@/lib/cors';

interface SpellingSuggestion {
  id: string;
  original: string;
  suggestion: string;
  explanation: string;
  type: 'Spelling';
  severity: 'High' | 'Medium' | 'Low';
  startIndex?: number;
  endIndex?: number;
}

interface SpellCheckResponse {
  suggestions: SpellingSuggestion[];
  scanTime: number;
  nextScanIn: number; // seconds until next scan
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Helper function to add indices to suggestions
function addIndicesToSuggestions(text: string, suggestions: SpellingSuggestion[]): SpellingSuggestion[] {
  return suggestions.map(suggestion => {
    if (suggestion.startIndex !== undefined && suggestion.endIndex !== undefined) {
      return suggestion;
    }

    // Find the original text in the content
    const index = text.toLowerCase().indexOf(suggestion.original.toLowerCase());
    if (index !== -1) {
      return {
        ...suggestion,
        startIndex: index,
        endIndex: index + suggestion.original.length
      };
    }

    return suggestion;
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SpellCheckResponse | { message: string }>
) {
  console.log('API: spell-check endpoint called');
  
  setCorsHeaders(res, req.headers.origin);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const startTime = Date.now();

  try {
    const { text } = req.body;
    console.log('API: Received text length for spell check:', text?.length || 0);

    if (typeof text !== 'string') {
      console.log('API: Invalid text type:', typeof text);
      return res.status(400).json({ message: 'Text must be a string.' });
    }

    // Don't run on empty or very short text
    if (text.trim().length < 3) {
      console.log('API: Text too short, returning empty suggestions');
      const scanTime = Date.now() - startTime;
      return res.status(200).json({ 
        suggestions: [], 
        scanTime,
        nextScanIn: 3 
      });
    }

    console.log('API: Making OpenAI call for spell check with GPT-4o-mini');
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Most cost-effective model for spelling checks
      messages: [
        {
          role: "system",
          content: `You are a fast and efficient spelling checker. Your ONLY job is to find spelling errors in the provided text.

**CRITICAL INSTRUCTIONS:**
1. ONLY find actual spelling mistakes - words that are spelled incorrectly
2. Do NOT suggest grammar, style, punctuation, or clarity improvements
3. Do NOT flag proper nouns, names, or technical terms unless clearly misspelled
4. Do NOT flag contractions, informal language, or slang
5. Be conservative - only flag obvious spelling errors

Return JSON with this structure:
{
  "suggestions": [
    {
      "original": "exact misspelled word from text",
      "suggestion": "correct spelling", 
      "explanation": "Brief explanation (max 10 words)",
      "type": "Spelling",
      "severity": "High"
    }
  ]
}

**Examples of what TO flag:**
- "recieve" → "receive" 
- "occured" → "occurred"
- "seperate" → "separate"
- "definately" → "definitely"

**Examples of what NOT to flag:**
- Proper nouns (names, places, brands)
- Technical terms (API, JavaScript, etc.)
- Informal contractions (can't, won't, etc.)
- Regional spellings (color vs colour)

If no spelling errors found, return: {"suggestions": []}

Be fast and efficient - this runs every 3 seconds!`
        },
        {
          role: "user",
          content: text
        }
      ],
      temperature: 0.1, // Low temperature for consistent spelling corrections
      max_tokens: 1000, // Limit tokens to keep costs low
    });

    const responseContent = completion.choices[0].message.content;
    console.log('API: OpenAI spell check response received, content length:', responseContent?.length || 0);

    if (!responseContent) {
      console.log('API: No response content from OpenAI');
      const scanTime = Date.now() - startTime;
      return res.status(200).json({ 
        suggestions: [], 
        scanTime,
        nextScanIn: 3 
      });
    }

    const result = JSON.parse(responseContent);
    console.log('API: Parsed spell check result, suggestions count:', result.suggestions?.length || 0);
    
    // Add indices to suggestions and ensure they're all spelling type
    const suggestions = addIndicesToSuggestions(text, (result.suggestions || []).map((s: any) => ({
      ...s,
      id: `spell-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'Spelling' as const,
      severity: 'High' as const
    })));

    const scanTime = Date.now() - startTime;
    console.log('API: Spell check completed in', scanTime, 'ms');

    return res.status(200).json({
      suggestions,
      scanTime,
      nextScanIn: 3 // Next scan in 3 seconds
    });

  } catch (error) {
    console.error('API: Error in spell check API:', error);
    const scanTime = Date.now() - startTime;
    
    if (error instanceof OpenAI.APIError) {
      return res.status(error.status || 500).json({ message: 'An error occurred with the AI service.' });
    }
    return res.status(500).json({ message: 'An internal server error occurred.' });
  }
} 