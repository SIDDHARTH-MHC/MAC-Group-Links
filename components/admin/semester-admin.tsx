"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createSemester, setActiveSemester } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { Semester } from "@prisma/client";

export function SemesterAdmin({
  semesters,
}: {
  semesters: Semester[];
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [academicYear, setAcademicYear] = useState("2026-27");
  const [semesterNumber, setSemesterNumber] = useState("1");

  function submitCreate() {
    startTransition(async () => {
      const res = await createSemester({
        academicYear,
        semesterNumber: Number(semesterNumber),
      });
      if (res.ok) {
        setMessage(res.message ?? "Semester created successfully.");
        if (res.id) {
          router.push(`/admin/papers?semester=${res.id}`);
        }
      } else {
        setMessage(res.error);
      }
    });
  }

  return (
    <div className="space-y-8">
      <div className="max-w-md space-y-4 rounded-lg border bg-white p-4">
        <h2 className="font-semibold">+ New Semester</h2>
        <p className="text-sm text-slate-600">
          Starting a new semester archives the current active semester and creates
          a completely empty catalogue — no papers, groups, or eligibility are
          copied.
        </p>
        <div>
          <Label>Academic year (e.g. 2026-27)</Label>
          <Input
            name="academicYear"
            required
            placeholder="2026-27"
            value={academicYear}
            onChange={(e) => setAcademicYear(e.target.value)}
          />
        </div>
        <div>
          <Label>Semester number</Label>
          <Input
            name="semesterNumber"
            type="number"
            min={1}
            max={8}
            value={semesterNumber}
            onChange={(e) => setSemesterNumber(e.target.value)}
          />
        </div>
        <AlertDialog>
        <AlertDialogTrigger>
          <Button type="button" disabled={pending}>
            Create Empty Semester
          </Button>
        </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Create new semester?</AlertDialogTitle>
              <AlertDialogDescription>
                Starting this semester will archive the current active semester
                and create a completely empty catalogue. You will need to add or
                import the official paper list for this semester.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={submitCreate}>
                Create Empty Semester
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        {message && <p className="text-sm">{message}</p>}
      </div>

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
