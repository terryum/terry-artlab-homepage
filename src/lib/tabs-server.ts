import 'server-only';
import fs from 'fs/promises';
import path from 'path';
import { TAB_CONFIG } from '@/lib/site-config';
import { getTagLabel } from '@/lib/tags';
import type { NavTabItem } from '@/lib/tabs';

const INDEX_PATH = path.join(process.cwd(), 'posts', 'index.json');

/**
 * index.json에서 직접 nav 탭을 생성하는 경량 함수.
 * getAllPosts() 없이 탭 목록만 필요할 때 사용 (layout 등).
 */
export async function getNavTabsFromIndex(locale: string): Promise<NavTabItem[]> {
  const raw = await fs.readFile(INDEX_PATH, 'utf-8');
  const data = JSON.parse(raw) as { posts?: Array<{ content_type?: string }> };
  const posts = data.posts ?? [];

  const counts = new Map<string, number>();
  for (const p of posts) {
    const ct = p.content_type ?? '';
    counts.set(ct, (counts.get(ct) ?? 0) + 1);
  }

  return TAB_CONFIG
    .slice()
    .sort((a, b) => a.order - b.order)
    .filter(tab => (counts.get(tab.slug) ?? 0) > 0)
    .map(tab => ({
      href: `/${locale}/posts?tab=${tab.slug}`,
      label: getTagLabel(tab.slug, locale),
      tabSlug: tab.slug,
      author: tab.author,
    }));
}
