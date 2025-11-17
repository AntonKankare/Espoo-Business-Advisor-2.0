import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { generateSummaryFromTranscript, type AdvisorSummary, type ChatMessage } from '@/lib/openai';

const RequestSchema = z.object({
  sessionId: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { sessionId } = parsed.data;

    const session = await prisma.businessIdeaSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    let transcript: ChatMessage[] = [];
    try {
      if (session.rawTranscript) {
        transcript = JSON.parse(session.rawTranscript) as ChatMessage[];
        if (!Array.isArray(transcript)) transcript = [];
      }
    } catch {
      transcript = [];
    }
    if (!Array.isArray(transcript) || transcript.length === 0) {
      return NextResponse.json(
        { error: 'Transcript is empty. Cannot generate summary yet.' },
        { status: 400 }
      );
    }

    const summary: AdvisorSummary = await generateSummaryFromTranscript({
      transcript,
      userFirstName: session.firstName ?? undefined,
      userLastName: session.lastName ?? undefined,
    });

    const updated = await prisma.businessIdeaSession.update({
      where: { id: session.id },
      data: {
        whatSell: summary.whatSell,
        toWhom: summary.toWhom,
        how: summary.how,
        companyFormSuggestion: summary.companyFormSuggestion,
        companyFormReasoning: summary.companyFormReasoning,
        keyQuestionsForAdvisor: summary.keyQuestionsForAdvisor,
        specialTopics: summary.specialTopics,
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
    console.error('POST /api/summary error', err);
    const message = typeof err?.message === 'string' ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


