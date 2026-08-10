import { combinationsMatch } from "@/lib/courses/mac";

export type EligibilityPrefs = {
  courseId: string;
  courseName?: string;
  year: number;
  combination?: string | null;
};

export function matchesEligibility(
  appliesToAll: boolean,
  courseId: string | null | undefined,
  year: number | null | undefined,
  combination: string | null | undefined,
  prefs: EligibilityPrefs | null,
): boolean {
  if (!prefs) return true;
  if (appliesToAll) return true;
  if (courseId && prefs.courseId !== courseId) return false;
  if (year && prefs.year !== year) return false;
  if (
    combination?.trim() &&
    prefs.combination?.trim() &&
    !combinationsMatch(combination, prefs.combination)
  ) {
    return false;
  }
  return true;
}

export function paperMatchesPrefs(
  eligibilities: {
    appliesToAll: boolean;
    courseId: string | null;
    year: number | null;
    combination: string | null;
  }[],
  prefs: EligibilityPrefs,
): boolean {
  if (eligibilities.length === 0) return true;
  return eligibilities.some((e) =>
    matchesEligibility(
      e.appliesToAll,
      e.courseId,
      e.year,
      e.combination,
      prefs,
    ),
  );
}
