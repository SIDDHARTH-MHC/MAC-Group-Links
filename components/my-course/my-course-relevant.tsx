"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useCourseYearPrefs, formatPrefsLabel } from "@/lib/preferences/course-year";
import { PAPER_TYPE_LABELS } from "@/lib/constants";
import type { PaperType } from "@prisma/client";
import { Badge } from "@/components/ui/badge";

type Row = {
  id: string;
  paperName: string;
  paperType: string;
  departmentName: string;
  groupCount: number;
};

export function MyCourseRelevantGroups() {
  const { prefs, loaded } = useCourseYearPrefs();
  const [rows, setRows] = useState<Row[] | undefined>(undefined);
  const [pending, startFetchTransition] = useTransition();

  useEffect(() => {
    if (!loaded || !prefs) {
      return;
    }
    startFetchTransition(async () => {
      const params = new URLSearchParams({
        courseId: prefs.courseId,
        year: String(prefs.year),
      });
      if (prefs.combination) params.set("combination", prefs.combination);
      const res = await fetch(`/api/personalized?${params}`);
      if (res.ok) {
        const data = (await res.json()) as { papers: Row[] };
        setRows(data.papers ?? []);
      } else {
        setRows([]);
      }
    });
  }, [loaded, prefs]);

  if (!loaded) {
    return (
      <div className="h-32 animate-pulse rounded-xl border border-border bg-muted/40" />
    );
  }

  if (!prefs) return null;

  const list = rows ?? [];

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">
        Groups relevant to you
      </h2>
      {pending ? (
        <ul className="space-y-3">
          {[1, 2].map((i) => (
            <li
              key={i}
              className="h-20 animate-pulse rounded-xl border border-border bg-muted/40"
            />
          ))}
        </ul>
      ) : list.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
          No group links match your course and year yet. Try browsing by paper
          type or add a link if you have one.
        </p>
      ) : (
        <ul className="space-y-3">
          {list.map((paper) => (
            <li key={paper.id}>
              <Link
                href={`/paper/${paper.id}`}
                className="block rounded-xl border border-border bg-card p-4 hover:border-primary/30"
              >
                <Badge variant="secondary" className="mb-2">
                  {PAPER_TYPE_LABELS[paper.paperType as PaperType]?.short ??
                    paper.paperType}
                </Badge>
                <p className="font-medium text-foreground">{paper.paperName}</p>
                <p className="text-sm text-muted-foreground">
                  {paper.departmentName} · {paper.groupCount} group
                  {paper.groupCount === 1 ? "" : "s"}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-muted-foreground">
        Based on {formatPrefsLabel(prefs)}.
      </p>
    </section>
  );
}
