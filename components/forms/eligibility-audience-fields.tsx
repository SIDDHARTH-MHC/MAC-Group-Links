"use client";

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
  MacCourseSelect,
} from "@/components/forms/mac-course-select";
import type { Course } from "@prisma/client";

export type AudienceMode = "all" | "single" | "multiple";

export type MultiEligibilityRow = {
  courseId: string;
  year: string;
  combination?: string;
};

export type EligibilitySubmitRow = {
  courseId?: string;
  year?: number;
  combination?: string;
  appliesToAll?: boolean;
};

export function buildEligibilitySubmitRows(
  mode: AudienceMode,
  single: {
    courseId: string;
    year: string;
    combination?: string;
  },
  multiRows: MultiEligibilityRow[],
): EligibilitySubmitRow[] {
  if (mode === "all") {
    return [{ appliesToAll: true }];
  }
  if (mode === "single") {
    return [
      {
        courseId: single.courseId,
        year: Number(single.year),
        combination: single.combination?.trim() || undefined,
      },
    ];
  }
  return multiRows
    .filter((r) => r.courseId)
    .map((r) => ({
      courseId: r.courseId,
      year: Number(r.year),
      combination: r.combination?.trim() || undefined,
    }));
}

export function validateEligibilityAudience(
  mode: AudienceMode,
  single: { courseId: string; year: string },
  multiRows: MultiEligibilityRow[],
): string | null {
  if (mode === "all") return null;
  if (mode === "single") {
    if (!single.courseId) return "Please select a course.";
    if (!single.year) return "Please select a year.";
    return null;
  }
  const filled = multiRows.filter((r) => r.courseId);
  if (filled.length === 0) {
    return "Add at least one course and year, or choose “All courses & years”.";
  }
  for (const row of filled) {
    if (!row.year) return "Please select a year for each course.";
  }
  return null;
}

type EligibilityAudienceFieldsProps = {
  courses: Course[];
  mode: AudienceMode;
  onModeChange: (mode: AudienceMode) => void;
  courseId: string;
  onCourseIdChange: (id: string) => void;
  year: string;
  onYearChange: (year: string) => void;
  combination: string;
  onCombinationChange: (value: string) => void;
  multiRows: MultiEligibilityRow[];
  onMultiRowsChange: (rows: MultiEligibilityRow[]) => void;
  heading?: string;
  /** Contribute flow: pre-fill single row from My Course */
  showMineHint?: boolean;
  onLoadMine?: () => void;
};

export function EligibilityAudienceFields({
  courses,
  mode,
  onModeChange,
  courseId,
  onCourseIdChange,
  year,
  onYearChange,
  combination,
  onCombinationChange,
  multiRows,
  onMultiRowsChange,
  heading = "Who is this for?",
  showMineHint,
  onLoadMine,
}: EligibilityAudienceFieldsProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label>{heading}</Label>
        <Select
          value={mode}
          onValueChange={(v) => onModeChange(v as AudienceMode)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Choose audience" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              All courses &amp; years — everyone taking this paper
            </SelectItem>
            <SelectItem value="single">One course &amp; year</SelectItem>
            <SelectItem value="multiple">Several courses or years</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs leading-relaxed text-muted-foreground">
          {mode === "all"
            ? "Pick this when the paper or group is for all students registered for it, not just one programme."
            : mode === "multiple"
              ? "Add one row per course/year (e.g. SEC open to B.Com 2nd year and B.A. Programme 3rd year)."
              : "One programme and year. B.A. Programme shows combination when needed."}
        </p>
      </div>

      {mode === "single" ? (
        <>
          {showMineHint && onLoadMine && !courseId ? (
            <Button type="button" variant="secondary" size="sm" onClick={onLoadMine}>
              Load from My Course
            </Button>
          ) : null}
          <MacCourseSelect
            courses={courses}
            courseId={courseId}
            onCourseIdChange={onCourseIdChange}
            year={year}
            onYearChange={onYearChange}
            combination={combination}
            onCombinationChange={onCombinationChange}
            combinationLabel="Combination"
            courseLabel="Course"
            yearLabel="Year"
          />
        </>
      ) : null}

      {mode === "multiple" ? (
        <div className="space-y-4">
          {multiRows.map((row, idx) => (
            <div
              key={idx}
              className="space-y-3 rounded-lg border border-border bg-muted/20 p-4"
            >
              <p className="text-xs font-medium text-muted-foreground">
                Course / year {idx + 1}
              </p>
              <MacCourseSelect
                courses={courses}
                courseId={row.courseId}
                onCourseIdChange={(v) => {
                  const next = [...multiRows];
                  next[idx] = { ...next[idx], courseId: v, combination: "" };
                  onMultiRowsChange(next);
                }}
                year={row.year}
                onYearChange={(v) => {
                  const next = [...multiRows];
                  next[idx] = { ...next[idx], year: v };
                  onMultiRowsChange(next);
                }}
                combination={row.combination ?? ""}
                onCombinationChange={(v) => {
                  const next = [...multiRows];
                  next[idx] = { ...next[idx], combination: v };
                  onMultiRowsChange(next);
                }}
                combinationLabel="Combination"
                courseLabel="Course"
                yearLabel="Year"
              />
              {multiRows.length > 1 ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  onClick={() =>
                    onMultiRowsChange(multiRows.filter((_, i) => i !== idx))
                  }
                >
                  Remove this row
                </Button>
              ) : null}
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              onMultiRowsChange([
                ...multiRows,
                { courseId: "", year: "2", combination: "" },
              ])
            }
          >
            + Add another course / year
          </Button>
        </div>
      ) : null}
    </div>
  );
}

/** Map contribute form legacy modes to audience mode */
export function contributeModeToAudience(
  appliesMode: "mine" | "select" | "multiple" | "all",
): AudienceMode {
  if (appliesMode === "all") return "all";
  if (appliesMode === "multiple") return "multiple";
  return "single";
}

export function audienceToContributeMode(
  mode: AudienceMode,
  wasMine: boolean,
): "mine" | "select" | "multiple" | "all" {
  if (mode === "all") return "all";
  if (mode === "multiple") return "multiple";
  return wasMine ? "mine" : "select";
}
