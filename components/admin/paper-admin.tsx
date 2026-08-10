"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  createPaper,
  deletePaper,
  importPapers,
} from "@/lib/actions/admin";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { PAPER_TYPES, PAPER_TYPE_LABELS } from "@/lib/constants";
import type { Department, Paper, PaperType, Semester } from "@prisma/client";

export function PaperAdminClient({
  semesters,
  activeSemesterId,
  papers,
  departments,
}: {
  semesters: Semester[];
  activeSemesterId: string;
  papers: (Paper & {
    department: Department;
    _count: { groups: number };
  })[];
  departments: Department[];
}) {
  const [semesterId, setSemesterId] = useState(activeSemesterId);
  const [filterType, setFilterType] = useState<PaperType | "ALL">("ALL");
  const [pending, startTransition] = useTransition();
  const [importJson, setImportJson] = useState("");

  const filtered =
    filterType === "ALL"
      ? papers.filter((p) => p.semesterId === semesterId)
      : papers.filter(
          (p) => p.semesterId === semesterId && p.paperType === filterType
        );

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-3">
        <Select value={semesterId} onValueChange={(v) => v && setSemesterId(v)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {semesters.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.academicYear} Sem {s.semesterNumber}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filterType}
          onValueChange={(v) => setFilterType(v as PaperType | "ALL")}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All types</SelectItem>
            {PAPER_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <NewPaperForm semesterId={semesterId} departments={departments} />

      <div className="rounded-lg border bg-white p-4">
        <Label>Import official catalogue (JSON array)</Label>
        <Textarea
          className="mt-2 font-mono text-xs"
          rows={6}
          value={importJson}
          onChange={(e) => setImportJson(e.target.value)}
          placeholder='[{"paperType":"SEC","paperName":"IT Skills and Data Analysis 1","department":"Economics","eligibilities":[{"course":"BA Programme","year":2}]}]'
        />
        <Button asChild variant="secondary" className="mt-2 mr-2">
          <Link href="/admin/papers/import">Import from official PDF extract</Link>
        </Button>
        <Button
          className="mt-2"
          variant="secondary"
          disabled={pending || !importJson.trim()}
          onClick={() =>
            startTransition(async () => {
              await importPapers(semesterId, importJson);
            })
          }
        >
          Import Official Catalogue
        </Button>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-amber-50/50 p-8 text-center">
          <p className="text-slate-700">No papers have been added yet.</p>
          <p className="mt-2 text-sm text-slate-600">
            Use + Add Paper or Import Official Catalogue above.
          </p>
        </div>
      ) : (
      <>
      <div className="hidden overflow-x-auto rounded-lg border border-border bg-card md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Groups</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((paper) => (
              <TableRow key={paper.id}>
                <TableCell className="font-medium">{paper.paperName}</TableCell>
                <TableCell>{paper.paperType}</TableCell>
                <TableCell>
                  {paper.department.name}
                  {paper.department.departmentRoom
                    ? ` · ${paper.department.departmentRoom}`
                    : ""}
                </TableCell>
                <TableCell>{paper._count.groups}</TableCell>
                <TableCell className="space-x-2 text-right">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/admin/papers/${paper.id}`}>Edit</Link>
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger className={buttonVariants({ variant: "destructive", size: "sm" })}>
                      Delete
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Delete {paper.paperName}?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          This will also remove its group links and associated
                          data.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() =>
                            startTransition(() => {
                              void deletePaper(paper.id);
                            })
                          }
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <ul className="space-y-3 md:hidden">
        {filtered.map((paper) => (
          <li
            key={paper.id}
            className="rounded-xl border border-border bg-card p-4 shadow-sm"
          >
            <p className="font-medium text-foreground">{paper.paperName}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {paper.paperType} · {paper.department.name}
            </p>
            <p className="text-sm text-muted-foreground">
              {paper._count.groups} groups
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button asChild size="sm" variant="secondary">
                <Link href={`/admin/papers/${paper.id}`}>Edit</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href={`/admin/papers/${paper.id}#groups`}>Groups</Link>
              </Button>
              <AlertDialog>
                <AlertDialogTrigger className={buttonVariants({ variant: "destructive", size: "sm" })}>
                  Delete
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete {paper.paperName}?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will remove this paper and its associated group data.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() =>
                        startTransition(() => {
                          void deletePaper(paper.id);
                        })
                      }
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </li>
        ))}
      </ul>
      </>
      )}
    </div>
  );
}

function NewPaperForm({
  semesterId,
  departments,
}: {
  semesterId: string;
  departments: Department[];
}) {
  const [paperType, setPaperType] = useState<PaperType>("SEC");
  const [departmentId, setDepartmentId] = useState(departments[0]?.id ?? "");
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="grid gap-3 rounded-lg border bg-white p-4 md:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
          await createPaper({
            semesterId,
            paperType,
            paperName: String(fd.get("paperName")),
            departmentId: departmentId || String(fd.get("departmentId")),
            eligibilities: [{ appliesToAll: true }],
          });
          e.currentTarget.reset();
        });
      }}
    >
      <h2 className="md:col-span-2 font-semibold">+ Add Paper</h2>
      <div>
        <Label>Type</Label>
        <Select value={paperType} onValueChange={(v) => v && setPaperType(v as PaperType)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAPER_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {PAPER_TYPE_LABELS[t].title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Paper name</Label>
        <Input name="paperName" required />
      </div>
      <div>
        <Label>Offering department</Label>
        <Select
          value={departmentId}
          onValueChange={(v) => v && setDepartmentId(v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select department" />
          </SelectTrigger>
          <SelectContent>
            {departments.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.name}
                {d.departmentRoom ? ` · ${d.departmentRoom}` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" disabled={pending || !departmentId} className="md:col-span-2 w-fit">
        Add paper
      </Button>
    </form>
  );
}
