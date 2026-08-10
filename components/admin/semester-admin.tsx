"use client";

import { useState, useTransition } from "react";
import { createSemester, setActiveSemester } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Semester } from "@prisma/client";

export function SemesterAdmin({
  semesters,
}: {
  semesters: Semester[];
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-8">
      <form
        className="max-w-md space-y-4 rounded-lg border bg-white p-4"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          startTransition(async () => {
            const res = await createSemester({
              academicYear: String(fd.get("academicYear")),
              semesterNumber: Number(fd.get("semesterNumber")),
              makeActive: fd.get("makeActive") === "on",
            });
            setMessage(res.ok ? res.message ?? "Created" : res.error);
          });
        }}
      >
        <h2 className="font-semibold">Start new semester</h2>
        <p className="text-sm text-slate-600">
          Starting a new semester changes what students see. Catalogue starts
          empty — no papers are copied from previous semesters.
        </p>
        <div>
          <Label>Academic year (e.g. 2026-27)</Label>
          <Input name="academicYear" required placeholder="2026-27" />
        </div>
        <div>
          <Label>Semester number</Label>
          <Input name="semesterNumber" type="number" min={1} max={8} defaultValue={1} />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="makeActive" defaultChecked />
          Set as active semester
        </label>
        <Button type="submit" disabled={pending}>
          Create semester
        </Button>
        {message && <p className="text-sm">{message}</p>}
      </form>

      <div>
        <h2 className="mb-3 font-semibold">All semesters</h2>
        <ul className="space-y-2">
          {semesters.map((s) => (
            <li
              key={s.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded border bg-white px-3 py-2 text-sm"
            >
              <span>
                {s.academicYear} — Sem {s.semesterNumber}{" "}
                <span className="text-slate-500">({s.status})</span>
              </span>
              {s.status !== "ACTIVE" && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      await setActiveSemester(s.id);
                    })
                  }
                >
                  Set active
                </Button>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
