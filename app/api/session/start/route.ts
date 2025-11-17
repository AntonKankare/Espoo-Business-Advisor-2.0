import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';

const BodySchema = z.object({
  uiLanguage: z.string().min(1),
  userLanguage: z.string().optional().nullable(),
  // Accept but ignore hasDocuments for now unless the DB has the field
  hasDocuments: z.boolean().optional(),
});

export async function POST(req: Request) {
  try {
    const json = await req.json().catch(() => null);
    const parsed = BodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
    }
    const { uiLanguage, userLanguage } = parsed.data;
    const session = await prisma.businessIdeaSession.create({
      data: {
        uiLanguage,
        userLanguage: userLanguage ?? uiLanguage,
      },
      select: { id: true },
    });
    return NextResponse.json({ sessionId: session.id });
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}


