'use client';

import { useEffect, useRef } from 'react';
import { trackEvent } from '@/lib/analytics';

interface ProjectEmbedProps {
  slug: string;
  title: string;
  embedUrl: string;
  locale: string;
}

export default function ProjectEmbed({
  slug,
  title,
  embedUrl,
  locale,
}: ProjectEmbedProps) {
  const startRef = useRef(Date.now());

  useEffect(() => {
    trackEvent('project_view', { project_slug: slug, project_title: title });

    // Hide footer on embed pages
    const footer = document.querySelector('footer');
    if (footer) footer.style.display = 'none';

    return () => {
      const seconds = Math.round((Date.now() - startRef.current) / 1000);
      trackEvent('project_time_spent', { project_slug: slug, seconds });
      if (footer) footer.style.display = '';
    };
  }, [slug, title]);

  return (
    <div className="flex flex-col" style={{ height: 'calc(100dvh - 3.5rem)' }}>
      {/* Iframe */}
      <iframe
        src={`${embedUrl}${locale}/`}
        className="flex-1 w-full border-0"
        title={title}
        allow="clipboard-write"
        sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
      />
    </div>
  );
}
