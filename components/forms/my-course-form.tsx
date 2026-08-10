"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useCourseYearPrefs,
  isBaProgrammeCourseName,
} from "@/lib/preferences/course-year";
import { formatCombinationLabel } from "@/lib/courses/mac";
import type { Course } from "@prisma/client";

export function MyCourseForm({
  courses,
  baCombinations,
}: {
  courses: Course[];
  baCombinations: string[];
}) {
  const { prefs, setPrefs, loaded } = useCourseYearPrefs();
  const [courseId, setCourseId] = useState(prefs?.courseId ?? "");
  const [year, setYear] = useState(prefs ? String(prefs.year) : "2");
  const [combination, setCombination] = useState(prefs?.combination ?? "");
  const [editing, setEditing] = useState(false);

  const selectedCourse = courses.find((c) => c.id === courseId);
  const showCombination = isBaProgrammeCourseName(selectedCourse?.name);

  if (!loaded) {
    return (
      <div className="h-40 animate-pulse rounded-xl border border-border bg-muted/40" />
    );
  }

  if (prefs && !editing) {
    return (
      <div className="rounded-xl border border-border bg-card p-5">
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
          {prefs.year === 1
            ? "1st Year"
            : prefs.year === 2
              ? "2nd Year"
              : "3rd Year"}
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
      <div className="rounded-xl border border-dashed border-border bg-muted/20 px-6 py-8 text-center">
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
    <div className="mx-auto max-w-md space-y-4 rounded-xl border border-border bg-card p-5">
      <div>
        <Label htmlFor="course-select">Course</Label>
        <Select
          value={courseId}
          onValueChange={(v) => {
            setCourseId(v ?? "");
            setCombination("");
          }}
        >
          <SelectTrigger id="course-select" className="mt-1.5">
            <SelectValue placeholder="Select course" />
          </SelectTrigger>
          <SelectContent>
            {courses.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {showCombination && (
        <div>
          <Label htmlFor="combo-select">Combination (B.A. Programme)</Label>
          <Select
            value={combination}
            onValueChange={(v) => setCombination(v ?? "")}
          >
            <SelectTrigger id="combo-select" className="mt-1.5">
              <SelectValue placeholder="Select combination" />
            </SelectTrigger>
            <SelectContent>
              {baCombinations.map((combo) => (
                <SelectItem key={combo} value={combo}>
                  {formatCombinationLabel(combo)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <div>
        <Label htmlFor="year-select">Year</Label>
        <Select value={year} onValueChange={(v) => setYear(v ?? "2")}>
          <SelectTrigger id="year-select" className="mt-1.5">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1st Year</SelectItem>
            <SelectItem value="2">2nd Year</SelectItem>
            <SelectItem value="3">3rd Year</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          className="flex-1"
          size="lg"
          onClick={() => {
            const course = courses.find((c) => c.id === courseId);
            if (!course) return;
            setPrefs({
              courseId,
              courseName: course.name,
              year: Number(year),
              combination: showCombination && combination ? combination : null,
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
