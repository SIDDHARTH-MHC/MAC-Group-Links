"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { setAutoApproveContributions } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";

export function AutoApproveContributionsToggle({
  enabled: initialEnabled,
}: {
  enabled: boolean;
}) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(initialEnabled);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function toggle(next: boolean) {
    setMessage(null);
    startTransition(async () => {
      const result = await setAutoApproveContributions(next);
      if (!result.ok) {
        setMessage(result.error);
        return;
      }
      setEnabled(next);
      setMessage(result.message ?? null);
      router.refresh();
    });
  }

  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-medium">Auto-approve contributions</p>
          <p className="mt-1 text-sm text-slate-600">
            When on, new group link submissions go live immediately without
            manual review.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={enabled ? "default" : "outline"}
            disabled={pending || enabled}
            onClick={() => toggle(true)}
          >
            On
          </Button>
          <Button
            size="sm"
            variant={!enabled ? "default" : "outline"}
            disabled={pending || !enabled}
            onClick={() => toggle(false)}
          >
            Off
          </Button>
        </div>
      </div>
      {message ? (
        <p className="mt-3 text-sm text-slate-700">{message}</p>
      ) : null}
    </div>
  );
}
