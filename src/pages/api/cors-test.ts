import { NextApiRequest, NextApiResponse } from 'next';
import { setCorsHeaders } from '@/lib/cors';
import { generateCorsTestReport } from '@/utils/cors-test';

interface CorsTestResponse {
  success: boolean;
  origin: string;
  allowed: boolean;
  timestamp: string;
  testReport?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CorsTestResponse | { message: string }>
) {
  const origin = req.headers.origin || 'unknown';
  setCorsHeaders(res, origin);

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const includeReport = req.query.report === 'true';
    
    const response: CorsTestResponse = {
      success: true,
      origin,
      allowed: true, // If we got here, the origin was allowed
      timestamp: new Date().toISOString(),
    };

    if (includeReport) {
      response.testReport = generateCorsTestReport();
    }

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error in CORS test endpoint:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
