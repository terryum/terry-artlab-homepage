import ProjectCard from '@/components/ProjectCard';
import type { ProjectMeta } from '@/types/project';

interface ProjectListProps {
  projects: ProjectMeta[];
  locale: string;
  emptyLabel: string;
}

export default function ProjectList({ projects, locale, emptyLabel }: ProjectListProps) {
  if (projects.length === 0) {
    return <p className="text-text-muted py-8 text-center">{emptyLabel}</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      {projects.map((project) => (
        <ProjectCard key={project.slug} project={project} locale={locale} />
      ))}
    </div>
  );
}
