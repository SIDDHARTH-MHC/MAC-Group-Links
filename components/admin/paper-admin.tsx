"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
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
import type { Paper, PaperType, Semester } from "@prisma/client";

export function PaperAdminClient({
  semesters,
  activeSemesterId,
  papers,
}: {
  semesters: Semester[];
  activeSemesterId: string;
  papers: (Paper & { _count: { groups: number } })[];
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

      <NewPaperForm semesterId={semesterId} />

      <div className="rounded-lg border bg-white p-4">
        <Label>Import papers (JSON array)</Label>
        <Textarea
          className="mt-2 font-mono text-xs"
          rows={6}
          value={importJson}
          onChange={(e) => setImportJson(e.target.value)}
          placeholder='[{"paperType":"SEC","paperName":"...","offeringDepartment":"Economics","departmentRoom":"232","eligibilities":[{"appliesToAll":true}]}]'
        />
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
          Import
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border bg-white">
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
                  {paper.offeringDepartment}
                  {paper.departmentRoom ? ` (${paper.departmentRoom})` : ""}
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
    </div>
  );
}

function NewPaperForm({ semesterId }: { semesterId: string }) {
  const [paperType, setPaperType] = useState<PaperType>("SEC");
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
            offeringDepartment: String(fd.get("offeringDepartment")),
            departmentRoom: String(fd.get("departmentRoom") || "") || undefined,
            eligibilities: [{ appliesToAll: true }],
          });
          e.currentTarget.reset();
        });
      }}
    >
      <h2 className="md:col-span-2 font-semibold">Add paper</h2>
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
        <Input name="offeringDepartment" required />
      </div>
      <div>
        <Label>Department room</Label>
        <Input name="departmentRoom" placeholder="Offering dept room" />
      </div>
      <Button type="submit" disabled={pending} className="md:col-span-2 w-fit">
        Add paper
      </Button>
    </form>
  );
}
