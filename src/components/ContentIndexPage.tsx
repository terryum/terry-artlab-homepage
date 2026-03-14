import ContentCard from './ContentCard';
import FilterablePostList from './FilterablePostList';
import { Container } from './ui/Container';
import type { PostMeta } from '@/types/post';
import type { TagItem } from '@/types/tag';

interface FilterDict {
  show_more: string;
  show_less: string;
  no_results: string;
}

interface TabTitleEntry {
  title: string;
  description: string;
}

interface ContentIndexPageProps {
  locale: string;
  title: string;
  description: string;
  posts: PostMeta[];
  allTags?: TagItem[];
  initialSelectedTags?: string[];
  filterDict?: FilterDict;
  tabTitles?: Record<string, TabTitleEntry>;
}

export default function ContentIndexPage({
  locale,
  title,
  description,
  posts,
  allTags,
  initialSelectedTags,
  filterDict,
  tabTitles,
}: ContentIndexPageProps) {
  return (
    <Container className="py-10">
      {allTags && filterDict ? (
        <FilterablePostList
          locale={locale}
          posts={posts}
          allTags={allTags}
          initialSelectedTags={initialSelectedTags || []}
          showMoreLabel={filterDict.show_more}
          showLessLabel={filterDict.show_less}
          noResultsLabel={filterDict.no_results}
          defaultTitle={title}
          defaultDescription={description}
          tabTitles={tabTitles}
        />
      ) : (
        <>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">{title}</h1>
          <p className="text-sm text-text-muted mt-2 mb-8">{description}</p>
          {posts.length === 0 ? (
            <p className="text-text-muted py-8 text-center">No posts yet.</p>
          ) : (
            <div>
              {posts.map((post) => (
                <ContentCard key={post.post_id} post={post} locale={locale} />
              ))}
            </div>
          )}
        </>
      )}
    </Container>
  );
}
