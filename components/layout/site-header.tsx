import Link from "next/link";
import { Search } from "lucide-react";

const links = [
  { href: "/", label: "Home" },
  { href: "/papers/sec", label: "Papers" },
  { href: "/contribute", label: "Contribute" },
  { href: "/about", label: "About" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-amber-100/80 bg-[#fffaf3]/95 backdrop-blur supports-[backdrop-filter]:bg-[#fffaf3]/80">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4">
        <Link href="/" className="font-semibold text-amber-950">
          MAC Group Links
        </Link>
        <nav className="hidden items-center gap-5 text-sm text-amber-900/80 md:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-amber-950">
              {l.label}
            </Link>
          ))}
        </nav>
        <Link
          href="/search"
          className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-white px-3 py-1.5 text-sm text-amber-900 md:hidden"
        >
          <Search className="h-4 w-4" />
          Search
        </Link>
      </div>
    </header>
  );
}
