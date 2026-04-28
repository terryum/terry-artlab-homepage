/**
 * Short-lived (10 min) HMAC-signed token that proves the bearer just completed
 * a verified Google OAuth flow. Issued by /api/auth/google/callback when the
 * email is unknown; consumed by /api/auth/signup to bind the new member record
 * to the verified email.
 */
import { cookies } from 'next/headers';
import { signToken, verifyToken, isTokenExpired, cookieOptions } from '@/lib/auth-common';

export const SIGNUP_COOKIE_NAME = 'signup-token';
const SIGNUP_TOKEN_MAX_AGE = 10 * 60; // 10 minutes

export interface SignupClaim {
  email: string;
  name: string;
}

function encodeName(name: string | undefined): string {
  // Names can include `:` and other separators; b64-url encode for safe parsing.
  return Buffer.from(name ?? '', 'utf8').toString('base64url');
}

function decodeName(encoded: string): string {
  try {
    return Buffer.from(encoded, 'base64url').toString('utf8');
  } catch {
    return '';
  }
}

export function signSignupToken(claim: SignupClaim): string {
  const payload = `signup:${claim.email}:${encodeName(claim.name)}:${Date.now()}`;
  return signToken(payload);
}

export function verifySignupToken(token: string): SignupClaim | null {
  const result = verifyToken(token);
  if (!result) return null;
  const match = result.payload.match(/^signup:([^:]+):([^:]*):(\d+)$/);
  if (!match) return null;
  if (isTokenExpired(Number(match[3]), SIGNUP_TOKEN_MAX_AGE)) return null;
  return { email: match[1], name: decodeName(match[2]) };
}

export function signupCookieOptions(token: string) {
  return cookieOptions(SIGNUP_COOKIE_NAME, token, SIGNUP_TOKEN_MAX_AGE);
}

export function deleteSignupCookieOptions() {
  return cookieOptions(SIGNUP_COOKIE_NAME, '', 0);
}

export async function readSignupClaim(): Promise<SignupClaim | null> {
  const store = await cookies();
  const token = store.get(SIGNUP_COOKIE_NAME)?.value;
  return token ? verifySignupToken(token) : null;
}
