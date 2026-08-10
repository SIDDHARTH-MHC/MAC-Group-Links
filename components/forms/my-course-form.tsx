"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  useCourseYearPrefs,
} from "@/lib/preferences/course-year";
import { formatCombinationLabel } from "@/lib/courses/mac";
import { YEAR_LABELS } from "@/lib/constants";
import { MacCourseSelect } from "@/components/forms/mac-course-select";
import type { Course } from "@prisma/client";

export function MyCourseForm({ courses }: { courses: Course[] }) {
  const { prefs, setPrefs, loaded } = useCourseYearPrefs();
  const [courseId, setCourseId] = useState(prefs?.courseId ?? "");
  const [year, setYear] = useState(prefs ? String(prefs.year) : "2");
  const [combination, setCombination] = useState(prefs?.combination ?? "");
  const [editing, setEditing] = useState(false);

  if (!loaded) {
    return (
      <div className="h-40 animate-pulse rounded-xl border border-border bg-muted/40" />
    );
  }

  if (prefs && !editing) {
    return (
      <div className="mx-auto max-w-[640px] rounded-xl border border-border bg-card p-5">
        <p className="text-sm text-muted-foreground">You are currently viewing:</p>
        <p className="mt-2 text-lg font-semibold text-foreground">
          {prefs.courseName}
        </p>
        {prefs.combination ? (
          <p className="text-muted-foreground">
            {formatCombinationLabel(prefs.combination)}
          </p>
        ) : null}
        <p className="font-medium text-foreground">
          {YEAR_LABELS[prefs.year] ?? `Year ${prefs.year}`}
        </p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => {
            setCourseId(prefs.courseId);
            setYear(String(prefs.year));
            setCombination(prefs.combination ?? "");
            setEditing(true);
          }}
        >
          Change
        </Button>
      </div>
    );
  }

  if (!prefs && !editing) {
    return (
      <div className="mx-auto max-w-[640px] rounded-xl border border-dashed border-border bg-muted/20 px-6 py-8 text-center">
        <p className="text-muted-foreground">
          Select your course and year to get personalized results.
        </p>
        <Button className="mt-4" size="lg" onClick={() => setEditing(true)}>
          Select Course
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[640px] space-y-4 rounded-xl border border-border bg-card p-5">
      <MacCourseSelect
        courses={courses}
        courseId={courseId}
        onCourseIdChange={setCourseId}
        year={year}
        onYearChange={setYear}
        combination={combination}
        onCombinationChange={setCombination}
        courseSelectId="course-select"
        yearSelectId="year-select"
        comboSelectId="combo-select"
      />
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          className="flex-1"
          size="lg"
          onClick={() => {
            const course = courses.find((c) => c.id === courseId);
            if (!course) return;
            const needsCombo = course.name === "B.A. Programme";
            setPrefs({
              courseId,
              courseName: course.name,
              year: Number(year),
              combination:
                needsCombo && combination ? combination : null,
            });
            setEditing(false);
          }}
        >
          Save selection
        </Button>
        {prefs ? (
          <Button
            variant="ghost"
            onClick={() => {
              setEditing(false);
            }}
          >
            Cancel
          </Button>
        ) : null}
      </div>
      {prefs ? (
        <Button
          variant="link"
          className="w-full text-muted-foreground"
          onClick={() => {
            setPrefs(null);
            setEditing(false);
          }}
        >
          Clear preference
        </Button>
      ) : null}
    </div>
  );
}
