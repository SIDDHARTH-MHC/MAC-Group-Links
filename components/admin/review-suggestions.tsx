"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  applySuggestion,
  approveAllNewPaperSuggestions,
  rejectSuggestion,
} from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import type { Suggestion, Paper, Group } from "@prisma/client";

type Item = Suggestion & { paper: Paper | null; group: Group | null };

export function SuggestionsReview({ items }: { items: Item[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const newPaperItems = items.filter((s) => s.type === "NEW_PAPER");

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

  function approveAllNewPapers() {
    setError(null);
    setNotice(null);
    startTransition(async () => {
      const result = await approveAllNewPaperSuggestions();
      if (result.approved > 0) {
        setNotice(
          `Approved ${result.approved} new-paper suggestion${result.approved === 1 ? "" : "s"}.`,
        );
        router.refresh();
      }
      if (result.failed.length > 0) {
        setError(
          result.failed.map((f) => `${f.label}: ${f.error}`).join("\n"),
        );
      } else if (result.approved === 0) {
        setError("No pending new-paper suggestions to approve.");
      }
    });
  }

  if (items.length === 0) {
    return <p className="text-slate-600">No pending suggestions.</p>;
  }

  return (
    <div className="space-y-4">
      {newPaperItems.length > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-600">
            {newPaperItems.length} pending new-paper suggestion
            {newPaperItems.length === 1 ? "" : "s"}
          </p>
          <Button disabled={pending} onClick={approveAllNewPapers}>
            Approve all new papers
          </Button>
        </div>
      ) : null}
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
        {items.map((s) => (
          <li key={s.id} className="rounded-lg border bg-white p-4">
            <p className="text-xs text-slate-500">{s.type}</p>
            <p className="font-medium">
              {s.paper?.paperName ?? s.paperName ?? "General"}
            </p>
            <p className="mt-2 text-sm">{s.description}</p>
            {s.suggestedValue && (
              <p className="text-sm text-slate-600">
                Suggested: {s.suggestedValue}
              </p>
            )}
            {s.groupLink ? (
              <p className="mt-2 text-sm break-all text-slate-600">
                Group link ({s.groupPlatform ?? "WHATSAPP"}): {s.groupLink}
              </p>
            ) : null}
            <div className="mt-3 flex gap-2">
              <Button
                size="sm"
                disabled={pending}
                onClick={() => runAction(() => applySuggestion(s.id))}
              >
                Apply
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() => runAction(() => rejectSuggestion(s.id))}
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
