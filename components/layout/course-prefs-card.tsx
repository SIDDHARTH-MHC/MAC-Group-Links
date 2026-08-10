"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useCourseYearPrefs, formatPrefsLabel } from "@/lib/preferences/course-year";
import { formatCombinationLabel } from "@/lib/courses/mac";

export function CoursePrefsCard() {
  const { prefs } = useCourseYearPrefs();

  if (!prefs) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card/80 px-4 py-4 sm:flex sm:items-center sm:justify-between sm:gap-4">
        <div>
          <p className="font-medium text-foreground">Want to see groups for your course?</p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Optional — saved on this device only. No account needed.
          </p>
        </div>
        <Button asChild className="mt-3 w-full shrink-0 sm:mt-0 sm:w-auto" size="lg">
          <Link href="/my-course">Select course &amp; year</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card px-4 py-4 sm:flex sm:items-center sm:justify-between sm:gap-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Your selection
        </p>
        <p className="mt-1 font-semibold text-foreground">{formatPrefsLabel(prefs)}</p>
        {prefs.combination ? (
          <p className="text-sm text-muted-foreground">
            {formatCombinationLabel(prefs.combination)}
          </p>
        ) : null}
      </div>
      <Button asChild variant="outline" className="mt-3 w-full sm:mt-0 sm:w-auto">
        <Link href="/my-course">Change</Link>
      </Button>
    </div>
  );
}
