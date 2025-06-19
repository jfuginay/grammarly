import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import OpenAI from 'openai';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

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

  try {
    const documents = await prisma.document.findMany({
      where: {
        authorId: userId,
        isStyleSample: true,
      },
    });

    if (documents.length === 0) {
      return res.status(400).json({ message: 'No style samples found. Please mark at least one document as a style sample.' });
    }

    const writingSamples = documents.map(doc => doc.content).join('\\n\\n---\\n\\n');
    
    const systemPrompt = `You are an expert writing analyst. Analyze the following writing samples to determine the author's unique voice, tone, and style. 
    
    Provide a concise summary (2-3 sentences) of the overall style.
    
    Analyze the following characteristics:
    - Formality: (e.g., Formal, Informal, Conversational)
    - Vocabulary: (e.g., Simple, Sophisticated, Technical, Jargon-heavy)
    - Sentence Structure: (e.g., Short and direct, Long and complex, Varied)
    - Tone: (e.g., Humorous, Serious, Optimistic, Academic, Assertive)
    
    Based on your analysis, provide a summary of the author's style. This summary will be used to generate adaptive writing suggestions.
    
    Return the analysis as a JSON object with the following structure: { "summary": "...", "formality": "...", "vocabulary": "...", "sentenceStructure": "...", "tone": "..." }`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Here are the writing samples:\\n\\n${writingSamples}` }
      ],
      response_format: { type: "json_object" },
    });

    const analysisResult = completion.choices[0].message.content;

    if (!analysisResult) {
      return res.status(500).json({ message: 'Failed to get a valid response from the AI.' });
    }

    const parsedResult = JSON.parse(analysisResult);

    await prisma.styleProfile.upsert({
      where: { userId },
      update: {
        summary: parsedResult.summary,
        // In a real app, you'd save all the other fields here too
        updatedAt: new Date(),
      },
      create: {
        userId,
        summary: parsedResult.summary,
      },
    });

    res.status(200).json({ message: 'Style profile updated successfully.', profile: parsedResult });

  } catch (error) {
    console.error('Error in style analysis API:', error);
    res.status(500).json({ message: 'An internal server error occurred.' });
  }
} 