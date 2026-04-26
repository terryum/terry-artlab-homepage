'use client';

import type { Locale } from '@/lib/i18n';
import type { ReactNode } from 'react';

export interface PublicComment {
  id: string;
  author_name: string;
  content: string;
  created_at: string;
  parent_id: string | null;
}

export interface CommentTree {
  root: PublicComment;
  replies: PublicComment[];
}

interface Props {
  trees: CommentTree[];
  locale: Locale;
  loading?: boolean;
  isAdmin: boolean;
  replyOpenFor: string | null;
  onReplyToggle: (commentId: string | null) => void;
  onDelete: (commentId: string) => void;
  renderReplyForm: (parent: PublicComment) => ReactNode;
}

function formatTime(iso: string, locale: Locale): string {
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat(locale === 'ko' ? 'ko-KR' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return iso;
  }
}

function CommentItem({
  comment,
  locale,
  isAdmin,
  onDelete,
  showReply,
  onReplyToggle,
  replyOpen,
}: {
  comment: PublicComment;
  locale: Locale;
  isAdmin: boolean;
  onDelete: (id: string) => void;
  showReply: boolean;
  onReplyToggle?: (id: string | null) => void;
  replyOpen?: boolean;
}) {
  const replyLabel = locale === 'ko' ? '답글' : 'Reply';
  const cancelLabel = locale === 'ko' ? '취소' : 'Cancel';
  const deleteLabel = locale === 'ko' ? '삭제' : 'Delete';

  const handleDelete = () => {
    const confirmMsg =
      locale === 'ko' ? '이 댓글을 삭제할까요?' : 'Delete this comment?';
    if (window.confirm(confirmMsg)) onDelete(comment.id);
  };

  return (
    <div className="py-3">
      <div className="flex items-baseline gap-2">
        <span className="text-sm font-medium text-text-primary">{comment.author_name}</span>
        <time className="text-xs text-text-muted">{formatTime(comment.created_at, locale)}</time>
      </div>
      <p className="mt-1 text-sm text-text-secondary whitespace-pre-wrap break-words">{comment.content}</p>
      <div className="mt-2 flex items-center gap-3 text-xs">
        {showReply && onReplyToggle && (
          <button
            type="button"
            onClick={() => onReplyToggle(replyOpen ? null : comment.id)}
            className="text-text-muted hover:text-accent transition-colors"
          >
            {replyOpen ? cancelLabel : replyLabel}
          </button>
        )}
        {isAdmin && (
          <button
            type="button"
            onClick={handleDelete}
            className="text-text-muted hover:text-red-500 transition-colors"
          >
            {deleteLabel}
          </button>
        )}
      </div>
    </div>
  );
}

export default function CommentList({
  trees,
  locale,
  loading,
  isAdmin,
  replyOpenFor,
  onReplyToggle,
  onDelete,
  renderReplyForm,
}: Props) {
  if (loading) {
    return <p className="text-sm text-text-muted">{locale === 'ko' ? '불러오는 중…' : 'Loading…'}</p>;
  }
  if (trees.length === 0) {
    return (
      <p className="text-sm text-text-muted">
        {locale === 'ko' ? '아직 댓글이 없습니다. 첫 댓글을 남겨보세요.' : 'No comments yet. Be the first to comment.'}
      </p>
    );
  }
  return (
    <ul className="divide-y divide-line-default">
      {trees.map(({ root, replies }) => {
        const replyOpen = replyOpenFor === root.id;
        return (
          <li key={root.id}>
            <CommentItem
              comment={root}
              locale={locale}
              isAdmin={isAdmin}
              onDelete={onDelete}
              showReply
              onReplyToggle={onReplyToggle}
              replyOpen={replyOpen}
            />
            {replyOpen && (
              <div className="pl-4 sm:pl-6 mb-2 border-l-2 border-line-default">
                {renderReplyForm(root)}
              </div>
            )}
            {replies.length > 0 && (
              <ul className="pl-4 sm:pl-6 border-l-2 border-line-default">
                {replies.map((r) => (
                  <li key={r.id}>
                    <CommentItem
                      comment={r}
                      locale={locale}
                      isAdmin={isAdmin}
                      onDelete={onDelete}
                      showReply={false}
                    />
                  </li>
                ))}
              </ul>
            )}
          </li>
        );
      })}
    </ul>
  );
}
