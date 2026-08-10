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

function normalizePrefs(raw: unknown): CourseYearPrefs | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.courseId !== "string" || !o.courseId.trim()) return null;
  const year =
    typeof o.year === "number" ? o.year : Number.parseInt(String(o.year), 10);
  if (!Number.isInteger(year) || year < 1 || year > 4) return null;
  const courseName =
    typeof o.courseName === "string" && o.courseName.trim()
      ? o.courseName.trim()
      : "My course";
  const combination =
    typeof o.combination === "string" && o.combination.trim()
      ? o.combination.trim()
      : null;
  return {
    courseId: o.courseId,
    courseName,
    year,
    combination,
  };
}

let cachedRaw: string | null | undefined;
let cachedPrefs: CourseYearPrefs | null = null;

function invalidatePrefsCache() {
  cachedRaw = undefined;
}

function readPrefs(): CourseYearPrefs | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === cachedRaw) {
      return cachedPrefs;
    }
    cachedRaw = raw;
    if (!raw) {
      cachedPrefs = null;
      return null;
    }
    const parsed = normalizePrefs(JSON.parse(raw));
    if (!parsed) {
      localStorage.removeItem(STORAGE_KEY);
      cachedPrefs = null;
      return null;
    }
    cachedPrefs = parsed;
    return cachedPrefs;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    cachedRaw = null;
    cachedPrefs = null;
    return null;
  }
}

/** True when saved prefs reference a course id that is not in the current list. */
export function prefsCourseMissing(
  prefs: CourseYearPrefs | null,
  courses: { id: string }[],
): boolean {
  if (!prefs) return false;
  return !courses.some((c) => c.id === prefs.courseId);
}

function subscribe(callback: () => void) {
  const onStoreChange = () => {
    invalidatePrefsCache();
    callback();
  };
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}

export function useCourseYearPrefs() {
  const prefs = useSyncExternalStore(
    subscribe,
    readPrefs,
    () => null
  );

  const setPrefs = useCallback((next: CourseYearPrefs | null) => {
    invalidatePrefsCache();
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
