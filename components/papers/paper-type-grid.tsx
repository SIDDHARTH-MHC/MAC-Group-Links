import Link from "next/link";
import { PAPER_TYPE_LABELS, PAPER_TYPES } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function PaperTypeGrid() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {PAPER_TYPES.map((type) => {
        const meta = PAPER_TYPE_LABELS[type];
        return (
          <Link key={type} href={`/papers/${type.toLowerCase()}`}>
            <Card className="h-full border-amber-100 bg-white/80 transition hover:border-amber-300 hover:shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-amber-950">{meta.short}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-amber-900/70">
                {meta.title}
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
