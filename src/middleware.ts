import { NextRequest, NextResponse } from 'next/server';
import { LOCALES, DEFAULT_LOCALE, type Locale } from '@/lib/i18n';

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || '';
  const { pathname } = request.nextUrl;

  // Apex terryum.ai → www.terryum.ai (308 permanent redirect, path preserved).
  // terry.artlab.ai redirect is handled at AWS CloudFront + S3, so no host check here.
  if (host === 'terryum.ai') {
    const url = request.nextUrl.clone();
    url.host = 'www.terryum.ai';
    url.protocol = 'https:';
    return NextResponse.redirect(url, { status: 308 });
  }

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
    pathname.startsWith('/co') ||
    pathname.startsWith('/login') ||
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
  // Run middleware on all paths except Next.js internal assets + favicon.
  // Apex terryum.ai → www redirect must cover every route including /api, /posts,
  // /surveys, /images, /robots.txt, etc. The locale-redirect logic inside the
  // handler has its own early-returns for those paths so only the host check fires.
  matcher: ['/((?!_next|favicon.ico).*)'],
};
