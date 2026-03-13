import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { LOCALES, DEFAULT_LOCALE, type Locale } from '@/lib/i18n';

export default async function PostSharePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const cookieStore = await cookies();
  const headersList = await headers();

  const savedLang = cookieStore.get('preferred-lang')?.value;
  let locale: Locale = DEFAULT_LOCALE;

  if (savedLang && LOCALES.includes(savedLang as Locale)) {
    locale = savedLang as Locale;
  } else {
    const acceptLang = headersList.get('accept-language') || '';
    if (acceptLang.toLowerCase().startsWith('ko')) {
      locale = 'ko';
    }
  }

  redirect(`/${locale}/posts/${slug}`);
}
