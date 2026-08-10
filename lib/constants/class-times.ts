/** Hour boundaries used on MAC odd/even timetables (contribute form picks). */
export const MAC_CLASS_TIME_BOUNDARIES = [
  "8:30 AM",
  "9:30 AM",
  "10:30 AM",
  "11:30 AM",
  "12:30 PM",
  "1:00 PM",
  "2:00 PM",
  "3:00 PM",
  "4:00 PM",
  "5:00 PM",
] as const;

export const MAC_CLASS_START_TIMES = MAC_CLASS_TIME_BOUNDARIES.slice(0, -1);
export const MAC_CLASS_END_TIMES = MAC_CLASS_TIME_BOUNDARIES.slice(1);

export const CLASS_TIME_EMPTY = "_none_" as const;

export function classTimeOptionsWithCurrent(
  options: readonly string[],
  current: string,
): string[] {
  if (!current) return [...options];
  if (options.includes(current)) return [...options];
  return [current, ...options];
}

/** Timetable PDFs sometimes join multiple slots in one string. */
export function normalizePrefillStartTime(value: string | null | undefined): string {
  if (!value?.trim()) return "";
  return value.split(",")[0]?.trim() ?? value.trim();
}

export function normalizePrefillEndTime(value: string | null | undefined): string {
  if (!value?.trim()) return "";
  const parts = value.split(",").map((p) => p.trim()).filter(Boolean);
  return parts[parts.length - 1] ?? value.trim();
}

export function nextEndAfterStart(start: string): string | undefined {
  const i = MAC_CLASS_TIME_BOUNDARIES.indexOf(
    start as (typeof MAC_CLASS_TIME_BOUNDARIES)[number],
  );
  if (i < 0 || i >= MAC_CLASS_TIME_BOUNDARIES.length - 1) return undefined;
  return MAC_CLASS_TIME_BOUNDARIES[i + 1];
}
