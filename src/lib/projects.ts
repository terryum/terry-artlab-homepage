import type { ProjectMeta } from '@/types/project';
import projectsBundle from '../../projects/gallery/projects.json';

/** Returns every project in the bundle regardless of visibility. */
export async function loadAllProjects(): Promise<ProjectMeta[]> {
  return (projectsBundle as unknown as { projects: ProjectMeta[] }).projects;
}

/** Returns only projects with visibility === 'public' (or undefined). */
export async function loadPublicProjects(): Promise<ProjectMeta[]> {
  const all = await loadAllProjects();
  return all.filter((p) => (p.visibility ?? 'public') === 'public');
}

/**
 * All projects (public + private). List pages render a 🔒 badge for non-public
 * items; detail pages gate access via requireReadAccess.
 *
 * Legacy Supabase private_content still merges for authenticated sessions
 * until the R2 migration completes.
 */
export async function getAllProjects(): Promise<ProjectMeta[]> {
  const fromIndex = [...(await loadAllProjects())];

  const { getAuthenticatedGroup, isAdminSession } = await import('@/lib/group-auth');
  const [group, admin] = await Promise.all([getAuthenticatedGroup(), isAdminSession()]);
  if (group || admin) {
    const { getAllPrivateProjects, getPrivateProjects } = await import('@/lib/private-content');
    const legacy = admin
      ? await getAllPrivateProjects()
      : group ? await getPrivateProjects(group) : [];
    const seen = new Set(fromIndex.map((p) => p.slug));
    for (const p of legacy) {
      if (!seen.has(p.slug)) fromIndex.push(p);
    }
  }

  return fromIndex.sort(
    (a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
  );
}

export async function getProject(slug: string): Promise<ProjectMeta | null> {
  const fromIndex = (await loadAllProjects()).find((p) => p.slug === slug) ?? null;
  if (fromIndex) return fromIndex;

  // Legacy Supabase fallback (transitional until R2 migration).
  const { getAuthenticatedGroup, isAdminSession } = await import('@/lib/group-auth');
  const [group, admin] = await Promise.all([getAuthenticatedGroup(), isAdminSession()]);
  if (!group && !admin) return null;

  const { getPrivateProject } = await import('@/lib/private-content');
  const legacy = await getPrivateProject(slug);
  if (!legacy) return null;
  if (legacy.visibility === 'group' && !admin) {
    if (!group || !(legacy.allowed_groups?.includes(group))) return null;
  }
  return legacy;
}
