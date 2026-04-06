import { NextRequest, NextResponse } from 'next/server';
import {
  verifyGroupPassword,
  isGroupConfigured,
  signGroupToken,
  groupCookieOptions,
  checkGroupRateLimit,
} from '@/lib/group-auth';

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (!checkGroupRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Too many attempts. Try again later.' },
      { status: 429 }
    );
  }

  const body = await request.json();
  const { group, password } = body;

  if (!group || typeof group !== 'string') {
    return NextResponse.json({ error: 'Group is required' }, { status: 400 });
  }

  if (!isGroupConfigured(group)) {
    return NextResponse.json({ error: 'Group not found' }, { status: 404 });
  }

  if (!password || !verifyGroupPassword(group, password)) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  }

  const token = signGroupToken(group);
  const response = NextResponse.json({ ok: true, group });
  response.cookies.set(groupCookieOptions(token));
  return response;
}
