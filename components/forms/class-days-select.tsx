"use client";

import { Label } from "@/components/ui/label";
import {
  MAC_WEEKDAYS,
  parseClassDays,
  toggleClassDay,
} from "@/lib/constants/class-days";
import { cn } from "@/lib/utils";

type ClassDaysSelectProps = {
  value: string;
  onChange: (value: string) => void;
  label?: string;
};

export function ClassDaysSelect({
  value,
  onChange,
  label = "Class days (optional)",
}: ClassDaysSelectProps) {
  const selected = parseClassDays(value);

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <ul className="flex flex-wrap gap-2">
        {MAC_WEEKDAYS.map((day) => {
          const checked = selected.includes(day);
          return (
            <li key={day}>
              <label
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors",
                  checked
                    ? "border-primary/40 bg-primary/10 text-foreground"
                    : "border-border bg-muted/30 text-muted-foreground hover:bg-muted/50",
                )}
              >
                <input
                  type="checkbox"
                  className="size-4 shrink-0 accent-primary"
                  checked={checked}
                  onChange={() => onChange(toggleClassDay(value, day))}
                />
                <span className="whitespace-nowrap">{day}</span>
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
