"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { submitGroupReport } from "@/lib/actions/public";

export function ReportGroupButton({ groupId, paperId }: { groupId: string; paperId: string }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (!open) {
    return (
      <Button type="button" variant="ghost" size="sm" className="w-full" onClick={() => setOpen(true)}>
        Report this group
      </Button>
    );
  }

  return (
    <form
      className="mt-2 space-y-2 rounded-xl border border-amber-100 bg-amber-50/50 p-3"
      onSubmit={async (e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const result = await submitGroupReport({
          groupId,
          paperId,
          reason: fd.get("reason"),
          description: fd.get("description") || undefined,
        });
        setMessage(result.ok ? result.message : result.error);
      }}
    >
      <select name="reason" className="h-10 w-full rounded-lg border px-2 text-sm" required defaultValue="LINK_DOESNT_WORK">
        <option value="LINK_DOESNT_WORK">Link doesn&apos;t work</option>
        <option value="WRONG_PAPER">Wrong paper</option>
        <option value="WRONG_COURSE_YEAR">Wrong course/year</option>
        <option value="WRONG_SECTION">Wrong section</option>
        <option value="OLD_GROUP">Old group</option>
        <option value="NOT_COLLEGE_GROUP">Not a college group</option>
        <option value="OTHER">Other</option>
      </select>
      <textarea name="description" className="w-full rounded-lg border p-2 text-sm" placeholder="Details (optional)" rows={2} />
      <div className="flex gap-2">
        <Button type="submit" size="sm">
          Send report
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
      {message && <p className="text-xs text-stone-600">{message}</p>}
    </form>
  );
}
