"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { MacCourseSelect } from "@/components/forms/mac-course-select";
import {
  BA_PROGRAMME_COMBINATIONS,
  formatCombinationLabel,
  isBaProgrammeCourseName,
} from "@/lib/courses/mac";
import { MAC_YEARS } from "@/lib/constants/courses";
import type { PaperType } from "@prisma/client";
import type { Course } from "@prisma/client";
import { cn } from "@/lib/utils";

export type AudienceMode = "all" | "single" | "multiple";

/** @deprecated Use MultiAudienceState */
export type MultiEligibilityRow = {
  courseId: string;
  year: string;
  combination?: string;
};

export type MultiAudienceState = {
  selectedCourseIds: string[];
  year: string;
  /** GE + B.A. Programme: one or more discipline combinations */
  baCombinations: string[];
};

export function emptyMultiAudience(): MultiAudienceState {
  return { selectedCourseIds: [], year: "2", baCombinations: [] };
}

export type EligibilitySubmitRow = {
  courseId?: string;
  year?: number;
  combination?: string;
  appliesToAll?: boolean;
};

const MODE_OPTIONS: { value: AudienceMode; label: string; hint: string }[] = [
  {
    value: "all",
    label: "All courses & years",
    hint: "Everyone registered for this paper, any programme or year.",
  },
  {
    value: "single",
    label: "One course & year",
    hint: "A single programme and year. For GE on B.A. Programme, pick a combination.",
  },
  {
    value: "multiple",
    label: "Several courses",
    hint: "Tick every programme this group is for, then choose the year.",
  },
];

function isSecOrVac(paperType?: string): boolean {
  return paperType === "SEC" || paperType === "VAC";
}

function findBaCourseId(courses: Course[]): string | undefined {
  return courses.find((c) => isBaProgrammeCourseName(c.name))?.id;
}

export function buildEligibilitySubmitRows(
  mode: AudienceMode,
  single: {
    courseId: string;
    year: string;
    combination?: string;
  },
  multi: MultiAudienceState,
  courses: Course[],
  paperType?: PaperType | string,
): EligibilitySubmitRow[] {
  if (mode === "all") {
    return [{ appliesToAll: true }];
  }
  if (mode === "single") {
    const course = courses.find((c) => c.id === single.courseId);
    const omitCombo =
      isSecOrVac(paperType) && isBaProgrammeCourseName(course?.name);
    return [
      {
        courseId: single.courseId,
        year: Number(single.year),
        combination: omitCombo
          ? undefined
          : single.combination?.trim() || undefined,
      },
    ];
  }

  const baId = findBaCourseId(courses);
  const rows: EligibilitySubmitRow[] = [];
  for (const courseId of multi.selectedCourseIds) {
    const course = courses.find((c) => c.id === courseId);
    if (!course) continue;
    if (
      paperType === "GE" &&
      isBaProgrammeCourseName(course.name) &&
      baId === courseId
    ) {
      for (const combo of multi.baCombinations) {
        rows.push({
          courseId,
          year: Number(multi.year),
          combination: combo.trim() || undefined,
        });
      }
      continue;
    }
    rows.push({
      courseId,
      year: Number(multi.year),
    });
  }
  return rows;
}

export function validateEligibilityAudience(
  mode: AudienceMode,
  single: { courseId: string; year: string; combination?: string },
  multi: MultiAudienceState,
  courses: Course[],
  paperType?: PaperType | string,
): string | null {
  if (mode === "all") return null;
  if (mode === "single") {
    if (!single.courseId) return "Please select a course.";
    if (!single.year) return "Please select a year.";
    const course = courses.find((c) => c.id === single.courseId);
    if (
      paperType === "GE" &&
      isBaProgrammeCourseName(course?.name) &&
      !single.combination?.trim()
    ) {
      return "For GE on B.A. Programme, select a combination (discipline).";
    }
    return null;
  }
  if (multi.selectedCourseIds.length === 0) {
    return "Select at least one course, or choose “All courses & years”.";
  }
  if (!multi.year) return "Please select a year.";
  const baId = findBaCourseId(courses);
  if (
    paperType === "GE" &&
    baId &&
    multi.selectedCourseIds.includes(baId) &&
    multi.baCombinations.length === 0
  ) {
    return "For GE on B.A. Programme, tick at least one combination (discipline).";
  }
  return null;
}

type EligibilityAudienceFieldsProps = {
  courses: Course[];
  paperType?: PaperType | string;
  mode: AudienceMode;
  onModeChange: (mode: AudienceMode) => void;
  courseId: string;
  onCourseIdChange: (id: string) => void;
  year: string;
  onYearChange: (year: string) => void;
  combination: string;
  onCombinationChange: (value: string) => void;
  multi: MultiAudienceState;
  onMultiChange: (state: MultiAudienceState) => void;
  heading?: string;
  showMineHint?: boolean;
  onLoadMine?: () => void;
};

export function EligibilityAudienceFields({
  courses,
  paperType,
  mode,
  onModeChange,
  courseId,
  onCourseIdChange,
  year,
  onYearChange,
  combination,
  onCombinationChange,
  multi,
  onMultiChange,
  heading = "Who is this for?",
  showMineHint,
  onLoadMine,
}: EligibilityAudienceFieldsProps) {
  const modeMeta = MODE_OPTIONS.find((o) => o.value === mode);
  const baCourseId = findBaCourseId(courses);
  const baSelected =
    baCourseId !== undefined &&
    multi.selectedCourseIds.includes(baCourseId);
  const showGeBaCombos =
    mode === "multiple" && paperType === "GE" && baSelected;
  const singleHideBaCombo =
    isSecOrVac(paperType) ||
    !isBaProgrammeCourseName(
      courses.find((c) => c.id === courseId)?.name,
    );

  function toggleCourse(id: string) {
    const set = new Set(multi.selectedCourseIds);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    let baCombinations = multi.baCombinations;
    if (baCourseId && !set.has(baCourseId)) {
      baCombinations = [];
    }
    onMultiChange({
      ...multi,
      selectedCourseIds: [...set],
      baCombinations,
    });
  }

  function toggleBaCombination(combo: string) {
    const set = new Set(multi.baCombinations);
    if (set.has(combo)) set.delete(combo);
    else set.add(combo);
    onMultiChange({ ...multi, baCombinations: [...set] });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label>{heading}</Label>
        <Select
          value={mode}
          onValueChange={(v) => onModeChange(v as AudienceMode)}
        >
          <SelectTrigger className="w-full">
            <span className="truncate text-left text-sm">
              {modeMeta?.label ?? "Choose audience"}
            </span>
          </SelectTrigger>
          <SelectContent>
            {MODE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs leading-relaxed text-muted-foreground">
          {modeMeta?.hint}
          {isSecOrVac(paperType) && mode !== "all" ? (
            <>
              {" "}
              SEC and VAC on B.A. Programme apply to all disciplines — no
              combination needed.
            </>
          ) : null}
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
            hideCombination={singleHideBaCombo}
            combinationLabel="B.A. combination (discipline)"
            courseLabel="Course"
            yearLabel="Year"
          />
        </>
      ) : null}

      {mode === "multiple" ? (
        <div className="space-y-4 rounded-lg border border-border bg-muted/20 p-4">
          <div className="space-y-1.5">
            <Label htmlFor="multi-year">Year (same for all selected courses)</Label>
            <Select
              value={multi.year}
              onValueChange={(v) =>
                onMultiChange({ ...multi, year: v ?? "2" })
              }
            >
              <SelectTrigger id="multi-year" className="w-full">
                <span className="text-sm">
                  {MAC_YEARS.find((y) => String(y.value) === multi.year)
                    ?.label ?? "Year"}
                </span>
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

          <div className="space-y-2">
            <Label>Courses</Label>
            <ul className="grid gap-2 sm:grid-cols-2">
              {courses.map((c) => {
                const checked = multi.selectedCourseIds.includes(c.id);
                return (
                  <li key={c.id}>
                    <label
                      className={cn(
                        "flex cursor-pointer items-start gap-2 rounded-md border border-transparent px-2 py-2 text-sm hover:bg-background/80",
                        checked && "border-primary/30 bg-background",
                      )}
                    >
                      <input
                        type="checkbox"
                        className="mt-0.5 size-4 shrink-0 accent-primary"
                        checked={checked}
                        onChange={() => toggleCourse(c.id)}
                      />
                      <span className="leading-snug">{c.name}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>

          {showGeBaCombos ? (
            <div className="space-y-2 border-t border-border pt-4">
              <Label>B.A. Programme — combinations (GE only)</Label>
              <p className="text-xs text-muted-foreground">
                Tick each discipline this GE group is for. Other programmes
                above do not use combinations.
              </p>
              <ul className="grid gap-2 sm:grid-cols-2">
                {BA_PROGRAMME_COMBINATIONS.map((combo) => {
                  const checked = multi.baCombinations.includes(combo);
                  return (
                    <li key={combo}>
                      <label className="flex cursor-pointer items-start gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-background/80">
                        <input
                          type="checkbox"
                          className="mt-0.5 size-4 shrink-0 accent-primary"
                          checked={checked}
                          onChange={() => toggleBaCombination(combo)}
                        />
                        <span>{formatCombinationLabel(combo)}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}
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
