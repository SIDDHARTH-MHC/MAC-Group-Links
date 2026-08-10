"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

export function PaperFilters({
  departments,
  basePath,
}: {
  departments: string[];
  basePath: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dept = searchParams.get("dept") ?? "";
  const q = searchParams.get("q") ?? "";

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`${basePath}?${params.toString()}`);
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <Input
        defaultValue={q}
        placeholder="Filter by name..."
        className="border-amber-200 bg-white"
        onBlur={(e) => update("q", e.target.value)}
      />
      <Select
        value={dept || "all"}
        onValueChange={(v) => update("dept", !v || v === "all" ? "" : v)}
      >
        <SelectTrigger className="border-amber-200 bg-white sm:w-56">
          <SelectValue placeholder="Department" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All departments</SelectItem>
          {departments.map((d) => (
            <SelectItem key={d} value={d}>
              {d}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
