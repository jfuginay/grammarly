import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // Only show non-sensitive environment variables
  const envInfo = {
    nodeEnv: process.env.NODE_ENV,
    hasOpenAIKey: !!process.env.OPENAI_API_KEY,
    openAIKeyLength: process.env.OPENAI_API_KEY?.length || 0,
    availableEnvVars: Object.keys(process.env).filter(key => 
      key.includes('VERCEL') || 
      key.includes('NODE') || 
      key.includes('NEXT') ||
      key.includes('ENV')
    ),
    timestamp: new Date().toISOString()
  };

  res.status(200).json(envInfo);
} 