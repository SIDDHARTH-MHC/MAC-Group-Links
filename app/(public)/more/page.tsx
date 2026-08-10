import Link from "next/link";
import { ChevronRight } from "lucide-react";

const links = [
  { href: "/about", label: "About", description: "What this site is and how it works" },
  { href: "/papers", label: "Browse papers", description: "SEC, VAC, GE, DSE, AEC, Core, and more" },
  { href: "/contribute", label: "Contribute", description: "Add links or suggest catalogue fixes" },
  { href: "/suggest", label: "Suggest an update", description: "Report wrong paper or group info" },
];

export default function MorePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">More</h1>
      <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
        {links.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="flex items-center justify-between gap-3 px-4 py-4 hover:bg-muted/50"
            >
              <span>
                <span className="block font-medium text-foreground">
                  {item.label}
                </span>
                <span className="text-sm text-muted-foreground">
                  {item.description}
                </span>
              </span>
              <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
