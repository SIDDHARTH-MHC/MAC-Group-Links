"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { importOfficialCatalogue, importOfficialCatalogueAllOdd } from "@/lib/actions/admin";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Semester } from "@prisma/client";
import type { officialCatalogueImportSchema } from "@/lib/validations";
import type { z } from "zod";

type Row = z.infer<typeof officialCatalogueImportSchema>[number];

function uniqueImportKey(row: Row) {
  return `${row.paperType}|${row.paperName.trim().toLowerCase()}|${row.department.trim().toLowerCase()}`;
}

function countUniqueImportKeys(rows: Row[]) {
  return new Set(rows.map(uniqueImportKey)).size;
}

export function OfficialCatalogueImportClient({
  semesters,
  activeSemesterId,
  preview,
}: {
  semesters: Semester[];
  activeSemesterId: string;
  preview: {
    total: number;
    filtered: number;
    needsReview: number;
    rows: Row[];
  };
}) {
  const [targetSemesterId, setTargetSemesterId] = useState(activeSemesterId);
  const [catalogueSem, setCatalogueSem] = useState("1");
  const [includeReview, setIncludeReview] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const rows = preview.rows.filter(
    (r) =>
      r.semesterNumber === Number(catalogueSem) &&
      (includeReview || !r.needsReview),
  );

  const allOddRows = preview.rows.filter(
    (r) =>
      [1, 3, 5, 7].includes(r.semesterNumber) &&
      (includeReview || !r.needsReview),
  );
  const allOddUniqueCount = useMemo(
    () => countUniqueImportKeys(allOddRows),
    [allOddRows],
  );
  const singleSemUniqueCount = useMemo(
    () => countUniqueImportKeys(rows),
    [rows],
  );

  return (
    <div className="space-y-6">
      <Link href="/admin/papers" className="text-sm text-slate-600 underline">
        ← Paper catalogue
      </Link>
      <p className="text-sm text-slate-600">
        Source PDFs:{" "}
        <code className="text-xs">prisma/data/reference/</code> → extracted to{" "}
        <code className="text-xs">papers-official.json</code>. Re-run{" "}
        <code className="text-xs">npm run catalogue:extract</code> after PDF
        updates. Existing papers (including those with group links) are never
        changed — only missing papers are added.
      </p>

      <div className="flex flex-wrap gap-4 rounded-lg border bg-white p-4">
        <div>
          <Label>Import into semester (DB)</Label>
          <Select
            value={targetSemesterId}
            onValueChange={(v) => v && setTargetSemesterId(v)}
          >
            <SelectTrigger className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {semesters.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.academicYear} — internal sem {s.semesterNumber}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Catalogue semester (from PDF)</Label>
          <Select value={catalogueSem} onValueChange={(v) => v && setCatalogueSem(v)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1, 3, 5, 7].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  Semester {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <label className="flex items-end gap-2 pb-2 text-sm">
          <input
            type="checkbox"
            checked={includeReview}
            onChange={(e) => setIncludeReview(e.target.checked)}
          />
          Include rows flagged needsReview
        </label>
        <div className="flex flex-wrap items-end gap-2">
          <Button
            disabled={pending || rows.length === 0}
            onClick={() =>
              startTransition(async () => {
                const res = await importOfficialCatalogue(
                  targetSemesterId,
                  Number(catalogueSem),
                  { includeNeedsReview: includeReview },
                );
                setMessage(res.ok ? res.message ?? "Imported" : res.error);
              })
            }
          >
            Confirm import ({singleSemUniqueCount} unique
            {rows.length !== singleSemUniqueCount
              ? ` · ${rows.length} JSON rows`
              : ""}
            )
          </Button>
          <Button
            variant="secondary"
            disabled={pending || allOddRows.length === 0}
            onClick={() =>
              startTransition(async () => {
                const res = await importOfficialCatalogueAllOdd(
                  targetSemesterId,
                  { includeNeedsReview: includeReview },
                );
                setMessage(res.ok ? res.message ?? "Imported" : res.error);
              })
            }
          >
            Import all odd sems 1+3+5+7 ({allOddUniqueCount} unique
            {allOddRows.length !== allOddUniqueCount
              ? ` · ${allOddRows.length} JSON rows, cross-sem repeats skipped`
              : ""}
            )
          </Button>
        </div>
      </div>

      {message && <p className="text-sm">{message}</p>}

      <p className="text-sm text-slate-600">
        Preview: {rows.length} papers · {preview.needsReview} need review in
        full catalogue ({preview.total} total)
      </p>

      <div className="max-h-[480px] overflow-auto rounded-lg border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Paper</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Eligibility / notes</TableHead>
              <TableHead>Seats</TableHead>
              <TableHead>Source</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.slice(0, 200).map((r, i) => (
              <TableRow key={i} className={r.needsReview ? "bg-amber-50" : ""}>
                <TableCell>{r.paperType}</TableCell>
                <TableCell className="max-w-[200px] font-medium">
                  {r.paperName}
                  {r.dseNumber ? (
                    <span className="block text-xs text-slate-500">
                      {r.dseNumber}
                    </span>
                  ) : null}
                </TableCell>
                <TableCell>
                  {r.department}
                  {r.departmentRoom ? ` · ${r.departmentRoom}` : ""}
                </TableCell>
                <TableCell className="max-w-[220px] text-xs">
                  {r.eligibilityNotes ??
                    r.eligibilities?.[0]?.notes ??
                    (r.eligibilities?.length ? "See eligibilities" : "—")}
                  {r.prerequisite ? (
                    <span className="block text-amber-800">
                      Prerequisite: {r.prerequisite}
                    </span>
                  ) : null}
                  {r.needsReview ? (
                    <span className="block text-red-700">{r.reviewNote}</span>
                  ) : null}
                </TableCell>
                <TableCell>{r.seatCapacity ?? "—"}</TableCell>
                <TableCell className="text-xs">
                  p.{r.sourcePage}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
