// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { setCorsHeaders } from '@/lib/cors';

type Data = {
  name: string;
  version: string;
};

// It's generally better to read this dynamically, but for simplicity in this step:
const appVersion = "0.1.0"; // From package.json

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>,
) {
  const origin = req.headers.origin;
  setCorsHeaders(res, origin);

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  res.status(200).json({ name: "Hello World", version: appVersion });
}
