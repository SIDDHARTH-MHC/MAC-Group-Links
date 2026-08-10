import Link from "next/link";
import { PAPER_TYPE_LABELS, MAC_PAPER_TYPES, getPaperTypeLabel } from "@/lib/constants";

export function PaperTypeGrid() {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      {MAC_PAPER_TYPES.map((type) => {
        const meta = PAPER_TYPE_LABELS[type];
        return (
          <Link
            key={type}
            href={`/papers/${type.toLowerCase()}`}
            className="flex min-h-[5.5rem] flex-col justify-center rounded-xl border border-border bg-card px-4 py-4 transition-all hover:border-primary/40 hover:shadow-sm active:scale-[0.98]"
          >
            <span className="text-xl font-bold text-foreground">{meta.short}</span>
            <span className="mt-1 text-xs leading-snug text-muted-foreground">
              {meta.title}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
