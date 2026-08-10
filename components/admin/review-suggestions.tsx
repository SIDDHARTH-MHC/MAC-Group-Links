"use client";

import { useTransition } from "react";
import { applySuggestion, rejectSuggestion } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import type { Suggestion, Paper, Group } from "@prisma/client";

type Item = Suggestion & { paper: Paper | null; group: Group | null };

export function SuggestionsReview({ items }: { items: Item[] }) {
  const [pending, startTransition] = useTransition();

  if (items.length === 0) {
    return <p className="text-slate-600">No pending suggestions.</p>;
  }

  return (
    <ul className="space-y-4">
      {items.map((s) => (
        <li key={s.id} className="rounded-lg border bg-white p-4">
          <p className="text-xs text-slate-500">{s.type}</p>
          <p className="font-medium">
            {s.paper?.paperName ?? s.paperName ?? "General"}
          </p>
          <p className="mt-2 text-sm">{s.description}</p>
          {s.suggestedValue && (
            <p className="text-sm text-slate-600">Suggested: {s.suggestedValue}</p>
          )}
          <div className="mt-3 flex gap-2">
            <Button
              size="sm"
              disabled={pending}
              onClick={() => startTransition(() => { void applySuggestion(s.id); })}
            >
              Apply
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={() => startTransition(() => { void rejectSuggestion(s.id); })}
            >
              Reject
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
