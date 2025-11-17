import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';

const ConfirmSchema = z.object({
  sessionId: z.string().min(1),
  whatSell: z.string().optional().default(''),
  toWhom: z.string().optional().default(''),
  how: z.string().optional().default(''),
  companyFormSuggestion: z.string().optional().default(''),
  companyFormReasoning: z.string().optional().default(''),
  keyQuestionsForAdvisor: z.string().optional().default(''),
  specialTopics: z.string().optional().default(''),
});

export async function POST(req: Request) {
  try {
    const json = await req.json().catch(() => null);
    const parsed = ConfirmSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
    }
    const {
      sessionId,
      whatSell,
      toWhom,
      how,
      companyFormSuggestion,
      companyFormReasoning,
      keyQuestionsForAdvisor,
      specialTopics,
    } = parsed.data;

    const updated = await prisma.businessIdeaSession.update({
      where: { id: sessionId },
      data: {
        whatSell,
        toWhom,
        how,
        companyFormSuggestion,
        companyFormReasoning,
        keyQuestionsForAdvisor,
        specialTopics,
      },
      select: {
        id: true,
        whatSell: true,
        toWhom: true,
        how: true,
        companyFormSuggestion: true,
        companyFormReasoning: true,
        keyQuestionsForAdvisor: true,
        specialTopics: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    if (err?.code === 'P2025') {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}


