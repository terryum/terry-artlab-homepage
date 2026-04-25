'use client';

import { useEffect, useState } from 'react';
import { TAB_TAG_SLUGS } from '@/lib/site-config';

/**
 * Owns the two URL-synced filter knobs (tags + starred). Keeps the URL in
 * lock-step with state and re-applies state on browser back/forward.
 *
 * The initial-tags fallback is only used during SSR — on the client we
 * always read from window.location.search at mount.
 */
export function useFilterableUrlState(initialSelectedTags: string[]) {
  const [selectedTags, setSelectedTags] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const tagsParam = new URLSearchParams(window.location.search).get('tags');
      if (tagsParam) {
        return tagsParam.split(',').filter((t) => t && !TAB_TAG_SLUGS.has(t));
      }
    }
    return initialSelectedTags;
  });

  const [starredOnly, setStarredOnly] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search).get('starred') === 'true';
    }
    return false;
  });

  // Mirror state → URL.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    const author = params.get('author');
    const next = new URLSearchParams();
    if (tab) next.set('tab', tab);
    else if (author) next.set('author', author);
    if (selectedTags.length > 0) next.set('tags', selectedTags.join(','));
    if (starredOnly) next.set('starred', 'true');
    const qs = next.toString();
    const url = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
    window.history.replaceState(null, '', url);
  }, [selectedTags, starredOnly]);

  // URL → state on browser back/forward.
  useEffect(() => {
    function onPopState() {
      const params = new URLSearchParams(window.location.search);
      const tags = params.get('tags');
      setSelectedTags(tags ? tags.split(',').filter((t) => t && !TAB_TAG_SLUGS.has(t)) : []);
      setStarredOnly(params.get('starred') === 'true');
    }
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  return { selectedTags, setSelectedTags, starredOnly, setStarredOnly };
}
