"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
          const courseId = String(fd.get("courseId") || "");
          const year = Number(fd.get("year") || 0);
          await createGroup({
            paperId: paper.id,
            sectionName: String(fd.get("sectionName")),
            teacherName: String(fd.get("teacherName") || "") || undefined,
            actualClassRoom: String(fd.get("actualClassRoom") || "") || undefined,
            groupLink: String(fd.get("groupLink") || "") || undefined,
            groupPlatform: "WHATSAPP",
            eligibilities: courseId
              ? [{ courseId, year: year || undefined }]
              : [{ appliesToAll: true }],
          });
          router.refresh();
        }}
      >
        <h2 className="font-semibold">Add group</h2>
        <div className="grid gap-3 sm:grid-cols-2">
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
            <select name="courseId" className="h-11 w-full rounded-xl border px-3">
              <option value="">All students</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Year</Label>
            <select name="year" className="h-11 w-full rounded-xl border px-3" defaultValue="2">
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
            </select>
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
                  if (!confirm("Delete this group?")) return;
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
