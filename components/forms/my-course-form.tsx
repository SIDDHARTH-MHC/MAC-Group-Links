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
import { useCourseYearPrefs } from "@/lib/preferences/course-year";
import type { Course } from "@prisma/client";

export function MyCourseForm({ courses }: { courses: Course[] }) {
  const { prefs, setPrefs, loaded } = useCourseYearPrefs();
  const [courseId, setCourseId] = useState(prefs?.courseId ?? "");
  const [year, setYear] = useState(prefs ? String(prefs.year) : "1");

  if (!loaded) return <p className="text-sm">Loading…</p>;

  return (
    <div className="mx-auto max-w-md space-y-4 rounded-xl border border-amber-100 bg-white p-5">
      <p className="text-sm text-amber-900/70">
        Saved on this device only — no account needed. Used to highlight relevant
        groups.
      </p>
      <div>
        <Label>Course</Label>
        <Select value={courseId} onValueChange={(v) => setCourseId(v ?? "")}>
          <SelectTrigger>
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
      <div>
        <Label>Year</Label>
        <Select value={year} onValueChange={(v) => setYear(v ?? "2")}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1st Year</SelectItem>
            <SelectItem value="2">2nd Year</SelectItem>
            <SelectItem value="3">3rd Year</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button
        className="w-full"
        onClick={() => {
          const course = courses.find((c) => c.id === courseId);
          if (!course) return;
          setPrefs({
            courseId,
            courseName: course.name,
            year: Number(year),
          });
        }}
      >
        Save
      </Button>
      {prefs && (
        <Button variant="ghost" className="w-full" onClick={() => setPrefs(null)}>
          Clear preference
        </Button>
      )}
    </div>
  );
}
