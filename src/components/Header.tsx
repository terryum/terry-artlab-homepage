'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useSearchParams } from 'next/navigation';
import { useState, useEffect, useRef, Suspense } from 'react';
import LanguageSwitcher from './LanguageSwitcher';
import ThemeToggle from './ThemeToggle';
import { Container } from './ui/Container';
import { SITE_CONFIG } from '@/lib/site-config';
import type { Locale } from '@/lib/i18n';
import type { NavTabItem } from '@/lib/tabs';

interface NavItem {
  href: string;
  label: string;
  tabSlug?: string;
  author?: 'terry' | 'ai';
}

interface HeaderProps {
  locale: Locale;
  dict: {
    nav: { home: string; about: string; projects: string };
  };
  navTabs: NavTabItem[];
  sessionLabel?: string | null;
}

function LoginLogout({ sessionLabel }: { sessionLabel?: string | null }) {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
        setError('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  async function handleLogout() {
    setLoading(true);
    await Promise.all([
      fetch('/api/co/logout', { method: 'POST' }),
      fetch('/api/admin/logout', { method: 'POST' }),
    ]);
    window.location.reload();
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!id.trim() || !password.trim()) return;
    setError('');
    setLoading(true);
    try {
      const isAdmin = id.trim().toLowerCase() === 'admin';
      const url = isAdmin ? '/api/admin/login' : '/api/co/login';
      const body = isAdmin
        ? { password: password.trim() }
        : { group: id.trim().toLowerCase(), password: password.trim() };
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Login failed');
        setLoading(false);
        return;
      }
      window.location.reload();
    } catch {
      setError('Something went wrong');
      setLoading(false);
    }
  }

  if (sessionLabel) {
    return (
      <div className="flex items-center gap-1.5 text-xs">
        <span className="px-1.5 py-0.5 rounded bg-accent/10 text-accent font-medium">{sessionLabel}</span>
        <button
          onClick={handleLogout}
          disabled={loading}
          className="text-text-tertiary hover:text-text-primary transition-colors disabled:opacity-50"
        >
          {loading ? '...' : 'Logout'}
        </button>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="text-xs text-text-tertiary hover:text-text-primary transition-colors"
      >
        Login
      </button>
      {open && (
        <form
          onSubmit={handleLogin}
          className="absolute right-0 top-full mt-2 w-52 p-3 rounded-lg border border-line-default bg-bg-primary shadow-lg z-50 flex flex-col gap-2"
        >
          <input
            type="text"
            value={id}
            onChange={(e) => setId(e.target.value)}
            placeholder="ID (e.g. snu, admin)"
            autoFocus
            className="w-full px-2 py-1.5 text-xs border border-line-default rounded bg-bg-primary text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full px-2 py-1.5 text-xs border border-line-default rounded bg-bg-primary text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
          />
          {error && <p className="text-red-500 text-[11px]">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full px-2 py-1.5 text-xs bg-accent text-white rounded hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {loading ? '...' : 'Enter'}
          </button>
        </form>
      )}
    </div>
  );
}

function HeaderInner({ locale, dict, navTabs, sessionLabel }: HeaderProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [mobileOpen, setMobileOpen] = useState(false);
  const currentTab = searchParams.get('tab');

  const aiTabs: NavItem[] = navTabs
    .filter(tab => tab.author === 'ai')
    .map(tab => ({ href: tab.href, label: tab.label, tabSlug: tab.tabSlug, author: tab.author }));

  const terryTabs: NavItem[] = navTabs
    .filter(tab => tab.author === 'terry')
    .map(tab => ({ href: tab.href, label: tab.label, tabSlug: tab.tabSlug, author: tab.author }));

  const projectsItem: NavItem = { href: `/${locale}/projects`, label: dict.nav.projects };
  const aboutItem: NavItem = { href: `/${locale}/about`, label: dict.nav.about };

  function isActive(item: NavItem) {
    if (item.tabSlug) {
      return pathname.startsWith(`/${locale}/posts`) && currentTab === item.tabSlug;
    }
    return pathname.startsWith(item.href);
  }

  function TabLink({ item }: { item: NavItem }) {
    return (
      <Link
        key={item.tabSlug || item.href}
        href={item.href}
        className={`text-sm transition-colors ${
          isActive(item)
            ? 'text-accent border-b-2 border-accent pb-[1px]'
            : 'text-text-secondary hover:text-accent'
        }`}
        aria-current={isActive(item) ? 'page' : undefined}
      >
        {item.label}
      </Link>
    );
  }

  function MobileTabLink({ item }: { item: NavItem }) {
    return (
      <Link
        key={item.tabSlug || item.href}
        href={item.href}
        onClick={() => setMobileOpen(false)}
        className={`text-sm px-2 py-1 transition-colors ${
          isActive(item)
            ? 'text-accent font-medium'
            : 'text-text-secondary hover:text-accent'
        }`}
        aria-current={isActive(item) ? 'page' : undefined}
      >
        {item.label}
      </Link>
    );
  }

  return (
    <header className="border-b border-line-default">
      <Container>
        <div className="flex items-center justify-between h-14">
          {/* Logo / Site name */}
          <Link href={`/${locale}`} className="flex items-center gap-2 text-sm text-text-secondary transition-colors hover:text-accent">
            <Image
              src="/images/logo-transparent-256.webp"
              alt={SITE_CONFIG.name}
              width={20}
              height={20}
              sizes="20px"
              priority
            />
            {SITE_CONFIG.name}
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {/* AI group */}
            <span className="text-[10px] px-1.5 py-0.5 rounded font-medium leading-none nav-tag-ai">AI</span>
            <div className="flex items-center gap-4 ml-1">
              {aiTabs.map(item => <TabLink key={item.tabSlug || item.href} item={item} />)}
              <TabLink item={projectsItem} />
            </div>

            {/* Separator */}
            <div className="w-px h-4 bg-line-default mx-2" />

            {/* Terry group */}
            <span className="text-[10px] px-1.5 py-0.5 rounded font-medium leading-none nav-tag-terry">Terry</span>
            <div className="flex items-center gap-4 ml-1">
              {terryTabs.map(item => <TabLink key={item.tabSlug || item.href} item={item} />)}
              <TabLink item={aboutItem} />
            </div>

            <div className="flex items-center gap-2 ml-4">
              <LoginLogout sessionLabel={sessionLabel} />
              <ThemeToggle />
              <LanguageSwitcher locale={locale} />
            </div>
          </nav>

          {/* Mobile: icon buttons + hamburger */}
          <div className="flex items-center gap-2 md:hidden">
            <LoginLogout sessionLabel={sessionLabel} />
            <ThemeToggle />
            <LanguageSwitcher locale={locale} />
            <button
              className="p-2 text-text-secondary"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile nav panel */}
        {mobileOpen && (
          <nav className="md:hidden pb-4 border-t border-line-default pt-3 flex flex-col gap-1">
            {/* AI group */}
            <span className="mx-2 mt-0.5 mb-1 inline-block text-[10px] px-1.5 py-0.5 rounded font-medium leading-none nav-tag-ai">AI</span>
            {aiTabs.map(item => <MobileTabLink key={item.tabSlug || item.href} item={item} />)}
            <MobileTabLink item={projectsItem} />

            {/* Separator */}
            <div className="h-px bg-line-default my-2 mx-2" />

            {/* Terry group */}
            <span className="mx-2 mt-0.5 mb-1 inline-block text-[10px] px-1.5 py-0.5 rounded font-medium leading-none nav-tag-terry">Terry</span>
            {terryTabs.map(item => <MobileTabLink key={item.tabSlug || item.href} item={item} />)}
            <MobileTabLink item={aboutItem} />
          </nav>
        )}
      </Container>
    </header>
  );
}

export default function Header(props: HeaderProps) {
  return (
    <Suspense fallback={
      <header className="border-b border-line-default">
        <Container>
          <div className="flex items-center justify-between h-14">
            <span className="flex items-center gap-2 text-sm text-text-secondary">
              <Image src="/images/logo-transparent-256.webp" alt={SITE_CONFIG.name} width={20} height={20} sizes="20px" priority />
              {SITE_CONFIG.name}
            </span>
          </div>
        </Container>
      </header>
    }>
      <HeaderInner {...props} />
    </Suspense>
  );
}
