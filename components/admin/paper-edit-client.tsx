"use client";

import { useTransition } from "react";
import Link from "next/link";
import {
  updatePaper,
  createGroup,
  deleteGroup,
  markGroupExpired,
  verifyGroupLink,
} from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  Group,
  Paper,
  PaperEligibility,
  GroupEligibility,
  Course,
} from "@prisma/client";
import { GroupPlatform } from "@prisma/client";

type PaperFull = Paper & {
  eligibilities: (PaperEligibility & { course: Course | null })[];
  groups: (Group & {
    eligibilities: (GroupEligibility & { course: Course | null })[];
  })[];
};

export function PaperEditClient({ paper }: { paper: PaperFull }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-8">
      <div>
        <Link href="/admin/papers" className="text-sm text-slate-600 underline">
          ← Papers
        </Link>
        <h1 className="mt-2 text-2xl font-bold">{paper.paperName}</h1>
      </div>

      <form
        className="grid max-w-xl gap-3 rounded border bg-white p-4"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          startTransition(async () => {
            await updatePaper(paper.id, {
              semesterId: paper.semesterId,
              paperType: paper.paperType,
              paperName: String(fd.get("paperName")),
              offeringDepartment: String(fd.get("offeringDepartment")),
              departmentRoom: String(fd.get("departmentRoom") || "") || undefined,
              eligibilities: paper.eligibilities.map((e) => ({
                courseId: e.courseId ?? undefined,
                year: e.year ?? undefined,
                combination: e.combination ?? undefined,
                appliesToAll: e.appliesToAll,
              })),
            });
          });
        }}
      >
        <Label>Paper name</Label>
        <Input name="paperName" defaultValue={paper.paperName} />
        <Label>Offering department</Label>
        <Input
          name="offeringDepartment"
          defaultValue={paper.offeringDepartment}
        />
        <Label>Department room</Label>
        <Input name="departmentRoom" defaultValue={paper.departmentRoom ?? ""} />
        <Button type="submit" disabled={pending}>
          Save paper
        </Button>
      </form>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Groups</h2>
        <form
          className="mb-6 grid max-w-xl gap-2 rounded border bg-slate-50 p-4"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            startTransition(async () => {
              await createGroup({
                paperId: paper.id,
                sectionName: String(fd.get("sectionName")),
                groupPlatform: (fd.get("platform") as GroupPlatform) || "WHATSAPP",
                groupLink: String(fd.get("groupLink") || "") || undefined,
                teacherName: String(fd.get("teacherName") || "") || undefined,
                actualClassRoom:
                  String(fd.get("actualClassRoom") || "") || undefined,
                eligibilities: [{ appliesToAll: true }],
              });
            });
          }}
        >
          <p className="text-sm font-medium">Add group</p>
          <Input name="sectionName" placeholder="Section A" required />
          <Input name="groupLink" placeholder="Group link URL" />
          <Input name="teacherName" placeholder="Teacher" />
          <Input name="actualClassRoom" placeholder="Actual class room" />
          <Select name="platform" defaultValue="WHATSAPP">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
              <SelectItem value="TELEGRAM">Telegram</SelectItem>
              <SelectItem value="OTHER">Other</SelectItem>
            </SelectContent>
          </Select>
          <Button type="submit" size="sm" disabled={pending}>
            Add group
          </Button>
        </form>

        <ul className="space-y-3">
          {paper.groups.map((g) => (
            <li key={g.id} className="rounded border bg-white p-3 text-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{g.sectionName}</p>
                  <p className="text-slate-600">{g.groupLink ?? "No link"}</p>
                  <p className="text-slate-500">{g.status}</p>
                </div>
                <div className="flex flex-wrap gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      startTransition(() => {
                        void verifyGroupLink(g.id);
                      })
                    }
                  >
                    Verify
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      startTransition(() => {
                        void markGroupExpired(g.id, g.status === "ACTIVE");
                      })
                    }
                  >
                    {g.status === "ACTIVE" ? "Mark expired" : "Restore"}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() =>
                      startTransition(() => {
                        void deleteGroup(g.id);
                      })
                    }
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
