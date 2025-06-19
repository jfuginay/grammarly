import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import { setCorsHeaders } from '@/lib/cors';

interface Suggestion {
  id?: string;
  original: string;
  suggestion: string;
  explanation: string;
  type: 'Spelling' | 'Grammar' | 'Style' | 'Punctuation' | 'Clarity';
  severity: 'High' | 'Medium' | 'Low';
  startIndex?: number;
  endIndex?: number;
}

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

interface TextFragment {
  text: string;
  startIndex: number;
  endIndex: number;
  type: 'word' | 'phrase' | 'punctuation' | 'space' | 'paragraph';
  partOfSpeech?: string;
}

interface TextAnalysis {
  fragments: TextFragment[];
}

interface ApiResponse {
  suggestions: Suggestion[];
  toneAnalysis?: ToneAnalysis;
  textAnalysis?: TextAnalysis;
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

// Helper function to calculate character positions for suggestions
function addIndicesToSuggestions(text: string, suggestions: Suggestion[]): Suggestion[] {
  return suggestions.map((suggestion, index) => {
    // First generate an ID if not present
    if (!suggestion.id) {
      suggestion.id = `suggestion-${Date.now()}-${index}`;
    }
    
    // Only calculate indices if they're not already present
    if (suggestion.startIndex === undefined || suggestion.endIndex === undefined) {
      const occurrences = findAllOccurrences(text, suggestion.original);
      
      // If we found the text, use the first occurrence
      // In a more sophisticated version, we could try to find the most relevant occurrence
      if (occurrences.length > 0) {
        suggestion.startIndex = occurrences[0];
        suggestion.endIndex = occurrences[0] + suggestion.original.length;
      }
    }
    
    return suggestion;
  });
}

// Basic text analysis function
function analyzeText(text: string): TextAnalysis {
  // In a production app, we would use an NLP library like compromise, natural, or nlp.js
  // For this demo, we'll use a simple regex-based approach
  const fragments: TextFragment[] = [];
  
  // Regular expression to match words, punctuation, spaces, and newlines
  const tokenRegex = /(\w+|\s+|[^\w\s]+)/g;
  let match;
  
  while ((match = tokenRegex.exec(text)) !== null) {
    const token = match[0];
    const startIndex = match.index;
    const endIndex = startIndex + token.length;
    
    // Determine the type of fragment
    let type: TextFragment['type'] = 'word';
    let partOfSpeech: string | undefined = undefined;
    
    if (/^\s+$/.test(token)) {
      type = token.includes('\n') ? 'paragraph' : 'space';
    } else if (/^\w+$/.test(token)) {
      type = 'word';
      
      // More comprehensive part-of-speech "guessing"
      if (token.endsWith('ly')) {
        partOfSpeech = 'adverb';
      } else if (token.endsWith('ed')) {
        partOfSpeech = 'verb'; // past tense verb
      } else if (token.endsWith('ing')) {
        partOfSpeech = 'verb'; // present participle
      } else if (['the', 'a', 'an'].includes(token.toLowerCase())) {
        partOfSpeech = 'article';
      } else if (['is', 'am', 'are', 'was', 'were', 'be', 'been', 'do', 'does', 'did', 'have', 'has', 'had', 'can', 'could', 'will', 'would', 'shall', 'should', 'may', 'might', 'must'].includes(token.toLowerCase())) {
        partOfSpeech = 'verb';
      } else if (['in', 'on', 'at', 'by', 'for', 'with', 'about', 'against', 'between', 'through', 'during', 'before', 'after', 'above', 'below', 'to', 'from', 'up', 'down', 'into', 'onto'].includes(token.toLowerCase())) {
        partOfSpeech = 'preposition';
      } else if (['and', 'but', 'or', 'nor', 'for', 'yet', 'so'].includes(token.toLowerCase())) {
        partOfSpeech = 'conjunction';
      } else if (['this', 'that', 'these', 'those', 'my', 'your', 'his', 'her', 'its', 'our', 'their'].includes(token.toLowerCase())) {
        partOfSpeech = 'determiner';
      } else if (['i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them'].includes(token.toLowerCase())) {
        partOfSpeech = 'pronoun';
      } else if (token.endsWith('ful') || token.endsWith('ous') || token.endsWith('ible') || token.endsWith('able') || token.endsWith('al') || token.endsWith('ive') || token.endsWith('ic') || token.endsWith('ary')) {
        partOfSpeech = 'adjective';
      } else {
        // Default case - just guess noun
        partOfSpeech = 'noun';
      }
    } else if (/^[^\w\s]+$/.test(token)) {
      type = 'punctuation';
    }
    
    fragments.push({
      text: token,
      startIndex,
      endIndex,
      type,
      partOfSpeech
    });
  }
  
  // Try to identify phrases after tokenizing
  identifyPhrases(text, fragments);
  
  return { fragments };
}

// Function to identify common phrases
function identifyPhrases(text: string, fragments: TextFragment[]): void {
  // Sort fragments by start index for phrase detection
  fragments.sort((a, b) => a.startIndex - b.startIndex);
  
  // Look for common phrase patterns
  
  // Prepositional phrases (preposition + noun phrase)
  for (let i = 0; i < fragments.length - 2; i++) {
    if (
      fragments[i].partOfSpeech === 'preposition' &&
      (fragments[i+1].partOfSpeech === 'article' || fragments[i+1].partOfSpeech === 'determiner' || fragments[i+1].partOfSpeech === 'adjective') &&
      fragments[i+2].partOfSpeech === 'noun'
    ) {
      const startIndex = fragments[i].startIndex;
      const endIndex = fragments[i+2].endIndex;
      
      fragments.push({
        text: text.substring(startIndex, endIndex),
        startIndex,
        endIndex,
        type: 'phrase',
        partOfSpeech: 'prepositional_phrase'
      });
    }
  }
  
  // Verb phrases (verb + adverb)
  for (let i = 0; i < fragments.length - 1; i++) {
    if (
      fragments[i].partOfSpeech === 'verb' &&
      fragments[i+1].partOfSpeech === 'adverb'
    ) {
      const startIndex = fragments[i].startIndex;
      const endIndex = fragments[i+1].endIndex;
      
      fragments.push({
        text: text.substring(startIndex, endIndex),
        startIndex,
        endIndex,
        type: 'phrase',
        partOfSpeech: 'verb_phrase'
      });
    }
  }
  
  // Noun phrases (article/determiner + adjective? + noun)
  for (let i = 0; i < fragments.length - 2; i++) {
    if (
      (fragments[i].partOfSpeech === 'article' || fragments[i].partOfSpeech === 'determiner') &&
      fragments[i+1].partOfSpeech === 'adjective' &&
      fragments[i+2].partOfSpeech === 'noun'
    ) {
      const startIndex = fragments[i].startIndex;
      const endIndex = fragments[i+2].endIndex;
      
      fragments.push({
        text: text.substring(startIndex, endIndex),
        startIndex,
        endIndex,
        type: 'phrase',
        partOfSpeech: 'noun_phrase'
      });
    }
  }
  
  // Simpler noun phrases (article/determiner + noun)
  for (let i = 0; i < fragments.length - 1; i++) {
    if (
      (fragments[i].partOfSpeech === 'article' || fragments[i].partOfSpeech === 'determiner') &&
      fragments[i+1].partOfSpeech === 'noun'
    ) {
      const startIndex = fragments[i].startIndex;
      const endIndex = fragments[i+1].endIndex;
      
      fragments.push({
        text: text.substring(startIndex, endIndex),
        startIndex,
        endIndex,
        type: 'phrase',
        partOfSpeech: 'noun_phrase'
      });
    }
  }
}

// Helper function to fetch tone analysis
async function fetchToneAnalysis(text: string): Promise<ToneAnalysis | null> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/check-tone`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    
    if (!response.ok) {
      console.error('Error fetching tone analysis:', response.statusText);
      return null;
    }
    
    const toneAnalysis = await response.json();
    
    // Process highlighted sentences to ensure they have indices
    if (toneAnalysis.highlightedSentences) {
      toneAnalysis.highlightedSentences = toneAnalysis.highlightedSentences.map((highlight: ToneAnalysisHighlight) => {
        if (highlight.startIndex === undefined || highlight.endIndex === undefined) {
          const sentenceIndex = text.indexOf(highlight.sentence);
          if (sentenceIndex >= 0) {
            highlight.startIndex = sentenceIndex;
            highlight.endIndex = sentenceIndex + highlight.sentence.length;
          }
        }
        return highlight;
      });
    }
    
    return toneAnalysis;
  } catch (error) {
    console.error('Error in tone analysis:', error);
    return null;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse | { message: string }>
) {
  console.log('API: correct-text endpoint called');
  console.log('API: OpenAI API key present:', !!process.env.OPENAI_API_KEY);
  console.log('API: OpenAI API key length:', process.env.OPENAI_API_KEY?.length || 0);
  console.log('API: Available env vars:', Object.keys(process.env).filter(key => key.includes('OPENAI') || key.includes('VERCEL')));
  
  setCorsHeaders(res, req.headers.origin);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { text } = req.body;
    console.log('API: Received text length:', text?.length || 0);

    if (typeof text !== 'string') {
      console.log('API: Invalid text type:', typeof text);
      return res.status(400).json({ message: 'Text must be a string.' });
    }

    // Don't run on empty or very short text
    if (text.trim().length < 5) {
      console.log('API: Text too short, returning empty suggestions');
      return res.status(200).json({ suggestions: [] });
    }

    // Run suggestions and tone analysis in parallel
    const [suggestionsResult, toneAnalysis] = await Promise.all([
      // Get suggestions
      (async () => {
        console.log('API: Making OpenAI call for suggestions');
        const completion = await openai.chat.completions.create({
          model: "gpt-4-turbo",
          messages: [
            {
              role: "system",
              content: `You are an expert writing assistant and proofreader. Analyze the user's text and provide actionable suggestions to improve it.

Your task is to identify errors and suggest improvements in spelling, grammar, punctuation, style, and clarity.

You MUST return a JSON object with this exact structure:
{
  "suggestions": [
    {
      "original": "The exact text fragment from the user's input that has an issue.",
      "suggestion": "Your corrected version of the fragment.",
      "explanation": "A concise, helpful explanation of why the change is necessary.",
      "type": "Spelling | Grammar | Punctuation | Style | Clarity",
      "severity": "High | Medium | Low"
    }
  ]
}

**Rules & Guidelines:**
1.  **Exact Matches:** The "original" field MUST be an exact substring from the user's text. Do not paraphrase or change it.
2.  **Severity Levels:**
    -   **High:** Use for clear errors (e.g., misspellings like "definately", major grammatical mistakes like subject-verb agreement).
    -   **Medium:** Use for less critical grammar, punctuation issues (e.g., comma splices), or awkward phrasing.
    -   **Low:** Use for stylistic improvements, conciseness, or minor clarity enhancements.
3.  **Suggestion Types:**
    -   **Spelling:** Obvious typos and misspelled words.
    -   **Grammar:** Errors in sentence structure, tense, etc.
    -   **Punctuation:** Incorrect or missing punctuation.
    -   **Style:** Wordiness, passive voice, awkward phrasing.
    -   **Clarity:** Sentences that are confusing or ambiguous.
4.  **Be thorough but not pedantic.** Focus on suggestions that genuinely improve the quality of the writing.
5.  **Do not suggest changes for correct text.** If there are no issues, return an empty "suggestions" array.
6.  **Provide diverse suggestions.** Look for a range of issues, not just spelling. For example, find missing apostrophes in contractions (e.g., "its" -> "it's") or common punctuation errors.
7.  **Keep explanations user-friendly.** Explain the 'why' behind the suggestion clearly and briefly.
8. If the text has no errors, return: {"suggestions": []}`
            },
            {
              role: "user",
              content: text
            }
          ],
          response_format: { type: "json_object" }
        });

        const responseContent = completion.choices[0].message.content;
        console.log('API: OpenAI response received, content length:', responseContent?.length || 0);

        if (!responseContent) {
          console.log('API: No response content from OpenAI');
          return { suggestions: [] };
        }

        // The response is already expected to be a JSON object with the correct structure.
        const result = JSON.parse(responseContent);
        console.log('API: Parsed result, suggestions count:', result.suggestions?.length || 0);
        
        // Add indices to suggestions
        result.suggestions = addIndicesToSuggestions(text, result.suggestions || []);
        
        return result;
      })(),
      
      // Get tone analysis
      fetchToneAnalysis(text)
    ]);

    // Perform text analysis
    const textAnalysis = analyzeText(text);

    // Combine results
    const combinedResponse: ApiResponse = {
      suggestions: suggestionsResult.suggestions || [],
      toneAnalysis: toneAnalysis || undefined,
      textAnalysis: textAnalysis
    };

    return res.status(200).json(combinedResponse);

  } catch (error) {
    console.error('API: Error in text correction API:', error);
    // Be careful not to expose internal error details to the client
    if (error instanceof OpenAI.APIError) {
        return res.status(error.status || 500).json({ message: 'An error occurred with the AI service.' });
    }
    return res.status(500).json({ message: 'An internal server error occurred.' });
  }
}