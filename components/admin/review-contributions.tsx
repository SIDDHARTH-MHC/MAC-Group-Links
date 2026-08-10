"use client";

import { useTransition } from "react";
import { approveContribution, rejectContribution } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { formatEligibility } from "@/lib/constants";
import type {
  GroupContribution,
  Paper,
  GroupContributionEligibility,
  Course,
} from "@prisma/client";

type Item = GroupContribution & {
  paper: Paper;
  eligibilities: (GroupContributionEligibility & { course: Course | null })[];
};

export function ContributionsReview({ items }: { items: Item[] }) {
  const [pending, startTransition] = useTransition();

  if (items.length === 0) {
    return <p className="text-slate-600">No pending contributions.</p>;
  }

  return (
    <ul className="space-y-4">
      {items.map((c) => (
        <li key={c.id} className="rounded-lg border bg-white p-4">
          <p className="font-medium">{c.paper.paperName}</p>
          <p className="text-sm text-slate-600">
            Submitted {c.createdAt.toLocaleDateString()} ·{" "}
            {c.contributorType ?? "Contributor"}
          </p>
          <p className="mt-2 text-sm">
            {c.eligibilities.length
              ? c.eligibilities
                  .map((e) =>
                    formatEligibility(
                      e.appliesToAll,
                      e.course?.name,
                      e.year,
                      e.combination
                    )
                  )
                  .join(" · ")
              : c.appliesToAll
                ? "All students"
                : "—"}
          </p>
          <p className="text-sm break-all">{c.groupLink}</p>
          <div className="mt-3 flex gap-2">
            <Button
              size="sm"
              disabled={pending}
              onClick={() =>
                startTransition(() => {
                  void approveContribution(c.id);
                })
              }
            >
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={() =>
                startTransition(() => {
                  void rejectContribution(c.id);
                })
              }
            >
              Reject
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
