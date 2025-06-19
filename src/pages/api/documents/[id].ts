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

  const { id } = req.query;

  // Fetch the document first to ensure it exists and belongs to the user.
  const document = await prisma.document.findUnique({
    where: { id: String(id) },
  });

  if (!document) {
    return res.status(404).json({ message: 'Document not found.' });
  }

  if (document.authorId !== userId) {
    return res.status(403).json({ message: 'Forbidden: You do not own this document.' });
  }

  if (req.method === 'PUT') {
    const { title, content } = req.body;
    const updatedDocument = await prisma.document.update({
      where: { id: String(id) },
      data: { 
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
      },
    });
    return res.status(200).json(updatedDocument);
  }

  if (req.method === 'DELETE') {
    await prisma.document.delete({
      where: { id: String(id) },
    });
    return res.status(204).end();
  }

  res.setHeader('Allow', ['PUT', 'DELETE']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
} 