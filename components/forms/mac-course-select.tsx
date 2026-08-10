"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BA_PROGRAMME_COMBINATIONS,
  formatCombinationLabel,
  isBaProgrammeCourseName,
} from "@/lib/courses/mac";
import { MAC_YEARS } from "@/lib/constants/courses";
import type { Course } from "@prisma/client";

export type MacCourseSelectProps = {
  courses: Course[];
  courseId: string;
  onCourseIdChange: (courseId: string) => void;
  year: string;
  onYearChange: (year: string) => void;
  combination?: string;
  onCombinationChange?: (combination: string) => void;
  combinationLabel?: string;
  combinationOptional?: boolean;
  courseLabel?: string;
  yearLabel?: string;
  courseSelectId?: string;
  yearSelectId?: string;
  comboSelectId?: string;
  /** When set, only render course + year (no combination block). */
  hideCombination?: boolean;
};

export function MacCourseSelect({
  courses,
  courseId,
  onCourseIdChange,
  year,
  onYearChange,
  combination = "",
  onCombinationChange,
  combinationLabel = "Combination (B.A. Programme)",
  combinationOptional = false,
  courseLabel = "Course",
  yearLabel = "Year",
  courseSelectId,
  yearSelectId,
  comboSelectId,
  hideCombination = false,
}: MacCourseSelectProps) {
  const safeCourseId = courses.some((c) => c.id === courseId) ? courseId : null;
  const safeYear = MAC_YEARS.some((y) => String(y.value) === year)
    ? year
    : String(MAC_YEARS[1]?.value ?? 2);
  const safeCombination =
    combination &&
    BA_PROGRAMME_COMBINATIONS.includes(
      combination as (typeof BA_PROGRAMME_COMBINATIONS)[number],
    )
      ? combination
      : null;

  const selectedCourse = courses.find((c) => c.id === safeCourseId);
  const showCombination =
    !hideCombination &&
    isBaProgrammeCourseName(selectedCourse?.name) &&
    onCombinationChange;

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-1.5">
        <Label htmlFor={courseSelectId}>{courseLabel}</Label>
        <Select
          value={safeCourseId}
          onValueChange={(v) => {
            onCourseIdChange(v ?? "");
            if (onCombinationChange) onCombinationChange("");
          }}
        >
          <SelectTrigger id={courseSelectId} className="w-full">
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

      {showCombination ? (
        <div className="space-y-1.5">
          <Label htmlFor={comboSelectId}>
            {combinationLabel}
            {combinationOptional ? " (optional)" : ""}
          </Label>
          <Select
            value={safeCombination}
            onValueChange={(v) => onCombinationChange!(v ?? "")}
          >
            <SelectTrigger id={comboSelectId} className="w-full">
              <SelectValue placeholder="Select combination" />
            </SelectTrigger>
            <SelectContent>
              {BA_PROGRAMME_COMBINATIONS.map((combo) => (
                <SelectItem key={combo} value={combo}>
                  {formatCombinationLabel(combo)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor={yearSelectId}>{yearLabel}</Label>
        <Select value={safeYear} onValueChange={(v) => onYearChange(v ?? "2")}>
          <SelectTrigger id={yearSelectId} className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MAC_YEARS.map((y) => (
              <SelectItem key={y.value} value={String(y.value)}>
                {y.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

/** Course + year only (e.g. filter rows). */
export function MacCourseYearRow({
  courses,
  courseId,
  onCourseIdChange,
  year,
  onYearChange,
  coursePlaceholder = "Course",
  yearPlaceholder = "Year",
}: {
  courses: Course[];
  courseId: string;
  onCourseIdChange: (id: string) => void;
  year: string;
  onYearChange: (year: string) => void;
  coursePlaceholder?: string;
  yearPlaceholder?: string;
}) {
  const safeCourseId = courses.some((c) => c.id === courseId) ? courseId : null;
  const safeYear = MAC_YEARS.some((y) => String(y.value) === year)
    ? year
    : String(MAC_YEARS[1]?.value ?? 2);

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="space-y-1.5">
        <Select
          value={safeCourseId}
          onValueChange={(v) => onCourseIdChange(v ?? "")}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={coursePlaceholder} />
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
      <div className="space-y-1.5">
        <Select value={safeYear} onValueChange={(v) => onYearChange(v ?? "2")}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={yearPlaceholder} />
          </SelectTrigger>
          <SelectContent>
            {MAC_YEARS.map((y) => (
              <SelectItem key={y.value} value={String(y.value)}>
                {y.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
