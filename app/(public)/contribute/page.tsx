import Link from "next/link";
import { PlusCircle, FilePlus, PencilLine } from "lucide-react";

const options = [
  {
    href: "/contribute/add",
    title: "Add Group Link",
    description: "Share a WhatsApp or Telegram link for your class section.",
    icon: PlusCircle,
  },
  {
    href: "/suggest?tab=new",
    title: "Suggest a Paper",
    description: "Tell admin if a paper is missing from the catalogue.",
    icon: FilePlus,
  },
  {
    href: "/suggest",
    title: "Suggest an Edit",
    description: "Fix wrong eligibility, teacher, room, or group link info.",
    icon: PencilLine,
  },
];

export default function ContributeHubPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          Help your classmates
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground md:text-base">
          Contributions are reviewed before they appear publicly. No login
          required.
        </p>
      </header>
      <ul className="grid gap-4 sm:grid-cols-1">
        {options.map(({ href, title, description, icon: Icon }) => (
          <li key={href}>
            <Link
              href={href}
              className="flex gap-4 rounded-xl border border-border bg-card p-5 shadow-sm transition-colors hover:border-primary/30 hover:bg-accent/20"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-6 w-6" aria-hidden />
              </span>
              <span>
                <span className="block text-lg font-semibold text-foreground">
                  {title}
                </span>
                <span className="mt-1 block text-sm text-muted-foreground">
                  {description}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
