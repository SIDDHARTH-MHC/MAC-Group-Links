"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, PlusCircle, Menu } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "Home", icon: Home },
  { href: "/search", label: "Search", icon: Search },
  // { href: "/my-course", label: "My Course", icon: GraduationCap },
  { href: "/contribute", label: "Contribute", icon: PlusCircle },
  { href: "/more", label: "More", icon: Menu },
];

export function MobileNav() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card pb-[env(safe-area-inset-bottom)] md:hidden"
      aria-label="Mobile navigation"
    >
      <ul className="mx-auto flex max-w-lg justify-around">
        {items.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  "flex min-h-[3.25rem] min-w-[4.25rem] flex-col items-center justify-center gap-0.5 px-2 py-1 text-[11px]",
                  active
                    ? "font-semibold text-primary"
                    : "text-muted-foreground",
                )}
              >
                <Icon className="h-5 w-5" aria-hidden />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
