import 'server-only';
import { redirect } from 'next/navigation';
import { getAuthenticatedGroup, isAdminSession } from '@/lib/group-auth';

export type Visibility = 'public' | 'private' | 'group';

export interface AccessMeta {
  visibility?: Visibility;
  allowed_groups?: string[];
}

/**
 * Enforce read access for a piece of content.
 *
 * - `public` (or undefined): no-op.
 * - `private`: admin session only. Otherwise redirect to /login.
 * - `group`: admin session OR session group ∈ allowed_groups. Otherwise redirect.
 *
 * `currentPath` should be the canonical pathname the reader is trying to reach
 * (e.g. `/ko/posts/<slug>`) so that login can bounce them back.
 */
export async function requireReadAccess(
  meta: AccessMeta,
  currentPath: string
): Promise<void> {
  const visibility = meta.visibility ?? 'public';
  if (visibility === 'public') return;

  if (await isAdminSession()) return;

  if (visibility === 'group') {
    const group = await getAuthenticatedGroup();
    const allowed = meta.allowed_groups ?? [];
    if (group && allowed.includes(group)) return;
  }

  redirect(`/login?redirect=${encodeURIComponent(currentPath)}`);
}

/**
 * Pure predicate: does the *current session* have read access to this meta?
 * Used for list pages that want to mark locked items without redirecting.
 */
export async function canReadContent(meta: AccessMeta): Promise<boolean> {
  const visibility = meta.visibility ?? 'public';
  if (visibility === 'public') return true;
  if (await isAdminSession()) return true;
  if (visibility === 'group') {
    const group = await getAuthenticatedGroup();
    const allowed = meta.allowed_groups ?? [];
    return !!group && allowed.includes(group);
  }
  return false;
}
