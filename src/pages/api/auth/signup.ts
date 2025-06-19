import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  if (typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: 'User with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        email: email,
        passwordHash: passwordHash,
      },
    });

    return res.status(201).json({ message: 'User created successfully.', user: { id: newUser.id, email: newUser.email } });

  } catch (error) {
    console.error('Signup error:', error);
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
        return res.status(409).json({ message: 'A user with this email already exists.' });
    }
    return res.status(500).json({ message: 'Internal Server Error' });
  }
} 