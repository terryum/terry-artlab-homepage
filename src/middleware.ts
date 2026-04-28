import { NextRequest, NextResponse } from 'next/server';
import { LOCALES, DEFAULT_LOCALE, type Locale } from '@/lib/i18n';
import indexJson from '../posts/index.json';

interface VisibilityEntry {
  visibility: 'private' | 'group';
  allowed_groups: string[];
}

const VISIBILITY_MAP: Record<string, VisibilityEntry> = (() => {
  const map: Record<string, VisibilityEntry> = {};
  const posts = (indexJson as { posts?: Array<Record<string, unknown>> }).posts ?? [];
  for (const p of posts) {
    const visibility = (p.visibility as string) ?? 'public';
    if (visibility === 'private' || visibility === 'group') {
      map[p.slug as string] = {
        visibility,
        allowed_groups: (p.allowed_groups as string[]) ?? [],
      };
    }
  }
  return map;
})();

const POST_DETAIL_RE = /^\/(ko|en)\/posts\/([^/]+)\/?$/;
const ID_SESSION_MAX_AGE_MS = 60 * 60 * 24 * 30 * 1000; // mirror identity.ts (30 days)
const TEXT_ENCODER = new TextEncoder();

// Web Crypto HMAC verify — middleware runs on the Edge runtime where Node's
// `crypto.createHmac` isn't available. Mirrors verifyToken in auth-common.ts.
async function verifyHmacToken(token: string, secret: string): Promise<string | null> {
  const lastDot = token.lastIndexOf('.');
  if (lastDot === -1) return null;
  const payload = token.slice(0, lastDot);
  const signatureHex = token.slice(lastDot + 1);
  if (signatureHex.length !== 64) return null;

  const key = await crypto.subtle.importKey(
    'raw',
    TEXT_ENCODER.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const macBuffer = await crypto.subtle.sign('HMAC', key, TEXT_ENCODER.encode(payload));
  const expected = Array.from(new Uint8Array(macBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) {
    mismatch |= expected.charCodeAt(i) ^ signatureHex.charCodeAt(i);
  }
  return mismatch === 0 ? payload : null;
}

interface IdentityClaim {
  role: 'admin' | 'member';
  group: string | null;
}

const IDENTITY_RE = /^user:([^:]+):(admin|member):([^:]*):(\d+)$/;

async function verifyIdentity(
  request: NextRequest,
  secret: string,
): Promise<IdentityClaim | null> {
  const token = request.cookies.get('id-session')?.value;
  if (!token) return null;
  const payload = await verifyHmacToken(token, secret);
  if (!payload) return null;
  const match = payload.match(IDENTITY_RE);
  if (!match) return null;
  const issuedAt = Number(match[4]);
  if (Date.now() - issuedAt > ID_SESSION_MAX_AGE_MS) return null;
  const role = match[2] as 'admin' | 'member';
  const group = match[3] ? match[3] : null;
  return { role, group };
}

async function gatePostDetail(request: NextRequest): Promise<NextResponse | undefined> {
  const match = POST_DETAIL_RE.exec(request.nextUrl.pathname);
  if (!match) return undefined;
  const slug = match[2];
  const entry = VISIBILITY_MAP[slug];
  if (!entry) return undefined;

  const sessionSecret = process.env.SESSION_SECRET;
  // Fail closed if SESSION_SECRET is missing — better to redirect than to leak.
  if (sessionSecret) {
    const id = await verifyIdentity(request, sessionSecret);
    if (id) {
      if (id.role === 'admin') return undefined;
      if (entry.visibility === 'group' && id.group && entry.allowed_groups.includes(id.group)) {
        return undefined;
      }
    }
  }

  const url = request.nextUrl.clone();
  url.pathname = '/login';
  url.search = `?redirect=${encodeURIComponent(request.nextUrl.pathname)}`;
  return NextResponse.redirect(url, { status: 307 });
}

export async function middleware(request: NextRequest) {
  const host = request.headers.get('host') || '';
  const { pathname } = request.nextUrl;

  // Apex terryum.ai → www.terryum.ai (308 permanent redirect, path preserved).
  if (host === 'terryum.ai') {
    const url = request.nextUrl.clone();
    url.host = 'www.terryum.ai';
    url.protocol = 'https:';
    return NextResponse.redirect(url, { status: 308 });
  }

  // Legacy IA redirects (memos/threads tabs and author= filter merged into "notes").
  if (/^\/(ko|en)\/posts\/?$/.test(pathname)) {
    const tab = request.nextUrl.searchParams.get('tab');
    const author = request.nextUrl.searchParams.get('author');
    if (tab === 'memos' || tab === 'threads' || author === 'terry' || author === 'ai') {
      const url = request.nextUrl.clone();
      url.searchParams.delete('author');
      url.searchParams.set('tab', 'notes');
      return NextResponse.redirect(url, { status: 308 });
    }
  }

  // /projects → /about (Projects merged into About → "Code" curation).
  const projectsMatch = pathname.match(/^\/(ko|en)\/projects(?:\/.*)?$/);
  if (projectsMatch) {
    const url = request.nextUrl.clone();
    url.pathname = `/${projectsMatch[1]}/about`;
    url.search = '';
    return NextResponse.redirect(url, { status: 308 });
  }

  // Legacy /co/[group] → /login
  if (/^\/co(\/.*)?$/.test(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.search = '';
    return NextResponse.redirect(url, { status: 308 });
  }

  // Visibility gate for private/group post detail pages. The page itself is
  // SSG-prerendered (so MDX compiles at build time on Node, not under
  // Workers' eval ban), so the access check has to happen here at the edge.
  const gateResponse = await gatePostDetail(request);
  if (gateResponse) return gateResponse;

  // Skip if path already has locale prefix
  const pathnameHasLocale = LOCALES.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );
  if (pathnameHasLocale) return;

  // Skip static files, API routes, admin, and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/signup') ||
    pathname.startsWith('/posts') ||
    pathname.startsWith('/surveys') ||
    pathname.startsWith('/images') ||
    pathname.includes('.')
  ) {
    return;
  }

  // Detect language
  const savedLang = request.cookies.get('preferred-lang')?.value;
  let locale = DEFAULT_LOCALE;

  if (savedLang && LOCALES.includes(savedLang as Locale)) {
    locale = savedLang as Locale;
  } else {
    const acceptLang = request.headers.get('accept-language') || '';
    if (acceptLang.toLowerCase().startsWith('ko')) {
      locale = 'ko';
    }
  }

  // Redirect to locale-prefixed path
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === '/' ? '' : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/((?!_next|favicon.ico).*)'],
};
