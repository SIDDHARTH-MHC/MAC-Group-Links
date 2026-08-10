"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  combinationsMatch,
  formatCombinationLabel,
  isBaProgrammeCourseName,
} from "@/lib/courses/mac";

const STORAGE_KEY = "mac-group-links-prefs";

export type CourseYearPrefs = {
  courseId: string;
  courseName: string;
  year: number;
  combination?: string | null;
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

export function formatPrefsLabel(prefs: CourseYearPrefs): string {
  const yearLabel =
    prefs.year === 1 ? "1st Year" : prefs.year === 2 ? "2nd Year" : "3rd Year";
  let label = `${prefs.courseName} — ${yearLabel}`;
  if (prefs.combination?.trim()) {
    label += ` (${formatCombinationLabel(prefs.combination)})`;
  }
  return label;
}

export { isBaProgrammeCourseName };
