import { prisma } from "@/lib/db/prisma";
import { ReportsReview } from "@/components/admin/review-reports";

export default async function AdminReportsPage() {
  const items = await prisma.groupReport.findMany({
    where: { status: "PENDING" },
    include: { group: true, paper: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Group reports</h1>
      <ReportsReview items={items} />
    </div>
  );
}
