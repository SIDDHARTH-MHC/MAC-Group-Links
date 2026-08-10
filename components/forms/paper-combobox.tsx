"use client";

import { useMemo, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type PaperOption = {
  id: string;
  paperName: string;
  paperType: string;
};

export function PaperCombobox({
  papers,
  value,
  onValueChange,
  placeholder = "Select paper…",
  id,
}: {
  papers: PaperOption[];
  value: string;
  onValueChange: (paperId: string) => void;
  placeholder?: string;
  id?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = papers.find((p) => p.id === value);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return papers;
    return papers.filter(
      (p) =>
        p.paperName.toLowerCase().includes(q) ||
        p.paperType.toLowerCase().includes(q),
    );
  }, [papers, query]);

  return (
    <Popover open={open} onOpenChange={(next) => setOpen(next)}>
      <PopoverTrigger
        id={id}
        className={cn(
          "flex h-10 w-full min-w-0 items-center justify-between gap-2 rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none",
          "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
          "dark:bg-input/30",
        )}
      >
        <span className="truncate text-left">
          {selected ? (
            <>
              <span className="text-muted-foreground">[{selected.paperType}]</span>{" "}
              {selected.paperName}
            </>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </span>
        <ChevronsUpDown className="size-4 shrink-0 opacity-50" aria-hidden />
      </PopoverTrigger>
      <PopoverContent className="p-2" sideOffset={6}>
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search papers…"
          className="h-9"
          autoFocus
        />
        <ul
          className="mt-2 max-h-60 overflow-y-auto rounded-md border border-border"
          role="listbox"
        >
          {filtered.length === 0 ? (
            <li className="px-3 py-6 text-center text-sm text-muted-foreground">
              No papers found.
            </li>
          ) : (
            filtered.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={p.id === value}
                  className={cn(
                    "flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground",
                    p.id === value && "bg-accent/60",
                  )}
                  onClick={() => {
                    onValueChange(p.id);
                    setOpen(false);
                    setQuery("");
                  }}
                >
                  <Check
                    className={cn(
                      "mt-0.5 size-4 shrink-0",
                      p.id === value ? "opacity-100" : "opacity-0",
                    )}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1">
                    <span className="text-muted-foreground">[{p.paperType}]</span>{" "}
                    {p.paperName}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
