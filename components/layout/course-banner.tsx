"use client";

import Link from "next/link";
import { useCourseYearPrefs } from "@/lib/preferences/course-year";
import { formatYearLabel } from "@/lib/utils";

export function CoursePreferenceBanner() {
  const { prefs } = useCourseYearPrefs();

  if (!prefs) {
    return (
      <div className="rounded-2xl border border-dashed border-amber-300 bg-amber-50/80 px-4 py-3 text-sm text-amber-950">
        Tip: Set your course and year on{" "}
        <Link href="/my-course" className="font-semibold underline">
          My Course
        </Link>{" "}
        to see the most relevant groups first.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-800">
      Showing groups relevant to{" "}
      <span className="font-semibold">
        {prefs.courseName} — {formatYearLabel(prefs.year)}
      </span>
      .{" "}
      <Link href="/my-course" className="font-medium text-amber-800 underline">
        Change
      </Link>
    </div>
  );
}
