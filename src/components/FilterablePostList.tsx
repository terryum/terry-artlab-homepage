'use client';

import { useState, useCallback, useMemo, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import TagFilterBar from './TagFilterBar';
import ContentCard from './ContentCard';
import TaxonomyFilter from './TaxonomyFilter';
import { normalizeTagSlug } from '@/lib/tags';
import { TAB_TAG_SLUGS } from '@/lib/site-config';
import { getPostsForTab } from '@/lib/tabs';
import { getDisplayTags } from '@/lib/display';
import type { PostMeta } from '@/types/post';
import type { TagItem } from '@/types/tag';
import type { TaxonomyNodeData } from '@/lib/content-page-helpers';
import type { Locale } from '@/lib/i18n';

interface TabTitleEntry {
  title: string;
  description: string;
}

interface FilterablePostListProps {
  locale: Locale;
  posts: PostMeta[];
  allTags: TagItem[];
  initialSelectedTags: string[];
  showMoreLabel: string;
  showLessLabel: string;
  noResultsLabel: string;
  defaultTitle: string;
  defaultDescription: string;
  tabTitles?: Record<string, TabTitleEntry>;
  taxonomyNodes?: Record<string, TaxonomyNodeData>;
  taxonomyStats?: Record<string, number>;
}

function FilterablePostListInner({
  locale,
  posts,
  allTags,
  initialSelectedTags,
  showMoreLabel,
  showLessLabel,
  noResultsLabel,
  defaultTitle,
  defaultDescription,
  tabTitles,
  taxonomyNodes = {},
  taxonomyStats = {},
}: FilterablePostListProps) {
  const searchParams = useSearchParams();
  const selectedTab = searchParams.get('tab');

  const [selectedTags, setSelectedTags] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tagsParam = params.get('tags');
      if (tagsParam) {
        return tagsParam.split(',').filter(t => t && !TAB_TAG_SLUGS.has(t));
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

  const [selectedTaxonomy, setSelectedTaxonomy] = useState<string | null>(null);

  // Reset tags, starred, and taxonomy when tab changes
  const prevTabRef = useRef(selectedTab);
  useEffect(() => {
    if (prevTabRef.current !== selectedTab) {
      prevTabRef.current = selectedTab;
      setSelectedTags([]);
      setStarredOnly(false);
      setSelectedTaxonomy(null);
    }
  }, [selectedTab]);

  // Reset tags when taxonomy changes (selected tags may not exist in new scope)
  const prevTaxonomyRef = useRef(selectedTaxonomy);
  useEffect(() => {
    if (prevTaxonomyRef.current !== selectedTaxonomy) {
      prevTaxonomyRef.current = selectedTaxonomy;
      setSelectedTags([]);
    }
  }, [selectedTaxonomy]);

  // Sync tags and starred to URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const currentTab = params.get('tab');
    const newParams = new URLSearchParams();
    if (currentTab) newParams.set('tab', currentTab);
    if (selectedTags.length > 0) {
      newParams.set('tags', selectedTags.join(','));
    }
    if (starredOnly) newParams.set('starred', 'true');
    const qs = newParams.toString();
    const newUrl = qs
      ? `${window.location.pathname}?${qs}`
      : window.location.pathname;
    window.history.replaceState(null, '', newUrl);
  }, [selectedTags, starredOnly]);

  // Listen for popstate (back/forward)
  useEffect(() => {
    function onPopState() {
      const params = new URLSearchParams(window.location.search);
      const tags = params.get('tags');
      setSelectedTags(tags ? tags.split(',').filter(t => t && !TAB_TAG_SLUGS.has(t)) : []);
      setStarredOnly(params.get('starred') === 'true');
    }
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const handleToggle = useCallback((slug: string) => {
    setSelectedTags((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  }, []);

  // 1st pass: filter by tab
  const tabFilteredPosts = useMemo(() => {
    if (!selectedTab) return posts;
    return getPostsForTab(posts, selectedTab);
  }, [posts, selectedTab]);

  // 2nd pass: filter by taxonomy (before tags, so tags reflect taxonomy scope)
  const taxonomyFilteredPosts = useMemo(() => {
    if (!selectedTaxonomy) return tabFilteredPosts;
    const matchNodes = new Set<string>();
    function collectDescendants(nodeId: string) {
      matchNodes.add(nodeId);
      const n = taxonomyNodes[nodeId];
      for (const child of n?.children ?? []) collectDescendants(child);
    }
    collectDescendants(selectedTaxonomy);
    return tabFilteredPosts.filter(p =>
      (p.taxonomy_primary && matchNodes.has(p.taxonomy_primary)) ||
      (p.taxonomy_secondary || []).some(s => matchNodes.has(s))
    );
  }, [tabFilteredPosts, selectedTaxonomy, taxonomyNodes]);

  // 3rd pass: filter by topic tags (within taxonomy scope)
  const tagFilteredPosts = useMemo(() => {
    if (selectedTags.length === 0) return taxonomyFilteredPosts;
    return taxonomyFilteredPosts.filter((post) => {
      const postTagSlugs = getDisplayTags(post).map((t) => normalizeTagSlug(t));
      return selectedTags.every((sel) => postTagSlugs.includes(sel));
    });
  }, [taxonomyFilteredPosts, selectedTags]);

  // 4th pass: filter by starred
  const finalPosts = useMemo(() => {
    if (!starredOnly) return tagFilteredPosts;
    return tagFilteredPosts.filter(p => p.starred);
  }, [tagFilteredPosts, starredOnly]);

  // Available tags: computed from taxonomy-filtered posts (so counts reflect taxonomy scope)
  const availableTags = useMemo(() => {
    const tagCounts = new Map<string, number>();
    for (const post of taxonomyFilteredPosts) {
      for (const tag of getDisplayTags(post)) {
        const slug = normalizeTagSlug(tag);
        if (!TAB_TAG_SLUGS.has(slug)) {
          tagCounts.set(slug, (tagCounts.get(slug) || 0) + 1);
        }
      }
    }

    return Array.from(tagCounts.entries())
      .map(([slug, count]) => {
        const existing = allTags.find((t) => t.slug === slug);
        return { slug, label: existing?.label || slug, count };
      })
      .sort((a, b) => b.count - a.count);
  }, [allTags, taxonomyFilteredPosts]);

  const currentTitle = (selectedTab && tabTitles?.[selectedTab]?.title) || defaultTitle;
  const currentDescription = (selectedTab && tabTitles?.[selectedTab]?.description) || defaultDescription;

  const hasTaxonomy = selectedTab === 'papers' && Object.keys(taxonomyNodes).length > 0;

  return (
    <div>
      <h1 className="text-2xl font-bold text-text-primary tracking-tight">{currentTitle}</h1>
      <p className="text-sm text-text-muted mt-2 mb-8">{currentDescription}</p>

      <div className="lg:flex lg:gap-8 lg:items-start">

        {/* 왼쪽 사이드바: PC(lg+)에서만, Papers + taxonomy 있을 때 */}
        {hasTaxonomy && (
          <aside className="hidden lg:block w-52 shrink-0">
            <div className="sticky top-24">
              <TaxonomyFilter
                variant="sidebar"
                locale={locale}
                nodes={taxonomyNodes}
                stats={taxonomyStats}
                selectedTaxonomy={selectedTaxonomy}
                onSelect={setSelectedTaxonomy}
              />
            </div>
          </aside>
        )}

        {/* 오른쪽 메인 (또는 전체 너비) */}
        <div className="flex-1 min-w-0">

          {/* 모바일 taxonomy: inline card */}
          {hasTaxonomy && (
            <div className="lg:hidden">
              <TaxonomyFilter
                variant="inline"
                locale={locale}
                nodes={taxonomyNodes}
                stats={taxonomyStats}
                selectedTaxonomy={selectedTaxonomy}
                onSelect={setSelectedTaxonomy}
              />
            </div>
          )}

          {selectedTab === 'papers' && (
            <button
              onClick={() => setStarredOnly(v => !v)}
              className={`mb-3 inline-flex items-center gap-1.5 text-sm px-3 py-1 rounded-full border transition-colors ${
                starredOnly
                  ? 'bg-amber-50 border-amber-300 text-amber-700 dark:bg-amber-900/30 dark:border-amber-600 dark:text-amber-400'
                  : 'border-line-default text-text-muted hover:border-amber-300 hover:text-amber-600'
              }`}
            >
              <span>★</span>
              <span>Seminal</span>
            </button>
          )}

          <TagFilterBar
            availableTags={availableTags}
            selectedSlugs={selectedTags}
            onToggle={handleToggle}
            showMoreLabel={showMoreLabel}
            showLessLabel={showLessLabel}
          />

          {finalPosts.length === 0 ? (
            <p className="text-text-muted py-8 text-center">{noResultsLabel}</p>
          ) : (
            <div>
              {finalPosts.map((post) => (
                <ContentCard key={post.post_id} post={post} locale={locale} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function FilterablePostList(props: FilterablePostListProps) {
  return (
    <Suspense fallback={
      <div>
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">{props.defaultTitle}</h1>
        <p className="text-sm text-text-muted mt-2 mb-8">{props.defaultDescription}</p>
      </div>
    }>
      <FilterablePostListInner {...props} />
    </Suspense>
  );
}
