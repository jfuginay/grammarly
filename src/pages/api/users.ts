import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { setCorsHeaders } from '@/lib/cors';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const origin = req.headers.origin;
  setCorsHeaders(res, origin);

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id, email } = req.body;

    if (!id || !email) {
      return res.status(400).json({ error: 'Missing required fields: id and email' });
    }

    // Use upsert to create or update user
    const user = await prisma.user.upsert({
      where: { id },
      update: {
        email, // Update email in case it changed
      },
      create: {
        id,
        email,
      }
    });

    return res.status(200).json({ 
      message: user ? 'User created/updated successfully' : 'User already exists', 
      user 
    });

  } catch (error) {
    console.error('Error creating/updating user:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}