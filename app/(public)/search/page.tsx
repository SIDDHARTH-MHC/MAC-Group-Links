"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { MacSearchBar } from "@/components/ui/mac-search-bar";
import { Badge } from "@/components/ui/badge";
import { getPaperTypeLabel, PAPER_TYPE_LABELS } from "@/lib/constants";
import type { Paper, PaperEligibility, Course, Department } from "@prisma/client";

type PaperRow = Paper & {
  department: Department;
  eligibilities: (PaperEligibility & { course: Course | null })[];
  _count?: { groups: number };
};

export default function SearchPage() {
  const searchParams = useSearchParams();
  const initial = searchParams.get("q") ?? "";
  const [q, setQ] = useState(initial);
  const [results, setResults] = useState<PaperRow[]>([]);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => {
      startTransition(async () => {
        const params = new URLSearchParams();
        if (q.trim()) params.set("q", q.trim());
        router.replace(`/search?${params.toString()}`, { scroll: false });
        if (!q.trim()) {
          setResults([]);
          return;
        }
        const res = await fetch(`/api/search?${params.toString()}`);
        if (res.ok) {
          setResults(await res.json());
        }
      });
    }, 300);
    return () => clearTimeout(t);
  }, [q, router]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Search</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Papers that already have a group link this semester.
        </p>
      </div>
      <MacSearchBar
        key={initial}
        value={q}
        onChange={setQ}
        placeholder="Search papers, teachers or departments"
        autoFocus
      />
      {pending && (
        <ul className="space-y-3" aria-busy="true">
          {[1, 2, 3].map((i) => (
            <li
              key={i}
              className="h-24 animate-pulse rounded-xl border border-border bg-muted/40"
            />
          ))}
        </ul>
      )}
      {!pending && q.trim() && results.length === 0 && (
        <p className="text-muted-foreground">
          No papers with group links match your search.
        </p>
      )}
      {!pending && (
        <ul className="space-y-3">
          {results.map((paper) => (
            <li key={paper.id}>
              <Link
                href={`/paper/${paper.id}`}
                className="block rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/30 hover:bg-accent/20"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <Badge variant="secondary" className="mb-2">
                      {getPaperTypeLabel(paper.paperType).short}
                    </Badge>
                    <p className="font-semibold text-foreground">
                      {paper.paperName}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {paper.department.name}
                    </p>
                  </div>
                  {paper._count ? (
                    <p className="text-sm text-muted-foreground">
                      {paper._count.groups} group
                      {paper._count.groups === 1 ? "" : "s"} available
                    </p>
                  ) : null}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
