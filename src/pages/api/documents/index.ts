import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Get the JWT from the Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized - No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized - Invalid token format' });
    }
    
    // Verify the token (in a real app, this would be done properly with Auth0 validation)
    try {
      // This is a simplified approach - in production, validate with Auth0 properly
      const decoded = jwt.decode(token);
      if (!decoded || typeof decoded !== 'object' || !decoded.sub) {
        return res.status(401).json({ error: 'Unauthorized - Invalid token' });
      }
      
      const userId = decoded.sub;
      
      // Handle different HTTP methods
      switch (req.method) {
        case 'GET':
          // Get all documents for the authenticated user
          const documents = await prisma.document.findMany({
            where: {
              authorId: userId // Assuming your schema has authorId field
            },
            orderBy: {
              updatedAt: 'desc'
            }
          });
          return res.status(200).json(documents);
          
        case 'POST':
          // Create a new document
          const { title, content } = req.body;
          const newDocument = await prisma.document.create({
            data: {
              title: title || 'Untitled Document',
              content: content || '',
              authorId: userId // Assuming your schema has authorId field
            }
          });
          return res.status(201).json(newDocument);
          
        default:
          return res.status(405).json({ error: 'Method not allowed' });
      }
    } catch (tokenError) {
      console.error('Token validation error:', tokenError);
      return res.status(401).json({ error: 'Unauthorized - Token validation failed' });
    }
  } catch (error) {
    console.error('Error processing document request:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}