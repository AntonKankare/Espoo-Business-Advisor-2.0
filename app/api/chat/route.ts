import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { generateChatResponse, type ChatMessage } from '@/lib/openai';

const UiLanguageEnum = z.enum(['fi', 'en', 'sv', 'ar', 'ru', 'fa']);

const ChatMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().min(1),
});

const RequestSchema = z.object({
  sessionId: z.string().optional().nullable(),
  messages: z.array(ChatMessageSchema).min(1),
  uiLanguage: UiLanguageEnum,
  userLanguage: z.string().optional().nullable(),
  // Accept any phase string to allow evolution of the phase model (BASICS, IDEA, HOW, MONEY, SPECIAL, CONTACT, etc.)
  phase: z.string().optional().nullable(),
});

export async function POST(req: Request) {
  try {
    const json = await req.json().catch(() => null);
    const parse = RequestSchema.safeParse(json);
    if (!parse.success) {
      // Log validation details to aid debugging during development
      console.error('POST /api/chat invalid body', parse.error.flatten());
      return NextResponse.json(
        { error: 'Invalid request body', details: parse.error.flatten() },
        { status: 400 }
      );
    }

    const { sessionId, messages, uiLanguage, userLanguage, phase } = parse.data;

    // Resolve or create session
    let session =
      sessionId
        ? await prisma.businessIdeaSession.findUnique({ where: { id: sessionId } })
        : null;

    if (sessionId && !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (!session) {
      session = await prisma.businessIdeaSession.create({
        data: {
          uiLanguage, // now plain string in schema
          userLanguage: userLanguage ?? uiLanguage,
        },
      });
    } else if (userLanguage && !session.userLanguage) {
      // Fill userLanguage if we didn't have it before
      session = await prisma.businessIdeaSession.update({
        where: { id: session.id },
        data: { userLanguage },
      });
    }

    // Prepare and call OpenAI
    const normalizedMessages: ChatMessage[] = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const effectiveUserLanguage = userLanguage ?? session.userLanguage ?? uiLanguage;

    const ai = await generateChatResponse({
      messages: normalizedMessages,
      userLanguage: effectiveUserLanguage,
      uiLanguage,
      phase: phase ?? undefined,
    });

    const assistantMessage: ChatMessage = {
      role: 'assistant',
      content: ai.text,
    };

    // Append latest user + assistant messages to rawTranscript
    const lastUserMessage = normalizedMessages[normalizedMessages.length - 1];
    let existingTranscript: ChatMessage[] = [];
    try {
      if (session.rawTranscript) {
        existingTranscript = JSON.parse(session.rawTranscript) as ChatMessage[];
        if (!Array.isArray(existingTranscript)) existingTranscript = [];
      }
    } catch {
      existingTranscript = [];
    }
    const updatedTranscript = [...existingTranscript, lastUserMessage, assistantMessage];

    // Build updates: raw transcript, and optionally store onboarding answer into specialTopics
    const updates: any = {
      rawTranscript: JSON.stringify(updatedTranscript),
    };
    if ((phase === 'ONBOARDING' || phase === 'BASICS') && lastUserMessage?.role === 'user') {
      const existingSpecial = session.specialTopics ?? '';
      const onboardingLinePrefix = 'Company registration status:';
      const onboardingLine = `${onboardingLinePrefix} ${lastUserMessage.content}`;
      updates.specialTopics = existingSpecial
        ? `${existingSpecial}\n${onboardingLine}`
        : onboardingLine;
    }

    await prisma.businessIdeaSession.update({
      where: { id: session.id },
      data: updates,
    });

    return NextResponse.json({
      sessionId: session.id,
      assistantMessage,
    });
  } catch (err: any) {
    console.error('POST /api/chat error', err);
    const message = typeof err?.message === 'string' ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


