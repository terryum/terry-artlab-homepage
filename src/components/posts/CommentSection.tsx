'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
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
  const bottomFormRef = useRef<HTMLDivElement>(null);

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

  // Comment-icon click: open the bottom form and scroll to it.
  const focusBottomForm = () => {
    setFormOpen(true);
    // Allow the form to mount before scrolling.
    requestAnimationFrame(() => {
      bottomFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  };

  const labels = locale === 'ko'
    ? { commentAria: `댓글 쓰기 ${totalCount}`, commentTitle: '댓글', placeholder: '댓글을 남겨주세요...' }
    : { commentAria: `Write a comment ${totalCount}`, commentTitle: 'Comments', placeholder: 'Leave a comment...' };

  return (
    <div>
      {/* Top action row — icons + counts only */}
      <div className="flex items-center gap-2 mb-6">
        {actionPrefix}
        <button
          type="button"
          onClick={focusBottomForm}
          aria-label={labels.commentAria}
          title={labels.commentTitle}
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
              d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"
            />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.5v5M9.5 11h5" />
          </svg>
          <span className="tabular-nums">{totalCount}</span>
        </button>
      </div>

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

      {/* Bottom: input-styled placeholder OR expanded form */}
      <div ref={bottomFormRef} className="mt-6 scroll-mt-24">
        {!formOpen ? (
          <button
            type="button"
            onClick={() => setFormOpen(true)}
            className="w-full text-left px-4 py-3 rounded-md border border-line-default bg-bg-primary text-text-muted hover:border-accent hover:text-accent transition-colors text-sm"
          >
            {labels.placeholder}
          </button>
        ) : (
          <div className="border border-line-default rounded-md p-4 bg-bg-secondary/30">
            <CommentForm
              slug={slug}
              locale={locale}
              onCreated={onRootCreated}
              onCancel={() => setFormOpen(false)}
              autoFocus
            />
          </div>
        )}
      </div>
    </div>
  );
}
