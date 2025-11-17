import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const password = body?.password as string | undefined;
    if (!password) {
      return NextResponse.json({ error: 'Password required' }, { status: 400 });
    }
    const expected = process.env.ADVISOR_DASHBOARD_PASSWORD;
    if (!expected) {
      return NextResponse.json(
        { error: 'Server misconfiguration: ADVISOR_DASHBOARD_PASSWORD missing' },
        { status: 500 }
      );
    }
    if (password !== expected) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}


