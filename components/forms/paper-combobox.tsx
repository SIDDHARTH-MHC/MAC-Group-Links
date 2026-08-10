"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Input } from "@/components/ui/input";
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
  disabled = false,
  emptyMessage = "No papers found.",
}: {
  papers: PaperOption[];
  value: string;
  onValueChange: (paperId: string) => void;
  placeholder?: string;
  id?: string;
  disabled?: boolean;
  emptyMessage?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  const selected = papers.find((p) => p.id === value);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return papers;
    return papers.filter((p) => p.paperName.toLowerCase().includes(q));
  }, [papers, query]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  useEffect(() => {
    if (disabled) {
      setOpen(false);
      setQuery("");
    }
  }, [disabled]);

  return (
    <div ref={rootRef} className="relative">
      <button
        id={id}
        type="button"
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={cn(
          "flex h-11 w-full min-w-0 items-center justify-between gap-2 rounded-lg border border-input bg-card px-3 py-2 text-sm shadow-xs outline-none",
          "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
          "disabled:cursor-not-allowed disabled:opacity-50",
        )}
        onClick={() => {
          if (disabled) return;
          setOpen((prev) => !prev);
        }}
      >
        <span className="truncate text-left">
          {selected ? (
            selected.paperName
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </span>
        <ChevronsUpDown className="size-4 shrink-0 opacity-50" aria-hidden />
      </button>

      {open ? (
        <div className="relative z-20 mt-2 overflow-hidden rounded-lg border border-border bg-popover shadow-md">
          <div className="border-b border-border p-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type to search paper name…"
              className="h-10"
              autoFocus
              aria-label="Search papers"
            />
          </div>
          <ul
            className="max-h-56 overflow-y-auto overscroll-contain p-1"
            role="listbox"
            aria-label="Papers"
          >
            {filtered.length === 0 ? (
              <li className="px-3 py-8 text-center text-sm text-muted-foreground">
                {emptyMessage}
              </li>
            ) : (
              filtered.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={p.id === value}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-left text-sm hover:bg-accent hover:text-accent-foreground",
                      p.id === value && "bg-accent/70 font-medium",
                    )}
                    onClick={() => {
                      onValueChange(p.id);
                      setOpen(false);
                      setQuery("");
                    }}
                  >
                    <Check
                      className={cn(
                        "size-4 shrink-0",
                        p.id === value ? "opacity-100" : "opacity-0",
                      )}
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1 leading-snug">
                      {p.paperName}
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
