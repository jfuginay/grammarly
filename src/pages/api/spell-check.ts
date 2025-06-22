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
    console.log('API: Input text:', JSON.stringify(text));

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
          content: `You are a thorough spelling checker. Find ALL spelling errors in the provided text.

**INSTRUCTIONS:**
1. Find words that are spelled incorrectly or are incomplete/truncated
2. Look for missing letters, extra letters, or wrong letters
3. Flag words that appear to be typos or incomplete words
4. Include words that might be abbreviations but seem like spelling errors in context
5. Do NOT flag proper nouns, names, or obvious technical terms
6. Do NOT suggest grammar or style changes - ONLY spelling corrections

Return JSON with this structure:
{
  "suggestions": [
    {
      "original": "exact misspelled word from text",
      "suggestion": "correct spelling", 
      "explanation": "Brief explanation (max 15 words)",
      "type": "Spelling",
      "severity": "High"
    }
  ]
}

**Examples of what TO flag:**
- "recieve" → "receive" (i before e rule)
- "occured" → "occurred" (missing r)
- "seperate" → "separate" (wrong vowel)
- "definately" → "definitely" (wrong vowels)
- "ts" → "it's" (appears to be truncated word)
- "teh" → "the" (transposed letters)
- "spell" → "spell" (only if clearly wrong in context)

**Examples of what NOT to flag:**
- Proper nouns (John, Microsoft, etc.)
- Clear technical terms (API, JSON, etc.)
- Obvious abbreviations in technical context

If no spelling errors found, return: {"suggestions": []}

Analyze carefully - look for any words that seem incomplete or misspelled!`
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
    console.log('API: Full OpenAI response:', responseContent);

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
    console.log('API: Full parsed result:', JSON.stringify(result, null, 2));
    
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