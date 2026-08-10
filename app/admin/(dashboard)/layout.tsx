import Link from "next/link";
import { adminLogout } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/semesters", label: "Semesters" },
  { href: "/admin/papers", label: "Papers" },
  { href: "/admin/contributions", label: "Contributions" },
  { href: "/admin/suggestions", label: "Suggestions" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/audit", label: "Audit log" },
];

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 md:flex">
      <aside className="hidden w-56 shrink-0 border-r bg-white p-4 md:block">
        <p className="mb-6 font-semibold text-slate-900">MAC Admin</p>
        <nav className="flex flex-col gap-1 text-sm">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-md px-2 py-1.5 text-slate-700 hover:bg-slate-100"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <form action={adminLogout} className="mt-8">
          <Button type="submit" variant="outline" size="sm">
            Log out
          </Button>
        </form>
      </aside>
      <div className="flex-1">
        <header className="flex flex-wrap gap-2 border-b bg-white px-4 py-3 md:hidden">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="text-xs text-slate-600">
              {l.label}
            </Link>
          ))}
        </header>
        <main className="p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
