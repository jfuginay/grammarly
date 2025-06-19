import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only show in development environment
  if (process.env.NODE_ENV !== 'development') {
    return res.status(404).json({ error: 'Not found' });
  }

  // Redact sensitive information but show the structure and first few characters
  const safeEnv = {
    AUTH0_SECRET: process.env.AUTH0_SECRET ? '✓ Set (first chars: ' + process.env.AUTH0_SECRET.substring(0, 3) + '...)' : '✗ Not set',
    AUTH0_BASE_URL: process.env.AUTH0_BASE_URL,
    AUTH0_ISSUER_BASE_URL: process.env.AUTH0_ISSUER_BASE_URL,
    AUTH0_CLIENT_ID: process.env.AUTH0_CLIENT_ID ? '✓ Set (first chars: ' + process.env.AUTH0_CLIENT_ID.substring(0, 3) + '...)' : '✗ Not set',
    AUTH0_CLIENT_SECRET: process.env.AUTH0_CLIENT_SECRET ? '✓ Set (first chars: ' + process.env.AUTH0_CLIENT_SECRET.substring(0, 3) + '...)' : '✗ Not set',
    AUTH0_SCOPE: process.env.AUTH0_SCOPE,
    AUTH0_AUDIENCE: process.env.AUTH0_AUDIENCE,
    NODE_ENV: process.env.NODE_ENV,
  };

  res.status(200).json(safeEnv);
}
