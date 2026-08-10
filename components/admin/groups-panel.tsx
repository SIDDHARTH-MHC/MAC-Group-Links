"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { MAC_YEARS } from "@/lib/constants/courses";
import {
  createGroup,
  deleteGroup,
  markGroupExpired,
  verifyGroupLink,
} from "@/lib/actions/admin";
import type { Course, Group, GroupEligibility, Paper } from "@prisma/client";

type GroupRow = Group & {
  eligibilities: (GroupEligibility & { course: Course | null })[];
};

export function AdminGroupsPanel({
  paper,
  groups,
  courses,
}: {
  paper: Paper;
  groups: GroupRow[];
  courses: Course[];
}) {
  const router = useRouter();
  const [courseId, setCourseId] = useState("");
  const [year, setYear] = useState("2");

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-slate-600">
          {paper.paperType} • {paper.paperName}
        </p>
        <h1 className="text-2xl font-bold">Groups</h1>
      </div>

      <form
        className="space-y-3 rounded-xl border bg-white p-4"
        onSubmit={async (e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          await createGroup({
            paperId: paper.id,
            sectionName: String(fd.get("sectionName")),
            teacherName: String(fd.get("teacherName") || "") || undefined,
            actualClassRoom: String(fd.get("actualClassRoom") || "") || undefined,
            groupLink: String(fd.get("groupLink") || "") || undefined,
            groupPlatform: "WHATSAPP",
            eligibilities: courseId
              ? [{ courseId, year: Number(year) || undefined }]
              : [{ appliesToAll: true }],
          });
          router.refresh();
        }}
      >
        <h2 className="font-semibold">Add group</h2>
        <div className="grid max-w-xl gap-3">
          <div className="space-y-2">
            <Label>Section</Label>
            <Input name="sectionName" defaultValue="Group A" required />
          </div>
          <div className="space-y-2">
            <Label>Teacher</Label>
            <Input name="teacherName" />
          </div>
          <div className="space-y-2">
            <Label>Actual class room</Label>
            <Input name="actualClassRoom" />
          </div>
          <div className="space-y-2">
            <Label>Group link</Label>
            <Input name="groupLink" placeholder="https://..." />
          </div>
          <div className="space-y-2">
            <Label>Course</Label>
            <Select
              value={courseId || "all"}
              onValueChange={(v) => setCourseId(!v || v === "all" ? "" : v)}
            >
              <SelectTrigger className="w-full">
                <span
                  className={
                    courseId
                      ? "truncate text-sm"
                      : "truncate text-sm text-muted-foreground"
                  }
                >
                  {courses.find((c) => c.id === courseId)?.name ?? "All students"}
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All students</SelectItem>
                {courses.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Year</Label>
            <Select value={year} onValueChange={(v) => setYear(v ?? "2")}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MAC_YEARS.map((y) => (
                  <SelectItem key={y.value} value={String(y.value)}>
                    {y.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button type="submit">Save group</Button>
      </form>

      <div className="space-y-3">
        {groups.map((group) => (
          <div key={group.id} className="rounded-xl border bg-white p-4 text-sm">
            <p className="font-semibold">{group.sectionName}</p>
            <p>{group.teacherName ?? "Teacher TBA"}</p>
            <p className="truncate text-slate-600">{group.groupLink ?? "No link"}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {group.groupLink && (
                <Button size="sm" variant="secondary" onClick={async () => { await verifyGroupLink(group.id); router.refresh(); }}>
                  Mark verified
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={async () => { await markGroupExpired(group.id, true); router.refresh(); }}>
                Mark expired
              </Button>
              <Button size="sm" variant="outline" onClick={async () => { await markGroupExpired(group.id, false); router.refresh(); }}>
                Restore
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={async () => {
                  await deleteGroup(group.id);
                  router.refresh();
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
