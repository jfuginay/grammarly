import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { setCorsHeaders } from '@/lib/cors';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  setCorsHeaders(res, req.headers.origin);

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
      throw new Error('User ID not found in token payload.');
    }
  } catch (error: any) {
    console.error('Authentication error:', error.message);
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Unauthorized: Invalid or expired token.' });
    }
    return res.status(401).json({ message: `Unauthorized: ${error.message}` });
  }

  const { id: documentId } = req.query;

  if (!documentId || typeof documentId !== 'string') {
    return res.status(400).json({ message: 'Document ID is required.' });
  }

  if (req.method === 'GET') {
    try {
      const document = await prisma.document.findUnique({
        where: { id: documentId },
      });

      if (!document) {
        return res.status(404).json({ message: 'Document not found.' });
      }

      if (document.authorId !== userId) {
        // Return 404 instead of 403 to avoid leaking information about document existence
        return res.status(404).json({ message: 'Document not found (or access denied).' });
      }

      return res.status(200).json(document);
    } catch (error) {
      console.error(`Error fetching document ${documentId}:`, error);
      return res.status(500).json({ message: 'Internal server error while fetching the document.' });
    }
  } else if (req.method === 'PUT') {
    const { title, content } = req.body;

    // Validate inputs
    if (title === undefined && content === undefined) {
      return res.status(400).json({ message: 'At least one field (title or content) must be provided for update.' });
    }
    if (title !== undefined && typeof title === 'string' && title.trim() === '') {
      return res.status(400).json({ message: 'Title cannot be empty.' });
    }
    // Content can be an empty string

    const updateData: { title?: string; content?: string; updatedAt: Date } = {
      updatedAt: new Date(),
    };
    if (title !== undefined) {
      updateData.title = title;
    }
    if (content !== undefined) {
      updateData.content = content;
    }

    try {
      const updatedDocument = await prisma.document.update({
        where: { id: documentId, authorId: userId }, // Atomically check ownership and update
        data: updateData,
      });
      return res.status(200).json(updatedDocument);
    } catch (error: any) {
      console.error(`Error updating document ${documentId}:`, error);
      if (error.code === 'P2025') { // Prisma error code for "Record to update not found."
        return res.status(404).json({ message: 'Document not found or you do not have permission to update it.' });
      }
      return res.status(500).json({ message: 'Internal server error while updating the document.' });
    }
  } else if (req.method === 'DELETE') {
    try {
      await prisma.document.delete({
        where: { id: documentId, authorId: userId }, // Atomically check ownership and delete
      });
      return res.status(204).end(); // Successfully deleted
    } catch (error: any) {
      console.error(`Error deleting document ${documentId}:`, error);
      if (error.code === 'P2025') { // Prisma error code for "Record to delete not found."
        // This error occurs if the document doesn't exist or if the authorId doesn't match.
        return res.status(404).json({ message: 'Document not found or you do not have permission to delete it.' });
      }
      return res.status(500).json({ message: 'Internal server error while deleting the document.' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'PUT', 'DELETE', 'OPTIONS']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}