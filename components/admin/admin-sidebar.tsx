"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { adminLogout } from "@/lib/actions/admin";
import { cn } from "@/lib/utils";

export const adminNavLinks = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/semesters", label: "Semesters" },
  { href: "/admin/papers", label: "Papers" },
  { href: "/admin/groups", label: "Groups" },
  { href: "/admin/contributions", label: "Contributions" },
  { href: "/admin/suggestions", label: "Suggestions" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/audit", label: "Audit Logs" },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <>
      <aside className="hidden w-56 shrink-0 flex-col border-r border-border bg-card md:flex">
        <div className="border-b border-border p-4">
          <p className="font-semibold text-foreground">MAC Admin</p>
          <p className="text-xs text-muted-foreground">Catalogue &amp; review</p>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 p-3 text-sm" aria-label="Admin">
          {adminNavLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "rounded-md px-3 py-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                pathname === l.href ||
                  (l.href !== "/admin" && pathname.startsWith(l.href))
                  ? "bg-muted font-medium text-foreground"
                  : "",
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <form action={adminLogout} className="border-t border-border p-3">
          <Button type="submit" variant="outline" className="w-full">
            Logout
          </Button>
        </form>
      </aside>

      <header className="flex items-center justify-between border-b border-border bg-card px-4 py-3 md:hidden">
        <p className="font-semibold text-foreground">MAC Admin</p>
        <Sheet>
          <SheetTrigger
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background"
            aria-label="Open admin menu"
          >
            <Menu className="h-5 w-5" />
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <SheetHeader className="border-b border-border p-4 text-left">
              <SheetTitle>Menu</SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col p-2">
              {adminNavLinks.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="rounded-md px-3 py-2.5 text-sm text-foreground hover:bg-muted"
                >
                  {l.label}
                </Link>
              ))}
            </nav>
            <form action={adminLogout} className="border-t border-border p-4">
              <Button type="submit" variant="outline" className="w-full">
                Logout
              </Button>
            </form>
          </SheetContent>
        </Sheet>
      </header>
    </>
  );
}
