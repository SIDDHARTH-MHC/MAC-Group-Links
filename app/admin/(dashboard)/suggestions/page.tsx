import { prisma } from "@/lib/db/prisma";
import { SuggestionsReview } from "@/components/admin/review-suggestions";

export default async function AdminSuggestionsPage() {
  const items = await prisma.suggestion.findMany({
    where: { status: "PENDING" },
    include: { paper: true, group: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Pending suggestions</h1>
      <SuggestionsReview items={items} />
    </div>
  );
}
