import { NextRequest, NextResponse } from 'next/server';
import {
  exchangeCodeForTokens,
  getRedirectUri,
  safeRedirect,
  verifyGoogleIdToken,
  verifyState,
} from '@/lib/oauth';
import {
  identityCookieOptions,
  isBootstrapAdminEmail,
  signIdentityToken,
} from '@/lib/identity';
import { getMember, touchLastLogin, upsertMember } from '@/lib/members';
import { signSignupToken, signupCookieOptions } from '@/lib/signup-token';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const STATE_COOKIE = 'oauth-state';

function errorRedirect(origin: string, code: string): NextResponse {
  const url = new URL('/login', origin);
  url.searchParams.set('error', code);
  const response = NextResponse.redirect(url);
  response.cookies.set({ name: STATE_COOKIE, value: '', maxAge: 0, path: '/' });
  return response;
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const stateParam = url.searchParams.get('state');
  const providerError = url.searchParams.get('error');

  if (providerError) return errorRedirect(url.origin, providerError);
  if (!code || !stateParam) return errorRedirect(url.origin, 'missing_params');

  const state = verifyState(stateParam);
  if (!state) return errorRedirect(url.origin, 'invalid_state');

  const nonceCookie = request.cookies.get(STATE_COOKIE)?.value;
  if (!nonceCookie || nonceCookie !== state.nonce) {
    return errorRedirect(url.origin, 'state_mismatch');
  }

  const redirectUri = getRedirectUri(url.origin);
  let google;
  try {
    const tokens = await exchangeCodeForTokens(code, redirectUri);
    google = await verifyGoogleIdToken(tokens.id_token);
  } catch (err) {
    console.error('[oauth] token verification failed:', err);
    return errorRedirect(url.origin, 'verify_failed');
  }

  if (!google.emailVerified) return errorRedirect(url.origin, 'email_unverified');

  const email = google.email.toLowerCase();
  const name = google.name || email;
  const target = safeRedirect(state.redirect);
  const finalUrl = target.startsWith('/') ? new URL(target, url.origin).toString() : target;

  // Bootstrap admin: ADMIN_EMAIL goes through unconditionally and is upserted
  // as an admin member on first login.
  if (isBootstrapAdminEmail(email)) {
    await upsertMember({ email, name, role: 'admin', group_slug: null });
    const sessionToken = signIdentityToken({ email, role: 'admin', group: null });
    const response = NextResponse.redirect(finalUrl);
    response.cookies.set(identityCookieOptions(sessionToken));
    response.cookies.set({ name: STATE_COOKIE, value: '', maxAge: 0, path: '/' });
    return response;
  }

  // Existing member: refresh last_login_at and issue a session.
  const existing = await getMember(email);
  if (existing) {
    await touchLastLogin(email);
    const sessionToken = signIdentityToken({
      email,
      role: existing.role,
      group: existing.group_slug,
    });
    const response = NextResponse.redirect(finalUrl);
    response.cookies.set(identityCookieOptions(sessionToken));
    response.cookies.set({ name: STATE_COOKIE, value: '', maxAge: 0, path: '/' });
    return response;
  }

  // Unknown email: hand off to /signup with a short-lived signup-token cookie
  // proving Google verified this email. Preserve the original redirect target.
  const signupToken = signSignupToken({ email, name });
  const signupUrl = new URL('/signup', url.origin);
  signupUrl.searchParams.set('redirect', target);
  const response = NextResponse.redirect(signupUrl.toString());
  response.cookies.set(signupCookieOptions(signupToken));
  response.cookies.set({ name: STATE_COOKIE, value: '', maxAge: 0, path: '/' });
  return response;
}
