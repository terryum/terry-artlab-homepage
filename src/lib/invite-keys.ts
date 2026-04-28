import { ALLOWED_GROUPS, envKeyForGroup } from '@/lib/groups';
import { verifyPassword } from '@/lib/auth-common';

/**
 * Map an invite key (e.g. "snucosmax!") to the group slug it grants access to.
 * Iterates ALLOWED_GROUPS, comparing input to each group's CO_<NAME>_PASSWORD
 * env var via timing-safe compare. Returns null on no match.
 */
export function findGroupForInviteKey(input: string): string | null {
  if (!input) return null;
  for (const group of ALLOWED_GROUPS) {
    const expected = process.env[envKeyForGroup(group)];
    if (verifyPassword(input, expected)) return group;
  }
  return null;
}
