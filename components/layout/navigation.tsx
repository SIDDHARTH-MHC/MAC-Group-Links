import Link from "next/link";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Home" },
  { href: "/search", label: "Papers" },
  { href: "/contribute", label: "Contribute" },
  { href: "/about", label: "About" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-stone-200 bg-[#faf7f2]/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="min-w-0">
          <p className="truncate text-base font-semibold text-stone-900">MAC Group Links</p>
          <p className="truncate text-xs text-stone-600">Maharaja Agrasen College</p>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

export function MobileBottomNav({ active }: { active?: string }) {
  const items = [
    { href: "/", label: "Home", key: "home" },
    { href: "/search", label: "Search", key: "search" },
    { href: "/my-course", label: "My Course", key: "course" },
    { href: "/contribute", label: "Contribute", key: "contribute" },
    { href: "/more", label: "More", key: "more" },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-200 bg-white/95 backdrop-blur md:hidden">
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {items.map((item) => (
          <li key={item.key}>
            <Link
              href={item.href}
              className={cn(
                "flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 text-[11px] font-medium",
                active === item.key ? "text-amber-800" : "text-stone-600",
              )}
            >
              <span>{item.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
