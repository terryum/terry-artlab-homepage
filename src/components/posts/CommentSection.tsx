'use client';

import { useEffect, useMemo, useState } from 'react';
import CommentList, {
  type PublicComment,
  type CommentTree,
} from './CommentList';
import CommentForm from './CommentForm';
import type { Locale } from '@/lib/i18n';

interface Props {
  slug: string;
  locale: Locale;
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

export default function CommentSection({ slug, locale }: Props) {
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

  const heading = locale === 'ko' ? '댓글' : 'Comments';
  const writeLabel = locale === 'ko' ? '+ 댓글 쓰기' : '+ Write a comment';
  const totalCount = comments.length;

  return (
    <div>
      <h2 className="text-base font-medium text-text-primary mb-4">
        {heading}
        {!loading && totalCount > 0 && (
          <span className="ml-2 text-text-muted text-sm tabular-nums">{totalCount}</span>
        )}
      </h2>
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

      {!formOpen ? (
        <button
          type="button"
          onClick={() => setFormOpen(true)}
          className="mt-6 px-4 py-2 text-sm rounded-md border border-line-default text-text-secondary hover:text-accent hover:border-accent transition-colors"
        >
          {writeLabel}
        </button>
      ) : (
        <div className="mt-6 border border-line-default rounded-md p-4 bg-bg-secondary/30">
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
  );
}
