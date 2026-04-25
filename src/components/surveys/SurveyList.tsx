import SurveyCard from '@/components/SurveyCard';
import type { SurveyMeta } from '@/types/survey';

interface SurveyListProps {
  surveys: SurveyMeta[];
  locale: string;
  emptyLabel: string;
}

export default function SurveyList({ surveys, locale, emptyLabel }: SurveyListProps) {
  if (surveys.length === 0) {
    return <p className="text-text-muted py-8 text-center">{emptyLabel}</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      {surveys.map((survey) => (
        <SurveyCard key={survey.slug} survey={survey} locale={locale} />
      ))}
    </div>
  );
}
