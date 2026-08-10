"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

export function SuggestionSuccess({
  onSuggestAnother,
}: {
  onSuggestAnother: () => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-card px-6 py-10 text-center shadow-sm">
      <CheckCircle2
        className="mx-auto h-12 w-12 text-emerald-600"
        aria-hidden
      />
      <h2 className="mt-4 text-xl font-semibold text-foreground">
        Suggestion submitted
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        Thanks! Your suggestion has been sent to the MAC Group Links admin for
        review.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button type="button" variant="secondary" onClick={onSuggestAnother}>
          Suggest another
        </Button>
        <Button asChild>
          <Link href="/">Back to Home</Link>
        </Button>
      </div>
    </div>
  );
}
