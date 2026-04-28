// Allowed group slugs. Add a new slug here to recognize it across the app.
// Each group also needs a CO_<UPPERCASE_SLUG>_PASSWORD env var that doubles as
// the invite key (see lib/invite-keys.ts).
export const ALLOWED_GROUPS = ['snu'] as const;

export type AllowedGroup = (typeof ALLOWED_GROUPS)[number];

export function isAllowedGroup(group: string): group is AllowedGroup {
  return (ALLOWED_GROUPS as readonly string[]).includes(group);
}

export function envKeyForGroup(group: AllowedGroup): string {
  return `CO_${group.toUpperCase().replace(/-/g, '_')}_PASSWORD`;
}
