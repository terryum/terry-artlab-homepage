import type { PostMeta } from '@/types/post';

/**
 * display_tags가 있으면 display_tags, 없으면 tags를 반환.
 * UI 노출용 태그는 항상 이 함수를 통해 가져온다.
 */
export function getDisplayTags(post: PostMeta): string[] {
  return post.display_tags?.length ? post.display_tags : post.tags;
}

/**
 * 날짜 문자열을 locale에 맞는 형식으로 포맷팅.
 * options 기본값: { year: 'numeric', month: 'long', day: 'numeric' }
 */
export function formatPostDate(
  date: string,
  locale: string,
  options?: Intl.DateTimeFormatOptions
): string {
  return new Date(date).toLocaleDateString(
    locale === 'ko' ? 'ko-KR' : 'en-US',
    options ?? { year: 'numeric', month: 'long', day: 'numeric' }
  );
}
