import { NextRequest, NextResponse } from 'next/server';
import {
  identityCookieOptions,
  signIdentityToken,
} from '@/lib/identity';
import { upsertMember, getMember } from '@/lib/members';
import {
  deleteSignupCookieOptions,
  verifySignupToken,
  SIGNUP_COOKIE_NAME,
} from '@/lib/signup-token';
import { findGroupForInviteKey } from '@/lib/invite-keys';
import { RateLimiter } from '@/lib/auth-common';
import { safeRedirect } from '@/lib/oauth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const limiter = new RateLimiter();

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (!limiter.check(ip)) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
  }

  const token = request.cookies.get(SIGNUP_COOKIE_NAME)?.value;
  const claim = token ? verifySignupToken(token) : null;
  if (!claim) {
    return NextResponse.json({ error: 'expired' }, { status: 401 });
  }

  let body: { key?: string; redirect?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  }

  const key = typeof body.key === 'string' ? body.key.trim() : '';
  if (!key) return NextResponse.json({ error: 'invalid_key' }, { status: 400 });

  const group = findGroupForInviteKey(key);
  if (!group) return NextResponse.json({ error: 'invalid_key' }, { status: 401 });

  // Skip insert if a member somehow already exists (defense in depth).
  let member = await getMember(claim.email);
  if (!member) {
    member = await upsertMember({
      email: claim.email,
      name: claim.name || null,
      role: 'member',
      group_slug: group,
    });
    if (!member) {
      return NextResponse.json({ error: 'persist_failed' }, { status: 500 });
    }
  }

  const sessionToken = signIdentityToken({
    email: member.email,
    role: member.role,
    group: member.group_slug,
  });
  const target = safeRedirect(body.redirect);
  const response = NextResponse.json({ ok: true, redirect: target });
  response.cookies.set(identityCookieOptions(sessionToken));
  response.cookies.set(deleteSignupCookieOptions());
  return response;
}
