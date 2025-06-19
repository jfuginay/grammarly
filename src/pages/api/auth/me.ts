import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end('Method Not Allowed');
  }

  const token = req.cookies.auth_token;

  if (!token) {
    return res.status(401).json({ message: 'Not authenticated.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string, email: string };
    
    // Optional: Fetch fresh user data from DB if needed
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true }, // Don't send password hash
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    return res.status(200).json({ user });

  } catch (error) {
    console.error('Me endpoint error:', error);
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
} 