import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import { setCorsHeaders } from '@/lib/cors';

interface Suggestion {
  id: string;
  type: 'spelling' | 'grammar' | 'style';
  text: string;
  replacement: string;
  explanation: string;
  startIndex: number;
  endIndex: number;
  severity: 'error' | 'warning' | 'suggestion';
}

interface ApiResponse {
  suggestions: Suggestion[];
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse | { message: string }>
) {
  const origin = req.headers.origin;
  setCorsHeaders(res, origin);

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ message: 'Text is required' });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        {
          role: "system",
          content: `You are a professional writing assistant focused on catching typos and spelling errors. Analyze the given text for grammar, spelling, and style issues. 

Return a JSON object with this exact structure:
{
  "suggestions": [
    {
      "type": "spelling|grammar|style",
      "text": "original problematic text",
      "replacement": "corrected text",
      "explanation": "explanation of why this change is needed",
      "severity": "error|warning|suggestion"
    }
  ]
}

Rules:
- Prioritize finding spelling mistakes and typos
- Use "spelling" for misspelled words and obvious typos
- Use "grammar" for grammatical errors
- Use "style" for style improvements
- Use "error" severity for spelling mistakes and serious grammar errors
- Use "warning" severity for minor grammar issues
- Use "suggestion" severity for style improvements
- Return the EXACT text as it appears in the original (including capitalization and punctuation)
- Be more aggressive in catching typos and spelling mistakes
- Look for common typing errors like:
  * Transposed letters (e.g., "teh" -> "the")
  * Missing letters (e.g., "recieve" -> "receive")
  * Extra letters (e.g., "occured" -> "occurred")
  * Common homophones (e.g., "their" vs "there")
  * Common misspellings (e.g., "definately" -> "definitely")
- Provide clear, concise explanations for each suggestion
- Make sure the "text" field contains the exact problematic text as it appears in the original`
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

    const apiSuggestions = JSON.parse(responseContent).suggestions;
    
    // Calculate indices locally for better accuracy
    const suggestions: Suggestion[] = [];
    let usedIndices: number[] = []; // Track used positions to avoid duplicates
    
    apiSuggestions.forEach((apiSuggestion: any, index: number) => {
      const searchText = apiSuggestion.text;
      let startIndex = -1;
      let searchStart = 0;
      
      // Find the next occurrence that hasn't been used yet
      while (true) {
        const foundIndex = text.indexOf(searchText, searchStart);
        if (foundIndex === -1) break;
        
        // Check if this position overlaps with any used indices
        const endIndex = foundIndex + searchText.length;
        const overlaps = usedIndices.some(usedIndex => 
          (foundIndex <= usedIndex && usedIndex < endIndex) ||
          (usedIndex <= foundIndex && foundIndex < usedIndex + searchText.length)
        );
        
        if (!overlaps) {
          startIndex = foundIndex;
          // Mark this range as used
          for (let i = startIndex; i < endIndex; i++) {
            usedIndices.push(i);
          }
          break;
        }
        
        searchStart = foundIndex + 1;
      }
      
      if (startIndex !== -1) {
        suggestions.push({
          id: `api-${Date.now()}-${index}`,
          type: apiSuggestion.type,
          text: searchText,
          replacement: apiSuggestion.replacement,
          explanation: apiSuggestion.explanation,
          startIndex: startIndex,
          endIndex: startIndex + searchText.length,
          severity: apiSuggestion.severity
        });
      }
    });
    
    return res.status(200).json({ suggestions });
  } catch (error) {
    console.error('Error in text correction:', error);
    return res.status(500).json({ message: 'Error processing text correction' });
  }
} 