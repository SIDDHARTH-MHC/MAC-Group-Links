import type { PaperType, GroupPlatform, ContributorType } from "@prisma/client";

export const PAPER_TYPE_LABELS: Record<
  PaperType,
  { short: string; title: string }
> = {
  SEC: { short: "SEC", title: "Skill Enhancement Courses" },
  VAC: { short: "VAC", title: "Value Addition Courses" },
  GE: { short: "GE", title: "Generic Electives" },
  DSE: { short: "DSE", title: "Discipline Specific Electives" },
  AEC: { short: "AEC", title: "Ability Enhancement Courses" },
  CORE: { short: "CORE", title: "Core Papers" },
};

export const PAPER_TYPES = Object.keys(PAPER_TYPE_LABELS) as PaperType[];

export const PLATFORM_LABELS: Record<GroupPlatform, string> = {
  WHATSAPP: "WhatsApp",
  TELEGRAM: "Telegram",
  OTHER: "Other",
};

export const CONTRIBUTOR_LABELS: Record<ContributorType, string> = {
  STUDENT: "Student",
  PROFESSOR: "Professor",
  OTHER: "Other",
};

export const YEAR_LABELS: Record<number, string> = {
  1: "1st Year",
  2: "2nd Year",
  3: "3rd Year",
};

export function formatEligibility(
  appliesToAll: boolean,
  courseName: string | null | undefined,
  year: number | null | undefined,
  combination?: string | null
): string {
  if (appliesToAll) return "All students taking this paper";
  const parts: string[] = [];
  if (courseName) parts.push(courseName);
  if (year) parts.push(YEAR_LABELS[year] ?? `Year ${year}`);
  if (combination) parts.push(combination);
  return parts.join(" — ") || "Not specified";
}

export function normalizeGroupLink(url: string): string {
  const trimmed = url.trim();
  try {
    const parsed = new URL(trimmed);
    parsed.hostname = parsed.hostname.toLowerCase();
    const pathname = parsed.pathname.replace(/\/$/, "") || "/";
    parsed.pathname = pathname;
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return trimmed.replace(/\/$/, "").toLowerCase();
  }
}

export function groupLinkFields(url: string) {
  const normalized = normalizeGroupLink(url);
  return { groupLink: url.trim(), normalizedGroupLink: normalized };
}

export function isValidGroupUrl(url: string): boolean {
  try {
    const parsed = new URL(url.trim());
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function paperTypeFromParam(param: string): PaperType | null {
  const upper = param.toUpperCase();
  if (PAPER_TYPES.includes(upper as PaperType)) {
    return upper as PaperType;
  }
  return null;
}

export function matchesUserEligibilityWithIds(
  eligibilities: Array<{
    appliesToAll: boolean;
    courseId: string | null;
    year: number | null;
  }>,
  courseId: string | null,
  year: number | null,
): boolean {
  if (!courseId && !year) return true;
  return eligibilities.some((e) => {
    if (e.appliesToAll) return true;
    const courseOk = !courseId || e.courseId === courseId || e.courseId === null;
    const yearOk = !year || e.year === year || e.year === null;
    return courseOk && yearOk;
  });
}

/** Public-facing term name (MAC/DU cycle), not the internal semester number. */
export function semesterTermLabel(semesterNumber: number): string {
  if ([1, 3, 5, 7].includes(semesterNumber)) {
    return "Odd Semester August - DEC";
  }
  if ([2, 4, 6, 8].includes(semesterNumber)) {
    return "Even Semester January - June";
  }
  return `Semester ${semesterNumber}`;
}

export function cnSemesterLabel(academicYear: string, semesterNumber: number) {
  return `${academicYear} • ${semesterTermLabel(semesterNumber)}`;
}
