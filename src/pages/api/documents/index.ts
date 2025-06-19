import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = req.cookies.auth_token;

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized: No token provided.' });
  }

  let userId;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    userId = decoded.userId;
  } catch (error) {
    return res.status(401).json({ message: 'Unauthorized: Invalid token.' });
  }

  if (req.method === 'GET') {
    const documents = await prisma.document.findMany({
      where: { authorId: userId },
      orderBy: { updatedAt: 'desc' },
    });
    return res.status(200).json(documents);
  }

  if (req.method === 'POST') {
    const { title, content } = req.body;
    const newDocument = await prisma.document.create({
      data: {
        title: title || 'Untitled Document',
        content: content || '',
        authorId: userId,
      },
    });
    return res.status(201).json(newDocument);
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
} 