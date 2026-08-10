"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function PublicError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-lg space-y-4 py-12 text-center">
      <h1 className="text-2xl font-bold text-foreground">
        Something went wrong
      </h1>
      <p className="text-muted-foreground">
        {error.digest
          ? "The server had trouble loading this page. Try again in a moment."
          : "This page hit an unexpected error. Reloading often fixes it."}
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button type="button" onClick={() => reset()}>
          Try again
        </Button>
        <Button type="button" variant="outline" asChild>
          <a href="/">Go home</a>
        </Button>
      </div>
    </div>
  );
}
