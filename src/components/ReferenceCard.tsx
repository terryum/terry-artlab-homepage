interface Reference {
  title: string;
  author?: string;
  description: string;
  arxiv_url?: string;
  scholar_url?: string;
}

function LinkBadge({ href, children }: { href: string; children: React.ReactNode }) {
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

export default function ReferenceCard({ reference }: { reference: Reference }) {
  const titleEl = reference.arxiv_url ? (
    <a
      href={reference.arxiv_url}
      target="_blank"
      rel="noopener noreferrer"
      className="hover:text-accent transition-colors"
    >
      {reference.title}
    </a>
  ) : (
    reference.title
  );

  return (
    <div className="border border-line-default rounded-lg p-4 text-sm bg-bg-surface/40">
      {/* Link badges (top) */}
      <div className="flex items-center gap-1.5 mb-3">
        {reference.arxiv_url && <LinkBadge href={reference.arxiv_url}>arXiv</LinkBadge>}
        {reference.scholar_url && <LinkBadge href={reference.scholar_url}>Google Scholar</LinkBadge>}
      </div>

      {/* Title */}
      <p className="text-text-primary font-medium leading-snug">{titleEl}</p>

      {/* Author */}
      {reference.author && (
        <p className="text-text-muted text-xs mt-1">{reference.author}</p>
      )}

      {/* Description */}
      <p className="text-text-muted text-xs mt-1">{reference.description}</p>
    </div>
  );
}
