import BaseCard from './cards/BaseCard';

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
  return (
    <BaseCard href={href} external={external} thumbnailSrc={image} thumbnailAlt={title}>
      <h3 className="text-base font-[480] text-text-primary group-hover:text-accent transition-colors leading-snug">
        {number && <span className="font-mono text-xs text-text-muted mr-1.5">{number}</span>}
        {title}
      </h3>
      <p className="text-sm text-text-muted mt-1 line-clamp-2 sm:line-clamp-3">{description}</p>
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
    </BaseCard>
  );
}
