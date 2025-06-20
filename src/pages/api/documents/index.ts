import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { setCorsHeaders } from '@/lib/cors'; // Import setCorsHeaders

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set CORS headers for all responses
  setCorsHeaders(res, req.headers.origin);

  // Handle OPTIONS preflight request
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const token = req.cookies.auth_token;

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized: No token provided.' });
  }

  let userId;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    userId = decoded.userId;
    if (!userId) {
      // This case should ideally be caught by jwt.verify if userId is essential in the token
      // or by schema validation of the token payload.
      throw new Error('User ID not found in token payload.');
    }
  } catch (error: any) {
    console.error('Authentication error:', error.message);
    // Differentiate between token verification errors and missing userId
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Unauthorized: Invalid or expired token.' });
    }
    return res.status(401).json({ message: `Unauthorized: ${error.message}` });
  }

  if (req.method === 'GET') {
    try {
      const documents = await prisma.document.findMany({
        where: { authorId: userId },
        orderBy: { updatedAt: 'desc' },
      });
      return res.status(200).json(documents);
    } catch (error) {
      console.error('Error fetching documents:', error);
      return res.status(500).json({ message: 'Internal server error while fetching documents.' });
    }
  }

  if (req.method === 'POST') {
    const { title, content } = req.body;

    // Validate title
    if (!title || typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({ message: 'Title is required and must be a non-empty string.' });
    }

    const documentContent = typeof content === 'string' ? content : ''; // Default content to empty string if not provided or not a string

    try {
      const newDocument = await prisma.document.create({
        data: {
          title: title.trim(), // Use trimmed title
          content: documentContent,
          authorId: userId, // Ensure userId is correctly passed
        },
      });
      return res.status(201).json(newDocument);
    } catch (error) {
      console.error('Error creating document:', error);
      // Check for specific Prisma errors if necessary, e.g., unique constraint violation
      // if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      //   return res.status(409).json({ message: 'A document with this title already exists.' });
      // }
      return res.status(500).json({ message: 'Internal server error while creating the document.' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST', 'OPTIONS']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
} 