"use client";

import { useEffect } from "react";

const RELOAD_KEY = "mac-group-links-chunk-reload";

function shouldReloadForMessage(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("loading chunk") ||
    lower.includes("failed to fetch dynamically imported module") ||
    lower.includes("importing a module script failed")
  );
}

/** Recover once when cached HTML points at JS chunks from an older deploy. */
export function ChunkRecovery() {
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      const message = event.message ?? "";
      if (!shouldReloadForMessage(message)) return;
      if (sessionStorage.getItem(RELOAD_KEY)) return;
      sessionStorage.setItem(RELOAD_KEY, "1");
      window.location.reload();
    };

    const onRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const message =
        typeof reason === "string"
          ? reason
          : reason instanceof Error
            ? reason.message
            : "";
      if (!shouldReloadForMessage(message)) return;
      if (sessionStorage.getItem(RELOAD_KEY)) return;
      sessionStorage.setItem(RELOAD_KEY, "1");
      window.location.reload();
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
