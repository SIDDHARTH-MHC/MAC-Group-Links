"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MacSearchBar } from "@/components/ui/mac-search-bar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { formatEligibility } from "@/lib/constants";
import { MAC_YEARS } from "@/lib/constants/courses";
import { paperMatchesPrefs } from "@/lib/eligibility-match";
import type { Course, Department, Paper, PaperEligibility } from "@prisma/client";

type PaperRow = Paper & {
  department: Department;
  eligibilities: (PaperEligibility & { course: Course | null })[];
  _count: { groups: number };
};

export function PaperTypeBrowse({
  papers,
  courses,
  departments,
  basePath,
}: {
  papers: PaperRow[];
  courses: Course[];
  departments: string[];
  basePath: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dept = searchParams.get("dept") ?? "";
  const q = searchParams.get("q") ?? "";
  const [courseId, setCourseId] = useState("");
  const [year, setYear] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);

  function pushFilters(next: { dept?: string; q?: string }) {
    const params = new URLSearchParams(searchParams.toString());
    if (next.q !== undefined) {
      if (next.q) params.set("q", next.q);
      else params.delete("q");
    }
    if (next.dept !== undefined) {
      if (next.dept) params.set("dept", next.dept);
      else params.delete("dept");
    }
    router.push(`${basePath}?${params.toString()}`);
  }

  const filtered = useMemo(() => {
    let list = papers;
    if (courseId && year) {
      list = list.filter((p) =>
        paperMatchesPrefs(p.eligibilities, {
          courseId,
          year: Number(year),
        }),
      );
    } else if (courseId) {
      list = list.filter((p) =>
        p.eligibilities.some(
          (e) => e.appliesToAll || e.courseId === courseId,
        ),
      );
    }
    return list;
  }, [papers, courseId, year]);

  const filterFields = (
    <div className="flex flex-col gap-3">
      <div>
        <p className="mb-1.5 text-sm font-medium text-foreground">Department</p>
        <Select
          value={dept || "all"}
          onValueChange={(v) => pushFilters({ dept: !v || v === "all" ? "" : v })}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="All departments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All departments</SelectItem>
            {departments.map((d) => (
              <SelectItem key={d} value={d}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <p className="mb-1.5 text-sm font-medium text-foreground">Course</p>
        <Select
          value={courseId || "all"}
          onValueChange={(v) => setCourseId(!v || v === "all" ? "" : v)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Any course" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any course</SelectItem>
            {courses.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <p className="mb-1.5 text-sm font-medium text-foreground">Year</p>
        <Select
          value={year || "all"}
          onValueChange={(v) => setYear(!v || v === "all" ? "" : v)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Any year" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any year</SelectItem>
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

  return (
    <div className="space-y-4">
      <form
        action={basePath}
        method="get"
        className="flex flex-col gap-3 sm:flex-row sm:items-center"
      >
        <MacSearchBar
          name="q"
          defaultValue={q}
          placeholder="Search this category…"
          className="flex-1"
        />
        {dept ? <input type="hidden" name="dept" value={dept} /> : null}
        <Button type="submit" variant="secondary" className="shrink-0">
          Search
        </Button>
      </form>

      <div className="hidden rounded-xl border border-border bg-muted/20 p-4 md:block">
        <p className="mb-3 text-sm font-medium text-foreground">Filters</p>
        {filterFields}
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetTrigger
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-border bg-background px-4 text-sm font-medium md:hidden"
        >
          <SlidersHorizontal className="h-4 w-4" aria-hidden />
          Filters
        </SheetTrigger>
        <SheetContent side="bottom" className="max-h-[85vh] rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>Filters</SheetTitle>
          </SheetHeader>
          <div className="py-4">{filterFields}</div>
          <SheetFooter>
            <Button className="w-full" onClick={() => setSheetOpen(false)}>
              Show results
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {filtered.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-8 text-center text-muted-foreground">
          No papers match your filters.
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {filtered.map((paper) => (
            <li key={paper.id}>
              <article className="flex h-full flex-col rounded-xl border border-border bg-card p-4 shadow-sm">
                <h2 className="font-semibold leading-snug text-foreground">
                  {paper.paperName}
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Offering Department
                </p>
                <p className="font-medium text-foreground">
                  {paper.department.name}
                  {paper.department.departmentRoom
                    ? ` · Room ${paper.department.departmentRoom}`
                    : ""}
                </p>
                {paper.eligibilities.length > 0 ? (
                  <div className="mt-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Eligibility
                    </p>
                    <p className="mt-1 text-sm text-foreground">
                      {paper.eligibilities
                        .slice(0, 2)
                        .map((e) =>
                          formatEligibility(
                            e.appliesToAll,
                            e.course?.name,
                            e.year,
                            e.combination,
                          ),
                        )
                        .join(" · ")}
                      {paper.eligibilities.length > 2
                        ? ` +${paper.eligibilities.length - 2} more`
                        : ""}
                    </p>
                  </div>
                ) : null}
                <p className="mt-auto pt-4 text-sm text-muted-foreground">
                  {paper._count.groups} group
                  {paper._count.groups === 1 ? "" : "s"} available
                </p>
                <Button asChild className="mt-3 w-full" variant="secondary">
                  <Link href={`/paper/${paper.id}`}>View Groups</Link>
                </Button>
              </article>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
