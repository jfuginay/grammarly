import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(404).json({ error: 'Not found' });
  }

  try {
    // Test if the Auth0 issuer base URL is reachable
    let issuerStatus = 'Unknown';
    try {
      const issuerBaseURL = process.env.AUTH0_ISSUER_BASE_URL;
      if (issuerBaseURL) {
        const issuerResponse = await fetch(`${issuerBaseURL}/.well-known/openid-configuration`);
        issuerStatus = `${issuerResponse.status} ${issuerResponse.statusText}`;
      } else {
        issuerStatus = 'Error: AUTH0_ISSUER_BASE_URL is not defined';
      }
    } catch (error: any) {
      issuerStatus = `Error: ${error.message}`;
    }

    res.status(200).json({
      issuerStatus,
      env: {
        AUTH0_SECRET: process.env.AUTH0_SECRET ? '✓ Set' : '✗ Not set',
        AUTH0_BASE_URL: process.env.AUTH0_BASE_URL,
        AUTH0_ISSUER_BASE_URL: process.env.AUTH0_ISSUER_BASE_URL,
        AUTH0_CLIENT_ID: process.env.AUTH0_CLIENT_ID ? '✓ Set' : '✗ Not set',
        AUTH0_CLIENT_SECRET: process.env.AUTH0_CLIENT_SECRET ? '✓ Set' : '✗ Not set',
        AUTH0_SCOPE: process.env.AUTH0_SCOPE,
        AUTH0_AUDIENCE: process.env.AUTH0_AUDIENCE,
        NODE_ENV: process.env.NODE_ENV,
      }
    });
  } catch (error: any) {
    res.status(500).json({ 
      error: 'Debug failed', 
      message: error.message || 'Unknown error'
    });
  }
}
