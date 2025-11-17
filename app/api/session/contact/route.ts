import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';

const ContactSchema = z.object({
  sessionId: z.string().min(1),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(5),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
  municipality: z.string().min(1),
});

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const sessionId = url.searchParams.get('sessionId');
    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId required' }, { status: 400 });
    }
    const session = await prisma.businessIdeaSession.findUnique({
      where: { id: sessionId },
      select: {
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        dateOfBirth: true,
        municipality: true,
      },
    });
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    const complete =
      !!session.firstName &&
      !!session.lastName &&
      !!session.email &&
      !!session.phone &&
      !!session.dateOfBirth &&
      !!session.municipality;
    return NextResponse.json({ complete, contact: session });
  } catch (err: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const json = await req.json().catch(() => null);
    const parsed = ContactSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
    }
    const { sessionId, firstName, lastName, email, phone, dateOfBirth, municipality } = parsed.data;
    const dob = new Date(dateOfBirth + 'T00:00:00.000Z');
    const updated = await prisma.businessIdeaSession.update({
      where: { id: sessionId },
      data: {
        firstName,
        lastName,
        email,
        phone,
        dateOfBirth: dob,
        municipality,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        dateOfBirth: true,
        municipality: true,
      },
    });
    return NextResponse.json({ ok: true, contact: updated });
  } catch (err: any) {
    if (err?.code === 'P2025') {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}


