"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, GraduationCap, PlusCircle, Menu } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "Home", icon: Home },
  { href: "/search", label: "Search", icon: Search },
  { href: "/my-course", label: "My Course", icon: GraduationCap },
  { href: "/contribute", label: "Contribute", icon: PlusCircle },
  { href: "/more", label: "More", icon: Menu },
];

export function MobileNav() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-amber-100 bg-[#fffaf3] pb-[env(safe-area-inset-bottom)] md:hidden">
      <ul className="mx-auto flex max-w-lg justify-around">
        {items.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/"
              ? pathname === "/"
              : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  "flex min-w-[4.5rem] flex-col items-center gap-0.5 px-2 py-2.5 text-[10px]",
                  active ? "text-amber-900 font-medium" : "text-amber-800/60"
                )}
              >
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
