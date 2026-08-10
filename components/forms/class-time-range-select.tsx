"use client";

import { useMemo } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  CLASS_TIME_EMPTY,
  MAC_CLASS_END_TIMES,
  MAC_CLASS_START_TIMES,
  classTimeOptionsWithCurrent,
  nextEndAfterStart,
} from "@/lib/constants/class-times";

type ClassTimeRangeSelectProps = {
  startTime: string;
  endTime: string;
  onStartTimeChange: (value: string) => void;
  onEndTimeChange: (value: string) => void;
  label?: string;
};

export function ClassTimeRangeSelect({
  startTime,
  endTime,
  onStartTimeChange,
  onEndTimeChange,
  label = "Class time (optional)",
}: ClassTimeRangeSelectProps) {
  const startOptions = useMemo(
    () => classTimeOptionsWithCurrent(MAC_CLASS_START_TIMES, startTime),
    [startTime],
  );
  const endOptions = useMemo(
    () => classTimeOptionsWithCurrent(MAC_CLASS_END_TIMES, endTime),
    [endTime],
  );

  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <Select
          value={startTime || CLASS_TIME_EMPTY}
          onValueChange={(v) => {
            const next = v === CLASS_TIME_EMPTY ? "" : (v ?? "");
            onStartTimeChange(next);
            if (next) {
              const suggested = nextEndAfterStart(next);
              if (suggested && (!endTime || endTime === next)) {
                onEndTimeChange(suggested);
              }
            }
          }}
        >
          <SelectTrigger className="min-w-0 flex-1">
            <span
              className={
                startTime
                  ? "truncate text-sm"
                  : "truncate text-sm text-muted-foreground"
              }
            >
              {startTime || "Start"}
            </span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={CLASS_TIME_EMPTY}>Not set</SelectItem>
            {startOptions.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="shrink-0 text-muted-foreground">–</span>
        <Select
          value={endTime || CLASS_TIME_EMPTY}
          onValueChange={(v) =>
            onEndTimeChange(v === CLASS_TIME_EMPTY ? "" : (v ?? ""))
          }
        >
          <SelectTrigger className="min-w-0 flex-1">
            <span
              className={
                endTime
                  ? "truncate text-sm"
                  : "truncate text-sm text-muted-foreground"
              }
            >
              {endTime || "End"}
            </span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={CLASS_TIME_EMPTY}>Not set</SelectItem>
            {endOptions.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
