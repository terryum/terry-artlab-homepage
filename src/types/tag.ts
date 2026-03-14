export interface TagDefinition {
  slug: string;
  label: { ko: string; en: string };
  category?: string;
}

export interface TagItem {
  slug: string;
  label: string;
  count: number;
}
