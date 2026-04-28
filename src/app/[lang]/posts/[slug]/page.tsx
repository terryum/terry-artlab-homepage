import 'katex/dist/katex.min.css';
import { notFound, redirect } from 'next/navigation';
import { getPost, getAllPostParams, postExistsForLocale } from '@/lib/posts';
import { buildContentDetailProps } from '@/lib/content-page-helpers';
import ContentDetailPage from '@/components/ContentDetailPage';
import type { Metadata } from 'next';

// Pure SSG for every known slug (public + private/group). MDX is compiled at
// build time on Node — Workers can't run `compileMDX` at runtime because the
// MDX evaluator uses `new Function`, which Workers blocks. Visibility gating
// for private/group slugs runs in middleware (src/middleware.ts) so the page
// itself stays cookie-free and prerenderable. dynamicParams=false makes
// unknown slugs 404 cleanly instead of falling into the OpenNext+Workers
// hybrid-SSG crash documented in feedback_opennext_ssg_dynamicparams.
export const dynamicParams = false;

export async function generateStaticParams() {
  return getAllPostParams();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}): Promise<Metadata> {
  const { lang, slug } = await params;
  const post = await getPost(slug, lang);
  if (!post) {
    // Mirror buildContentDetailProps so metadata and page render agree on
    // the response status. Returning normal metadata with `title: 'Not Found'`
    // makes Next.js commit a 200 response even when the page later throws
    // notFound(); calling notFound() / redirect() here lets the framework set
    // the 404 / 307 status before the page render starts (when the route
    // segment hasn't been prerendered with dynamicParams=true).
    const altLocale = lang === 'ko' ? 'en' : 'ko';
    if (await postExistsForLocale(slug, altLocale)) {
      redirect(`/${altLocale}/posts/${slug}`);
    }
    notFound();
  }

  const title = post.meta.seo_title || post.meta.title;
  const description = post.meta.seo_description || post.meta.summary;
  // og.png 우선 (PNG — 소셜 미리보기 호환성), cover.webp는 페이지 내 표시용
  const ogImage = `/posts/${slug}/og.png`;
  const pageUrl = `/posts/${slug}`;

  return {
    title,
    description,
    ...(post.meta.visibility === 'group' || post.meta.visibility === 'private'
      ? { robots: { index: false, follow: false } }
      : {}),
    openGraph: {
      title,
      description,
      url: pageUrl,
      type: 'article',
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;
  const { locale, post, content, alternateLocale, labels, relatedPosts, taxonomyBreadcrumb, adjacentPosts } =
    await buildContentDetailProps(lang, slug);

  return (
    <ContentDetailPage
      locale={locale}
      meta={post.meta}
      alternateLocale={alternateLocale}
      labels={labels}
      relatedPosts={relatedPosts}
      taxonomyBreadcrumb={taxonomyBreadcrumb}
      adjacentPosts={adjacentPosts}
    >
      {content}
    </ContentDetailPage>
  );
}
