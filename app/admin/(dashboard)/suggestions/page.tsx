import { prisma } from "@/lib/db/prisma";
import { getSiteSettings } from "@/lib/settings/site";
import { AutoApproveContributionsToggle } from "@/components/admin/auto-approve-contributions-toggle";
import { SuggestionsReview } from "@/components/admin/review-suggestions";

export default async function AdminSuggestionsPage() {
  const [items, settings] = await Promise.all([
    prisma.suggestion.findMany({
      where: { status: "PENDING" },
      include: { paper: true, group: true },
      orderBy: { createdAt: "desc" },
    }),
    getSiteSettings(),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Pending suggestions</h1>
      <AutoApproveContributionsToggle
        enabled={settings.autoApproveContributions}
      />
      <SuggestionsReview items={items} />
    </div>
  );
}
