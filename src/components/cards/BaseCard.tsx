import Link from 'next/link';
import Image from 'next/image';
import type { ReactNode } from 'react';
import { isUnoptimizedImage } from '@/lib/card-utils';

interface BaseCardProps {
  href: string;
  external?: boolean;
  thumbnailSrc?: string;
  thumbnailAlt: string;
  thumbnailFit?: 'cover' | 'contain';
  children: ReactNode;
}

/**
 * Horizontal card shell shared by ContentCard and CompactCard.
 *
 * - Owns the Link/a switch (external opens in a new tab).
 * - Owns the thumbnail box (w-20 sm:w-36 with optional 'contain' wrapper for
 *   transparent figures).
 * - Renders `children` in the content column (flex-1, min-w-0).
 *
 * Callers compose title/meta/summary/footer themselves, so per-card
 * decorators (star, post_number, locale formatting, tab tag, etc.) stay
 * close to the data they need.
 */
export default function BaseCard({
  href,
  external,
  thumbnailSrc,
  thumbnailAlt,
  thumbnailFit = 'cover',
  children,
}: BaseCardProps) {
  const inner = (
    <article className="flex gap-4 sm:gap-6">
      {thumbnailSrc && (
        <div className="flex-shrink-0 w-20 h-20 sm:w-36 sm:h-36 relative rounded overflow-hidden bg-bg-surface">
          {thumbnailFit === 'contain' ? (
            <div className="absolute inset-1 sm:inset-3 bg-bg-surface">
              <Image
                src={thumbnailSrc}
                alt={thumbnailAlt}
                fill
                className="object-contain"
                sizes="(min-width: 640px) 120px, 72px"
                unoptimized
              />
            </div>
          ) : (
            <Image
              src={thumbnailSrc}
              alt={thumbnailAlt}
              fill
              className="object-cover"
              sizes="(min-width: 640px) 144px, 80px"
              unoptimized={isUnoptimizedImage(thumbnailSrc)}
            />
          )}
        </div>
      )}

      <div className="flex-1 min-w-0">{children}</div>
    </article>
  );

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="block group py-4 first:pt-0"
      >
        {inner}
      </a>
    );
  }

  return (
    <Link href={href} className="block group py-4 first:pt-0">
      {inner}
    </Link>
  );
}
