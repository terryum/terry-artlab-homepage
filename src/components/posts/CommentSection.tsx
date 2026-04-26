'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import CommentList, {
  type PublicComment,
  type CommentTree,
} from './CommentList';
import CommentForm from './CommentForm';
import type { Locale } from '@/lib/i18n';

interface Props {
  slug: string;
  locale: Locale;
  actionPrefix?: ReactNode;
}

function buildTrees(flat: PublicComment[]): CommentTree[] {
  // Roots first (parent_id NULL), oldest → newest. Replies grouped by parent, oldest → newest.
  const roots = flat.filter((c) => !c.parent_id);
  const repliesByParent = new Map<string, PublicComment[]>();
  for (const c of flat) {
    if (c.parent_id) {
      const arr = repliesByParent.get(c.parent_id) ?? [];
      arr.push(c);
      repliesByParent.set(c.parent_id, arr);
    }
  }
  return roots.map((root) => ({
    root,
    replies: repliesByParent.get(root.id) ?? [],
  }));
}

export default function CommentSection({ slug, locale, actionPrefix }: Props) {
  const [comments, setComments] = useState<PublicComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [replyOpenFor, setReplyOpenFor] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/posts/${slug}/comments`, { cache: 'no-store' });
        if (!res.ok) return;
        const data = (await res.json()) as { comments: PublicComment[] };
        if (!cancelled) setComments(data.comments ?? []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/session', { cache: 'no-store' });
        if (!res.ok) return;
        const data = (await res.json()) as { sessionLabel?: string | null };
        if (!cancelled) setIsAdmin(data.sessionLabel === 'Admin');
      } catch {
        /* silent — non-critical */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const trees = useMemo(() => buildTrees(comments), [comments]);
  const totalCount = comments.length;

  const onRootCreated = (c: PublicComment) => {
    setComments((prev) => [...prev, c]);
    setFormOpen(false);
  };

  const onReplyCreated = (c: PublicComment) => {
    setComments((prev) => [...prev, c]);
    setReplyOpenFor(null);
  };

  const onDelete = async (id: string) => {
    const res = await fetch(`/api/posts/${slug}/comments/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      window.alert(`Delete failed: HTTP ${res.status}`);
      return;
    }
    // Cascade: also drop replies whose parent is this id.
    setComments((prev) => prev.filter((c) => c.id !== id && c.parent_id !== id));
  };

  const labels = locale === 'ko'
    ? { comments: '댓글', write: '댓글 쓰기' }
    : { comments: 'Comments', write: 'Write' };

  return (
    <div>
      {/* Single action row: like + comment count + write trigger */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {actionPrefix}
        <span
          className="inline-flex items-center gap-1.5 px-2 py-1.5 text-sm text-text-secondary"
          aria-label={`${labels.comments} ${totalCount}`}
        >
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"
            />
          </svg>
          <span>{labels.comments}</span>
          <span className="tabular-nums text-text-muted">{totalCount}</span>
        </span>
        <div className="flex-1" />
        {!formOpen && (
          <button
            type="button"
            onClick={() => setFormOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-full border border-line-default text-text-secondary hover:text-accent hover:border-accent transition-colors px-3 py-1.5 text-sm"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z"
              />
            </svg>
            <span>{labels.write}</span>
          </button>
        )}
      </div>

      {formOpen && (
        <div className="mb-6 border border-line-default rounded-md p-4 bg-bg-secondary/30">
          <CommentForm
            slug={slug}
            locale={locale}
            onCreated={onRootCreated}
            onCancel={() => setFormOpen(false)}
            autoFocus
          />
        </div>
      )}

      <CommentList
        trees={trees}
        locale={locale}
        loading={loading}
        isAdmin={isAdmin}
        replyOpenFor={replyOpenFor}
        onReplyToggle={setReplyOpenFor}
        onDelete={onDelete}
        renderReplyForm={(parent) => (
          <CommentForm
            slug={slug}
            locale={locale}
            parentId={parent.id}
            parentAuthor={parent.author_name}
            onCreated={onReplyCreated}
            onCancel={() => setReplyOpenFor(null)}
            compact
            autoFocus
          />
        )}
      />
    </div>
  );
}
