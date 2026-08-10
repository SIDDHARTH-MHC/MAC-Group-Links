import { Suspense } from "react";
import SearchPage from "./page";

export default function SearchRoute() {
  return (
    <Suspense fallback={<p className="p-4 text-sm">Loading search…</p>}>
      <SearchPage />
    </Suspense>
  );
}
