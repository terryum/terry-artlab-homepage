import Link from 'next/link';

export function LinkBadge({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center text-[11px] font-medium text-text-muted bg-bg-surface border border-line-default rounded-full px-2.5 py-0.5 hover:text-accent hover:border-accent transition-colors"
    >
      {children}
    </a>
  );
}

export function InternalLinkBadge({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center text-[11px] font-medium text-accent bg-accent/10 border border-accent/30 rounded-full px-2.5 py-0.5 hover:bg-accent/20 hover:border-accent transition-colors"
    >
      {children}
    </Link>
  );
}
