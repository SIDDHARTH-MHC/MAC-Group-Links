import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatYearLabel(year: number): string {
  const labels: Record<number, string> = {
    1: "1st Year",
    2: "2nd Year",
    3: "3rd Year",
  };
  return labels[year] ?? `${year}th Year`;
}

export function paperTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    SEC: "Skill Enhancement Courses",
    VAC: "Value Addition Courses",
    GE: "Generic Electives",
    DSE: "Discipline Specific Electives",
    AEC: "Ability Enhancement Courses",
    CORE: "Core Papers",
  };
  return labels[type] ?? type;
}

export function formatSemesterLabel(semester: { academicYear: string; semesterNumber: number }): string {
  return `${semester.academicYear} • Semester ${semester.semesterNumber}`;
}

export function normalizeGroupLink(url: string): string {
  return url.trim().replace(/\/$/, "");
}
