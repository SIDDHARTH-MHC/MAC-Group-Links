export const MAC_WEEKDAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
] as const;

export type MacWeekday = (typeof MAC_WEEKDAYS)[number];

export function parseClassDays(value: string): MacWeekday[] {
  if (!value.trim()) return [];
  const picked = new Set<string>();
  for (const part of value.split(",").map((s) => s.trim()).filter(Boolean)) {
    const canon = MAC_WEEKDAYS.find(
      (d) => d.toLowerCase() === part.toLowerCase(),
    );
    if (canon) picked.add(canon);
  }
  return MAC_WEEKDAYS.filter((d) => picked.has(d));
}

export function formatClassDays(days: readonly string[]): string {
  return MAC_WEEKDAYS.filter((d) => days.includes(d)).join(", ");
}

export function toggleClassDay(value: string, day: MacWeekday): string {
  const selected = parseClassDays(value);
  const next = selected.includes(day)
    ? selected.filter((d) => d !== day)
    : [...selected, day];
  return formatClassDays(next);
}
