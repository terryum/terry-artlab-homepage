import Link from 'next/link';
import Image from 'next/image';

interface CompactCardProps {
  href: string;
  image?: string;
  title: string;
  description: string;
  number?: string;
  date?: string;
  tags?: string[];
  external?: boolean;
}

export default function CompactCard({
  href,
  image,
  title,
  description,
  number,
  date,
  tags,
  external,
}: CompactCardProps) {
  const inner = (
    <article className="flex gap-4 sm:gap-6">
      {/* Thumbnail */}
      {image && (
        <div className="flex-shrink-0 w-20 h-20 sm:w-36 sm:h-36 relative rounded overflow-hidden bg-bg-surface">
          <Image
            src={image}
            alt={title}
            fill
            className="object-cover"
            sizes="(min-width: 640px) 144px, 80px"
            unoptimized={image.startsWith('/api/')}
          />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h3 className="text-base font-[480] text-text-primary group-hover:text-accent transition-colors leading-snug">
          {number && (
            <span className="font-mono text-xs text-text-muted mr-1.5">{number}</span>
          )}
          {title}
        </h3>
        <p className="text-sm text-text-muted mt-1 line-clamp-2 sm:line-clamp-3">
          {description}
        </p>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {date && <time className="text-xs text-text-muted">{date}</time>}
          {tags?.map((tag) => (
            <span
              key={tag}
              className="text-[11px] px-2 py-0.5 rounded-full bg-bg-surface text-text-muted"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </article>
  );

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="block group py-4 first:pt-0">
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
