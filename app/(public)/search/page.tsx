"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PAPER_TYPE_LABELS } from "@/lib/constants";
import type { Paper, PaperEligibility, Course, Department } from "@prisma/client";

type PaperRow = Paper & {
  department: Department;
  eligibilities: (PaperEligibility & { course: Course | null })[];
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
      <h1 className="text-2xl font-bold">Search</h1>
      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Paper, department, teacher..."
        className="h-11 border-amber-200 bg-white"
        autoFocus
      />
      {pending && <p className="text-sm text-amber-800/60">Searching…</p>}
      {!pending && q.trim() && results.length === 0 && (
        <p className="text-amber-900/70">No matching papers found.</p>
      )}
      <ul className="space-y-3">
        {results.map((paper) => (
          <li key={paper.id}>
            <Link
              href={`/paper/${paper.id}`}
              className="block rounded-lg border border-amber-100 bg-white p-4 hover:border-amber-300"
            >
              <Badge variant="secondary" className="mb-2">
                {PAPER_TYPE_LABELS[paper.paperType].short}
              </Badge>
              <p className="font-medium">{paper.paperName}</p>
              <p className="text-sm text-amber-900/60">
                {paper.department.name}
                {paper.department.departmentRoom
                  ? ` · Dept room ${paper.department.departmentRoom}`
                  : ""}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
