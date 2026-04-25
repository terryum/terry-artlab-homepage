import type { ResourceLink, BilingualText } from './common';

export interface ProjectMeta {
  slug: string;
  project_number?: number;
  title: BilingualText;
  description: BilingualText;
  cover_image: string;
  tech_stack: string[];
  links: ResourceLink[];
  embed_url?: string;
  status: 'active' | 'archived' | 'wip';
  featured: boolean;
  order: number;
  published_at: string;
  // ACL
  visibility?: 'public' | 'private' | 'group';
  allowed_groups?: string[];
  /** 'repo' (default): MDX lives in this git repo. 'r2': fetch from R2 private/ prefix. */
  body_source?: 'repo' | 'r2';
}
