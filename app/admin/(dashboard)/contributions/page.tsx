import { prisma } from "@/lib/db/prisma";
import { getSiteSettings } from "@/lib/settings/site";
import { AutoApproveContributionsToggle } from "@/components/admin/auto-approve-contributions-toggle";
import { ContributionsReview } from "@/components/admin/review-contributions";

export default async function AdminContributionsPage() {
  const [items, settings] = await Promise.all([
    prisma.groupContribution.findMany({
      where: { status: "PENDING" },
      include: {
        paper: true,
        eligibilities: { include: { course: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    getSiteSettings(),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Pending contributions</h1>
      <AutoApproveContributionsToggle
        enabled={settings.autoApproveContributions}
      />
      <ContributionsReview items={items} />
    </div>
  );
}
