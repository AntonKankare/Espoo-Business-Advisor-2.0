import { NextResponse } from 'next/server';
import { z } from 'zod';
import { translateMessages, type ChatMessage } from '@/lib/openai';

const BodySchema = z.object({
  targetLanguage: z.string().min(1),
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string(),
    })
  ),
});

export async function POST(req: Request) {
  try {
    const json = await req.json().catch(() => null);
    const parsed = BodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
    }
    const { targetLanguage, messages } = parsed.data;
    const translated: ChatMessage[] = await translateMessages({
      targetLanguage,
      messages,
    });
    return NextResponse.json({ messages: translated });
  } catch (err: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}


