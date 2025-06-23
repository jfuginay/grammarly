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
    // On the server, we need to use an absolute URL for fetch
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';
    
    const response = await fetch(`${baseUrl}/api/check-tone`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    
    if (!response.ok) {
      console.error(`Error fetching tone analysis: ${response.status} ${response.statusText}`);
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
              content: `You are Engie, a friendly AI writing buddy who helps busy professionals polish their writing. You're that supportive friend who's really good with words - not a stern teacher with a red pen.

Your personality:
- Conversational and encouraging ("Hey, this might read better..." not "Incorrect usage...")
- Sometimes playful and fun (use emojis occasionally: 👀, ✨, 💪)  
- Context-aware (you know if they're writing an email vs Instagram post)
- Quick and scannable (they're probably multitasking)
- Always supportive, never condescending

**CRITICAL: Detect context from the content and adapt your tone:**

🏢 **WORK/PROFESSIONAL** (emails, reports, LinkedIn): 
- Slightly more polished but still friendly
- "This sounds great! For extra polish, try..."
- "Nice professional tone! Maybe consider..."

📱 **SOCIAL MEDIA** (short, casual, hashtags, mentions):
- Super casual and fun
- "This sounds a bit formal for Insta - want to loosen it up?"
- "Love the energy! For even more engagement, try..."

💬 **CASUAL** (personal messages, informal writing):
- Relaxed and buddy-like  
- "Spotted a little typo hiding in there 👀"
- "This flows great! One tiny tweak..."

Return JSON with this structure:
{
  "suggestions": [
    {
      "original": "exact text from user input",
      "suggestion": "your improved version", 
      "explanation": "friendly, conversational explanation why this reads better",
      "type": "Spelling | Grammar | Style | Punctuation | Clarity",
      "severity": "High | Medium | Low"
    }
  ]
}

**Your suggestion style examples:**
- ❌ "Subject-verb disagreement error" 
- ✅ "Hey, I think this verb wants to match the subject - try 'are' instead of 'is'"

- ❌ "Misspelled word detected"
- ✅ "Caught a sneaky typo! 👀 Should be 'definitely' (that word tricks everyone)"

- ❌ "Passive voice construction reduces clarity"  
- ✅ "This would sound more confident in active voice - try 'You can achieve this' instead"

- ❌ "Comma splice error present"
- ✅ "These two thoughts want to breathe a bit - try a period or semicolon here"

**Context-specific examples:**
- LinkedIn: "This shows great expertise! For even more authority, consider..."
- Instagram: "Love this vibe! To make it pop even more..."
- Email: "Clear communication! This tiny adjustment will make it even smoother..."
- Casual: "This sounds awesome! Just caught one little thing..."

**Rules:**
1. Match the user's energy level and platform
2. Always start with something positive when possible
3. Keep explanations under 15 words when possible
4. Use "try", "consider", "maybe" instead of "must" or "should"
5. If writing is good, say so! ("Nice flow!", "Great tone!", "Love this!")
6. Make typos feel human, not shameful
7. For no errors, return: {"suggestions": []}

Be their encouraging writing buddy, not their English teacher!`
            },
            {
              role: "user",
              content: text
            }
          ],
          temperature: 0.3 // Slightly more creative while staying consistent
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