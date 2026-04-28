interface NumberedItem {
  post_number?: number;
  survey_number?: number;
  project_number?: number;
}

function getNumber(item: NumberedItem): number {
  return item.post_number ?? item.survey_number ?? item.project_number ?? 0;
}

export function byNumberDesc<T extends NumberedItem>(a: T, b: T): number {
  return getNumber(b) - getNumber(a);
}

export function sortByNumberDesc<T extends NumberedItem>(items: T[]): T[] {
  return items.slice().sort(byNumberDesc);
}
