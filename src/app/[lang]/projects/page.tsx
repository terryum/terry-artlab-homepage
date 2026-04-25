import { isValidLocale, type Locale } from '@/lib/i18n';
import { getDictionary } from '@/lib/dictionaries';
import { getAllProjects } from '@/lib/projects';
import { Container } from '@/components/ui/Container';
import ProjectList from '@/components/projects/ProjectList';
import type { Metadata } from 'next';

// Fully static

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
    title: dict.projects.title,
    description: dict.projects.description,
  };
}

export default async function ProjectsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isValidLocale(lang)) return null;

  const dict = await getDictionary(lang);
  const projects = await getAllProjects();

  return (
    <Container className="py-10">
      <h1 className="text-2xl font-bold text-text-primary tracking-tight">
        {dict.projects.title}
      </h1>
      <p className="text-sm text-text-muted mt-2 mb-8">
        {dict.projects.description}
      </p>

      <ProjectList projects={projects} locale={lang} emptyLabel={dict.projects.empty} />
    </Container>
  );
}
