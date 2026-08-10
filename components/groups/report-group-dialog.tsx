"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { submitGroupReport } from "@/lib/actions/public";
import { ReportReason } from "@prisma/client";

const REASONS: { value: ReportReason; label: string }[] = [
  { value: "LINK_DOESNT_WORK", label: "Link doesn't work" },
  { value: "WRONG_PAPER", label: "Wrong paper" },
  { value: "WRONG_COURSE_YEAR", label: "Wrong course/year" },
  { value: "WRONG_SECTION", label: "Wrong section" },
  { value: "OLD_GROUP", label: "Old group" },
  { value: "NOT_COLLEGE_GROUP", label: "Not a college group" },
  { value: "OTHER", label: "Other" },
];

export function ReportGroupDialog({ groupId }: { groupId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason>("LINK_DOESNT_WORK");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="text-amber-800 underline">
        Report this group
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report this group</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Reason</Label>
            <Select
              value={reason}
              onValueChange={(v) => setReason(v as ReportReason)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Details (optional)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          {message && <p className="text-sm text-emerald-800">{message}</p>}
          <Button
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const res = await submitGroupReport({
                  groupId,
                  reason,
                  description,
                });
                setMessage(res.ok ? res.message : res.error);
                if (res.ok) setTimeout(() => setOpen(false), 1500);
              })
            }
          >
            {pending ? "Submitting…" : "Submit report"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
