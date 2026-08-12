import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AdminDashboardNotFound() {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
      <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
        404
      </p>
      <h1 className="mt-3 text-2xl font-bold text-foreground">Page not found</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        This admin page does not exist, or the item you opened was removed.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
        <Button asChild>
          <Link href="/admin">Dashboard</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/admin/papers">Papers</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/admin/groups">Groups</Link>
        </Button>
      </div>
    </div>
  );
}
