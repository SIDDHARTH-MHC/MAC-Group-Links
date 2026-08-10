import { prisma } from "@/lib/db/prisma";
import { SemesterAdmin } from "@/components/admin/semester-admin";

export default async function AdminSemestersPage() {
  const semesters = await prisma.semester.findMany({
    orderBy: [{ academicYear: "desc" }, { semesterNumber: "desc" }],
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Semesters</h1>
      <SemesterAdmin semesters={semesters} />
    </div>
  );
}
