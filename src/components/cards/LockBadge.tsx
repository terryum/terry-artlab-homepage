type Visibility = 'public' | 'private' | 'group';

interface LockBadgeProps {
  visibility?: Visibility;
  allowedGroups?: string[];
  locale?: string;
  className?: string;
  prefix?: string;
}

/**
 * 🔒 indicator for non-public content. Renders nothing when visibility is
 * 'public' or undefined. Title is localized when `locale` is supplied;
 * defaults to English (the ContentCard/ProjectCard style). Callers control
 * positioning via `className` and an optional `prefix` (SurveyCard uses
 * '· ' to separate from a leading number).
 */
export default function LockBadge({
  visibility,
  allowedGroups,
  locale,
  className = 'inline-block mr-1 text-text-muted',
  prefix = '',
}: LockBadgeProps) {
  if (!visibility || visibility === 'public') return null;

  const ko = locale === 'ko';
  // No locale → admin-style detail (shows allowed groups by name).
  // locale='ko' / 'en' → reader-facing simplified text.
  const groupTitle = !locale
    ? `Restricted: ${(allowedGroups ?? []).join(', ')}`
    : ko
      ? '그룹 회원 전용'
      : 'Group members only';
  const privateTitle = ko ? '비공개' : 'Private';
  const title = visibility === 'group' ? groupTitle : privateTitle;

  return (
    <span className={className} title={title} aria-label="Restricted content">
      {prefix}🔒
    </span>
  );
}
