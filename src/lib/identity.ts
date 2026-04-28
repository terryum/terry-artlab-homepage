/**
 * Identity session: Google OAuth-backed user session.
 * Token payload: `user:<email>:<role>:<group>:<ts>` (`role` ∈ {admin, member},
 * `group` empty string for admins). HMAC-signed via signToken.
 *
 * Cookie: `id-session`, set on `.terryum.ai` in production so subdomains share.
 */
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { signToken, verifyToken, isTokenExpired, cookieOptions } from './auth-common';

export const ID_COOKIE_NAME = 'id-session';
export const ID_SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export type IdentityRole = 'admin' | 'member';

export interface IdentityClaim {
  email: string;
  role: IdentityRole;
  group: string | null;
}

function cookieDomain(): string | undefined {
  if (process.env.NODE_ENV !== 'production') return undefined;
  return '.terryum.ai';
}

export function signIdentityToken(claim: IdentityClaim): string {
  const group = claim.group ?? '';
  return signToken(`user:${claim.email}:${claim.role}:${group}:${Date.now()}`);
}

const IDENTITY_PAYLOAD_RE = /^user:([^:]+):(admin|member):([^:]*):(\d+)$/;

export function verifyIdentityToken(token: string): IdentityClaim | null {
  const result = verifyToken(token);
  if (!result) return null;
  const match = result.payload.match(IDENTITY_PAYLOAD_RE);
  if (!match) return null;
  if (isTokenExpired(Number(match[4]), ID_SESSION_MAX_AGE)) return null;
  const role = match[2] as IdentityRole;
  const group = match[3] ? match[3] : null;
  return { email: match[1], role, group };
}

export async function getCurrentIdentity(): Promise<IdentityClaim | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ID_COOKIE_NAME)?.value;
  return token ? verifyIdentityToken(token) : null;
}

export function getIdentityFromRequest(request: NextRequest): IdentityClaim | null {
  const token = request.cookies.get(ID_COOKIE_NAME)?.value;
  return token ? verifyIdentityToken(token) : null;
}

export async function isAdmin(): Promise<boolean> {
  const id = await getCurrentIdentity();
  return id?.role === 'admin';
}

export function isAdminFromRequest(request: NextRequest): boolean {
  return getIdentityFromRequest(request)?.role === 'admin';
}

function getAdminEmail(): string {
  const email = process.env.ADMIN_EMAIL;
  if (!email) throw new Error('ADMIN_EMAIL is not set');
  return email.toLowerCase();
}

/** True if the email matches the bootstrap ADMIN_EMAIL env var. */
export function isBootstrapAdminEmail(email: string): boolean {
  return email.toLowerCase() === getAdminEmail();
}

export function identityCookieOptions(token: string) {
  return cookieOptions(ID_COOKIE_NAME, token, ID_SESSION_MAX_AGE, cookieDomain());
}

export function deleteIdentityCookieOptions() {
  return cookieOptions(ID_COOKIE_NAME, '', 0, cookieDomain());
}
