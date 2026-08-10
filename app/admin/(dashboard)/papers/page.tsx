import { prisma } from "@/lib/db/prisma";
import { getActiveSemester } from "@/lib/db/semester";
import { listActiveDepartments } from "@/lib/db/departments";
import { PaperAdminClient } from "@/components/admin/paper-admin";

export default async function AdminPapersPage() {
  const semesters = await prisma.semester.findMany({
    orderBy: [{ academicYear: "desc" }, { semesterNumber: "desc" }],
  });
  const active = await getActiveSemester();
  const [papers, departments] = await Promise.all([
    prisma.paper.findMany({
      include: {
        department: true,
        _count: { select: { groups: true } },
      },
      orderBy: [{ paperType: "asc" }, { paperName: "asc" }],
    }),
    listActiveDepartments(),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Paper catalogue</h1>
      <PaperAdminClient
        semesters={semesters}
        activeSemesterId={active?.id ?? semesters[0]?.id ?? ""}
        papers={papers}
        departments={departments}
      />
    </div>
  );
}
