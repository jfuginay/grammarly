import { NextApiRequest, NextApiResponse } from 'next';
import { GrokApiService } from '@/components/engie/services/GrokApiService';
import { setCorsHeaders } from '@/lib/cors';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  setCorsHeaders(res, req.headers.origin);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed, please use GET.' });
  }

  try {
    console.log("Attempting to get GrokApiService instance...");
    const grokService = GrokApiService.getInstance();
    console.log("GrokApiService instance obtained.");

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.error("test-grok API: GROQ_API_KEY is not set in environment.");
      return res.status(500).json({ message: "GROQ_API_KEY is not configured on the server." });
    }
    // Optionally re-set or confirm API key if needed for testing, though getInstance should handle it.
    // grokService.setApiKey(apiKey);


    console.log("Attempting to call grokService.researchTopic('latest AI trends')...");
    const researchResult = await grokService.researchTopic('latest AI trends');
    console.log("grokService.researchTopic call finished.");

    if (researchResult) {
      console.log("Research result received:", researchResult);
      return res.status(200).json({ success: true, data: researchResult });
    } else {
      console.error("test-grok API: Failed to get research result from GrokApiService. The service returned null.");
      return res.status(500).json({ success: false, message: 'Failed to get research result from Grok. Check server logs for GrokApiService errors.' });
    }
  } catch (error: any) {
    console.error('Error in test-grok API route:', error);
    return res.status(500).json({ success: false, message: 'An internal server error occurred in test-grok.', error: error.message });
  }
}
