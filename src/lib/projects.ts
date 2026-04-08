import fs from 'fs/promises';
import path from 'path';
import { getAuthenticatedGroup, isAdminSession } from '@/lib/group-auth';
import { getPrivateProjects, getPrivateProject, getAllPrivateProjects } from '@/lib/private-content';
import type { ProjectMeta } from '@/types/project';

const PROJECTS_PATH = path.join(process.cwd(), 'projects', 'gallery', 'projects.json');

export async function loadPublicProjects(): Promise<ProjectMeta[]> {
  const raw = await fs.readFile(PROJECTS_PATH, 'utf-8');
  return (JSON.parse(raw) as { projects: ProjectMeta[] }).projects;
}

export async function getAllProjects(): Promise<ProjectMeta[]> {
  const [publicProjects, group, admin] = await Promise.all([
    loadPublicProjects(),
    getAuthenticatedGroup(),
    isAdminSession(),
  ]);

  const projects = [...publicProjects];

  // Merge private projects from Supabase if authenticated
  if (group || admin) {
    const privateProjects = admin
      ? await getAllPrivateProjects()
      : group ? await getPrivateProjects(group) : [];
    const existingSlugs = new Set(projects.map(p => p.slug));
    for (const pp of privateProjects) {
      if (!existingSlugs.has(pp.slug)) projects.push(pp);
    }
  }

  return projects.sort((a, b) =>
    new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
  );
}

export async function getProject(slug: string): Promise<ProjectMeta | null> {
  // Try public projects first
  const publicProjects = await loadPublicProjects();
  const project = publicProjects.find(p => p.slug === slug) ?? null;
  if (project) return project;

  // Fallback: try Supabase private projects (with auth check)
  const [group, admin] = await Promise.all([
    getAuthenticatedGroup(),
    isAdminSession(),
  ]);
  if (!group && !admin) return null;

  const privateProject = await getPrivateProject(slug);
  if (!privateProject) return null;

  // Verify access
  if (privateProject.visibility === 'group' && !admin) {
    if (!group || !(privateProject.allowed_groups?.includes(group))) return null;
  }

  return privateProject;
}
