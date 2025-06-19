import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import { setCorsHeaders } from '@/lib/cors';

interface Suggestion {
  original: string;
  suggestion: string;
  explanation: string;
  type: 'Spelling' | 'Grammar' | 'Style' | 'Punctuation' | 'Clarity';
  severity: 'High' | 'Medium' | 'Low';
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
  setCorsHeaders(res, req.headers.origin);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { text } = req.body;

    if (typeof text !== 'string') {
      return res.status(400).json({ message: 'Text must be a string.' });
    }

    // Don't run on empty or very short text
    if (text.trim().length < 5) {
      return res.status(200).json({ suggestions: [] });
    }

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

    if (!responseContent) {
      return res.status(500).json({ message: 'Failed to get a valid response from the assistant.' });
    }

    // The response is already expected to be a JSON object with the correct structure.
    const result = JSON.parse(responseContent);

    return res.status(200).json(result);

  } catch (error) {
    console.error('Error in text correction API:', error);
    // Be careful not to expose internal error details to the client
    if (error instanceof OpenAI.APIError) {
        return res.status(error.status || 500).json({ message: 'An error occurred with the AI service.' });
    }
    return res.status(500).json({ message: 'An internal server error occurred.' });
  }
} 