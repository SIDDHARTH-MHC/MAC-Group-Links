import Link from "next/link";

export default function MorePage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">More</h1>
      <ul className="divide-y divide-amber-100 rounded-xl border border-amber-100 bg-white">
        {[
          { href: "/about", label: "About" },
          { href: "/suggest", label: "Suggest a paper or edit" },
          { href: "/papers/sec", label: "Browse SEC papers" },
        ].map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="block px-4 py-3 text-amber-950 hover:bg-amber-50"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
