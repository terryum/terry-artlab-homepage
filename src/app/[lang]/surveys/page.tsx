import { isValidLocale, type Locale } from '@/lib/i18n';
import { getDictionary } from '@/lib/dictionaries';
import { getAllSurveys } from '@/lib/surveys';
import { getAudience, filterByAudience } from '@/lib/audience';
import { Container } from '@/components/ui/Container';
import SurveyList from '@/components/surveys/SurveyList';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export function generateStaticParams() {
  return [{ lang: 'ko' }, { lang: 'en' }];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const dict = await getDictionary(lang as Locale);
  return {
    title: dict.surveys.title,
    description: dict.surveys.description,
  };
}

export default async function SurveysPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isValidLocale(lang)) return null;

  const dict = await getDictionary(lang);
  const audience = await getAudience();
  const surveys = filterByAudience(await getAllSurveys(), audience);

  return (
    <Container className="py-10">
      <h1 className="text-2xl font-bold text-text-primary tracking-tight">
        {dict.surveys.title}
      </h1>
      <p className="text-sm text-text-muted mt-2 mb-8">
        {dict.surveys.description}
      </p>

      <SurveyList surveys={surveys} locale={lang} emptyLabel={dict.surveys.empty} />
    </Container>
  );
}
