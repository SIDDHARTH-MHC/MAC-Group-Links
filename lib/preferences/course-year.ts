"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  formatCombinationLabel,
  isBaProgrammeCourseName,
} from "@/lib/courses/mac";
import { YEAR_LABELS } from "@/lib/constants";
import {
  matchesEligibility as matchEligibility,
  type EligibilityPrefs,
} from "@/lib/eligibility-match";

const STORAGE_KEY = "mac-group-links-prefs";

export type CourseYearPrefs = EligibilityPrefs & {
  courseName: string;
};

function readPrefs(): CourseYearPrefs | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as CourseYearPrefs;
  } catch {
    return null;
  }
  return null;
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

export function useCourseYearPrefs() {
  const prefs = useSyncExternalStore(
    subscribe,
    readPrefs,
    () => null
  );

  const setPrefs = useCallback((next: CourseYearPrefs | null) => {
    if (next) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
    window.dispatchEvent(new Event("storage"));
  }, []);

  return { prefs, setPrefs, loaded: true };
}

export function matchesEligibility(
  appliesToAll: boolean,
  courseId: string | null | undefined,
  year: number | null | undefined,
  combination: string | null | undefined,
  prefs: CourseYearPrefs | null,
): boolean {
  return matchEligibility(
    appliesToAll,
    courseId,
    year,
    combination,
    prefs,
  );
}

export function formatPrefsLabel(prefs: CourseYearPrefs): string {
  const yearLabel = YEAR_LABELS[prefs.year] ?? `Year ${prefs.year}`;
  let label = `${prefs.courseName} — ${yearLabel}`;
  if (prefs.combination?.trim()) {
    label += ` (${formatCombinationLabel(prefs.combination)})`;
  }
  return label;
}

export { isBaProgrammeCourseName };
