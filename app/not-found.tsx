import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function RootNotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
      <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
        404
      </p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground">
        Page not found
      </h1>
      <p className="mt-3 text-base text-muted-foreground">
        This page does not exist or may have been moved.
      </p>
      <div className="mt-8">
        <Button asChild size="lg">
          <Link href="/">Go home</Link>
        </Button>
      </div>
    </main>
  );
}
