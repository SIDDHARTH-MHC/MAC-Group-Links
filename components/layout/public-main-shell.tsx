"use client";

import { usePathname } from "next/navigation";
import { SiteFooter } from "@/components/layout/site-footer";
import { CoursePrefsCard } from "@/components/layout/course-prefs-card";

const FORM_ROUTES = new Set([
  "/suggest",
  "/contribute",
  "/contribute/add",
  "/my-course",
]);

export function PublicMainShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isFormRoute = FORM_ROUTES.has(pathname);

  return (
    <main
      className={
        isFormRoute
          ? "mx-auto min-h-[calc(100vh-8rem)] w-full max-w-[700px] flex-1 px-4 py-6 pb-28 md:px-5 md:pb-10"
          : "mx-auto min-h-[calc(100vh-8rem)] w-full max-w-6xl flex-1 px-4 py-6 pb-28 md:pb-10"
      }
    >
      {!isFormRoute ? (
        <div className="mb-6 hidden md:block">
          <CoursePrefsCard />
        </div>
      ) : null}
      {children}
      <SiteFooter />
    </main>
  );
}
