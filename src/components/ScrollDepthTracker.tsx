'use client';

import { useEffect, useRef } from 'react';
import { trackEvent } from '@/lib/analytics';

interface ScrollDepthTrackerProps {
  slug: string;
  contentType: string;
}

const THRESHOLDS = [25, 50, 75, 100] as const;

/**
 * Fires GA4 `scroll_depth` events as the reader passes 25/50/75/100% of the
 * scrollable page. Each threshold fires at most once per mount. Pages that
 * fit in the viewport count as 100% immediately.
 *
 * Reported in the admin Stats page once GA4 has accumulated enough events
 * (typically 24h+ to first appear, 1–2 weeks for meaningful trends).
 */
export default function ScrollDepthTracker({ slug, contentType }: ScrollDepthTrackerProps) {
  const firedRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    firedRef.current = new Set();
    let ticking = false;

    const fire = (pct: number) => {
      if (firedRef.current.has(pct)) return;
      firedRef.current.add(pct);
      trackEvent('scroll_depth', { percent: pct, slug, content_type: contentType });
    };

    const measure = () => {
      ticking = false;
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - window.innerHeight;
      if (scrollable <= 0) {
        fire(100);
        return;
      }
      const reached = ((window.scrollY + window.innerHeight) / doc.scrollHeight) * 100;
      for (const t of THRESHOLDS) {
        if (reached >= t) fire(t);
      }
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [slug, contentType]);

  return null;
}
