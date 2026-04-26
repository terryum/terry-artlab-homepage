'use client';

import { useEffect, useRef, useState } from 'react';
import type { Locale } from '@/lib/i18n';
import type { PublicComment } from './CommentList';

interface Props {
  slug: string;
  locale: Locale;
  onCreated: (comment: PublicComment) => void;
  parentId?: string;
  parentAuthor?: string;
  onCancel?: () => void;
  compact?: boolean;
  autoFocus?: boolean;
}

const TURNSTILE_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

interface TurnstileApi {
  render: (
    el: HTMLElement,
    opts: { sitekey: string; callback: (token: string) => void; 'error-callback'?: () => void; 'expired-callback'?: () => void; theme?: string },
  ) => string;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

function loadTurnstileScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.turnstile) return Promise.resolve();
  if (document.querySelector(`script[src^="${TURNSTILE_SRC.split('?')[0]}"]`)) {
    return new Promise((resolve) => {
      const tick = () => (window.turnstile ? resolve() : setTimeout(tick, 50));
      tick();
    });
  }
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = TURNSTILE_SRC;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('turnstile script failed to load'));
    document.head.appendChild(s);
  });
}

export default function CommentForm({
  slug,
  locale,
  onCreated,
  parentId,
  parentAuthor,
  onCancel,
  compact = false,
  autoFocus = false,
}: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [content, setContent] = useState('');
  const [website, setWebsite] = useState(''); // honeypot
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const turnstileTokenRef = useRef<string>('');
  const widgetIdRef = useRef<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const firstFieldRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (autoFocus) firstFieldRef.current?.focus();
  }, [autoFocus]);

  useEffect(() => {
    if (!SITE_KEY) return;
    let cancelled = false;
    (async () => {
      try {
        await loadTurnstileScript();
        if (cancelled || !containerRef.current || !window.turnstile) return;
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: SITE_KEY,
          callback: (token) => {
            turnstileTokenRef.current = token;
          },
          'expired-callback': () => {
            turnstileTokenRef.current = '';
          },
          'error-callback': () => {
            turnstileTokenRef.current = '';
          },
        });
      } catch {
        /* allow form submission without Turnstile if script load fails */
      }
    })();
    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          /* ignore */
        }
      }
    };
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      const res = await fetch(`/api/posts/${slug}/comments`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          content,
          website,
          turnstileToken: turnstileTokenRef.current,
          parentId: parentId ?? null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || (locale === 'ko' ? '댓글 등록 실패' : 'Failed to submit'));
        if (widgetIdRef.current && window.turnstile) {
          window.turnstile.reset(widgetIdRef.current);
          turnstileTokenRef.current = '';
        }
        return;
      }
      if (data.queued) {
        setSuccess(locale === 'ko' ? '검토 대기 중입니다.' : 'Queued for review.');
      } else if (data.comment) {
        onCreated(data.comment as PublicComment);
        setSuccess(locale === 'ko' ? '댓글이 등록되었습니다.' : 'Comment submitted.');
      } else {
        setSuccess(locale === 'ko' ? '완료되었습니다.' : 'Done.');
      }
      setContent('');
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.reset(widgetIdRef.current);
        turnstileTokenRef.current = '';
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const labels = locale === 'ko'
    ? {
        name: '이름',
        email: '이메일',
        content: parentId ? '답글' : '댓글',
        submit: parentId ? '답글 등록' : '등록',
        cancel: '취소',
        emailHint: '이메일은 공개되지 않습니다.',
        replyTo: (n: string) => `↳ ${n}님께 답글`,
      }
    : {
        name: 'Name',
        email: 'Email',
        content: parentId ? 'Reply' : 'Comment',
        submit: parentId ? 'Reply' : 'Submit',
        cancel: 'Cancel',
        emailHint: 'Your email will not be shown publicly.',
        replyTo: (n: string) => `↳ Reply to ${n}`,
      };

  const containerClass = compact ? 'space-y-2 mt-2' : 'space-y-3 mt-6';
  const inputClass =
    'mt-1 px-3 py-2 text-sm border border-line-default rounded-md bg-bg-primary text-text-primary';
  const textareaRows = compact ? 3 : 4;

  return (
    <form onSubmit={submit} className={containerClass}>
      {parentId && parentAuthor && (
        <p className="text-xs text-text-muted">{labels.replyTo(parentAuthor)}</p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="flex flex-col text-xs text-text-secondary">
          {labels.name}
          <input
            ref={firstFieldRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={40}
            className={inputClass}
          />
        </label>
        <label className="flex flex-col text-xs text-text-secondary">
          {labels.email}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={inputClass}
          />
          <span className="mt-1 text-[11px] text-text-muted">{labels.emailHint}</span>
        </label>
      </div>

      <label className="flex flex-col text-xs text-text-secondary">
        {labels.content}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          minLength={5}
          maxLength={2000}
          rows={textareaRows}
          className={`${inputClass} resize-y`}
        />
      </label>

      {/* Honeypot — hidden from real users via aria + position. Bots fill it. */}
      <div aria-hidden="true" className="absolute left-[-9999px] top-[-9999px]" tabIndex={-1}>
        <label>
          Website
          <input
            type="text"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
          />
        </label>
      </div>

      {SITE_KEY && <div ref={containerRef} className="cf-turnstile" />}

      {error && <p className="text-sm text-red-500">{error}</p>}
      {success && <p className="text-sm text-emerald-600">{success}</p>}

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 text-sm rounded-md bg-accent text-white hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? (locale === 'ko' ? '등록 중…' : 'Submitting…') : labels.submit}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="px-4 py-2 text-sm rounded-md border border-line-default text-text-secondary hover:text-accent hover:border-accent transition-colors disabled:opacity-50"
          >
            {labels.cancel}
          </button>
        )}
      </div>
    </form>
  );
}
