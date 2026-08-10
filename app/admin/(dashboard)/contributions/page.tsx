import { prisma } from "@/lib/db/prisma";
import { ContributionsReview } from "@/components/admin/review-contributions";

export default async function AdminContributionsPage() {
  const items = await prisma.groupContribution.findMany({
    where: { status: "PENDING" },
    include: {
      paper: true,
      eligibilities: { include: { course: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Pending contributions</h1>
      <ContributionsReview items={items} />
    </div>
  );
}
