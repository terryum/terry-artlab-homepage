import { NextResponse } from 'next/server';
import { deleteGroupCookieOptions } from '@/lib/group-auth';

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(deleteGroupCookieOptions());
  return response;
}
