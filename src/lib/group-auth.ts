import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import crypto from 'crypto';

const COOKIE_NAME = 'group-session';
const MAX_AGE = 60 * 60 * 24; // 24 hours

/* ─── Rate limiting (in-memory, per-instance) ─── */
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const attempts = new Map<string, { count: number; resetAt: number }>();

export function checkGroupRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || now > entry.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
    return true;
  }
  entry.count++;
  return entry.count <= MAX_ATTEMPTS;
}

function getSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) throw new Error('ADMIN_SESSION_SECRET is not set');
  return secret;
}

/**
 * Verify group password against CO_{GROUP}_PASSWORD env var.
 * Group slug is uppercased: co-snu → CO_SNU_PASSWORD
 */
export function verifyGroupPassword(group: string, input: string): boolean {
  const envKey = `CO_${group.toUpperCase().replace(/-/g, '_')}_PASSWORD`;
  const expected = process.env[envKey]?.trim();
  if (!expected) return false;

  const a = Buffer.from(input.trim());
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/** Check if a group has a password configured */
export function isGroupConfigured(group: string): boolean {
  const envKey = `CO_${group.toUpperCase().replace(/-/g, '_')}_PASSWORD`;
  return !!process.env[envKey]?.trim();
}

/** Sign a group session token: group:{slug}:{timestamp}.{hmac} */
export function signGroupToken(group: string): string {
  const payload = `group:${group}:${Date.now()}`;
  const hmac = crypto.createHmac('sha256', getSecret()).update(payload).digest('hex');
  return `${payload}.${hmac}`;
}

/** Verify and parse a group session token. Returns group slug or null. */
export function verifyGroupToken(token: string): string | null {
  const lastDot = token.lastIndexOf('.');
  if (lastDot === -1) return null;

  const payload = token.slice(0, lastDot);
  const signature = token.slice(lastDot + 1);
  const expected = crypto.createHmac('sha256', getSecret()).update(payload).digest('hex');

  if (signature.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;

  // Parse payload: group:{slug}:{timestamp}
  const match = payload.match(/^group:([^:]+):(\d+)$/);
  if (!match) return null;

  const issued = Number(match[2]);
  if (Date.now() - issued > MAX_AGE * 1000) return null;

  return match[1]; // group slug
}

/** Check group session from request cookies (for API routes) */
export function getGroupFromRequest(request: NextRequest): string | null {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyGroupToken(token);
}

/** Check group session from Next.js cookies() (for server components) */
export async function getAuthenticatedGroup(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyGroupToken(token);
}

/** Check if current session is admin (from admin-auth cookie) */
export async function isAdminSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const adminToken = cookieStore.get('admin-session')?.value;
  if (!adminToken) return false;

  // Reuse admin-auth verification logic
  const lastDot = adminToken.lastIndexOf('.');
  if (lastDot === -1) return false;

  const payload = adminToken.slice(0, lastDot);
  const signature = adminToken.slice(lastDot + 1);
  const expected = crypto.createHmac('sha256', getSecret()).update(payload).digest('hex');

  if (signature.length !== expected.length) return false;
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return false;

  const tsMatch = payload.match(/^admin:(\d+)$/);
  if (!tsMatch) return false;
  const issued = Number(tsMatch[1]);
  if (Date.now() - issued > MAX_AGE * 1000) return false;

  return true;
}

/** Check if user can access a specific group's content */
export async function canAccessGroup(targetGroup: string): Promise<boolean> {
  // Admin can access everything
  if (await isAdminSession()) return true;

  // Check group session
  const sessionGroup = await getAuthenticatedGroup();
  return sessionGroup === targetGroup;
}

export function groupCookieOptions(token: string) {
  return {
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: MAX_AGE,
    path: '/',
  };
}

export function deleteGroupCookieOptions() {
  return {
    name: COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 0,
    path: '/',
  };
}
