"use client";

import { useTransition } from "react";
import { handleReport } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import type { GroupReport, Group, Paper } from "@prisma/client";

type Item = GroupReport & { group: Group; paper: Paper };

export function ReportsReview({ items }: { items: Item[] }) {
  const [pending, startTransition] = useTransition();

  if (items.length === 0) {
    return <p className="text-slate-600">No pending reports.</p>;
  }

  return (
    <ul className="space-y-4">
      {items.map((r) => (
        <li key={r.id} className="rounded-lg border bg-white p-4">
          <p className="font-medium">{r.paper.paperName}</p>
          <p className="text-sm">{r.reason}</p>
          {r.description && <p className="text-sm text-slate-600">{r.description}</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={() =>
                startTransition(() => {
                  void handleReport(r.id, "ignore");
                })
              }
            >
              Ignore
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={() =>
                startTransition(() => {
                  void handleReport(r.id, "expire");
                })
              }
            >
              Mark expired
            </Button>
            <Button
              size="sm"
              disabled={pending}
              onClick={() =>
                startTransition(() => {
                  void handleReport(r.id, "resolve");
                })
              }
            >
              Resolve
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
