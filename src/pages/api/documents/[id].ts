import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (req.method === 'PUT') {
    const { title, content } = req.body;
    const document = await prisma.document.update({
      where: { id: String(id) },
      data: { title, content },
    });
    return res.status(200).json(document);
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