import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Supabase logic removed. Implement new document API logic here.
  res.status(501).json({ error: 'Not implemented (Supabase removed)' });
}