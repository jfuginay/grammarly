import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id, email } = req.body;

    if (!id || !email) {
      return res.status(400).json({ error: 'Missing required fields: id and email' });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (existingUser) {
      return res.status(200).json({ message: 'User already exists', user: existingUser });
    }

    // Create new user
    const newUser = await prisma.user.create({
      data: {
        id,
        email,
      }
    });

    return res.status(201).json({ message: 'User created successfully', user: newUser });
  } catch (error) {
    console.error('Error creating user:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}