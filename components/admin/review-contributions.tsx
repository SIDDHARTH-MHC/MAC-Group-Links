"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  approveAllContributions,
  approveContribution,
  rejectContribution,
} from "@/lib/actions/admin";
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
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  function runAction(action: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    setNotice(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        setError(result.error ?? "Something went wrong.");
        return;
      }
      router.refresh();
    });
  }

  function approveAll() {
    setError(null);
    setNotice(null);
    startTransition(async () => {
      const result = await approveAllContributions();
      if (result.approved > 0) {
        setNotice(
          `Approved ${result.approved} contribution${result.approved === 1 ? "" : "s"}.`,
        );
        router.refresh();
      }
      if (result.failed.length > 0) {
        setError(
          result.failed.map((f) => `${f.label}: ${f.error}`).join("\n"),
        );
      } else if (result.approved === 0) {
        setError("No pending contributions to approve.");
      }
    });
  }

  if (items.length === 0) {
    return <p className="text-slate-600">No pending contributions.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600">
          {items.length} pending contribution{items.length === 1 ? "" : "s"}
        </p>
        <Button disabled={pending} onClick={approveAll}>
          Approve all
        </Button>
      </div>
      {notice ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {notice}
        </p>
      ) : null}
      {error ? (
        <p className="whitespace-pre-wrap rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      ) : null}
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
                        e.combination,
                      ),
                    )
                    .join(" · ")
                : c.appliesToAll
                  ? "All students taking this paper"
                  : "—"}
            </p>
            <p className="text-sm break-all">{c.groupLink}</p>
            <div className="mt-3 flex gap-2">
              <Button
                size="sm"
                disabled={pending}
                onClick={() => runAction(() => approveContribution(c.id))}
              >
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() => runAction(() => rejectContribution(c.id))}
              >
                Reject
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
