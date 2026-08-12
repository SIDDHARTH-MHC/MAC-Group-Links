"use client";

import { usePathname } from "next/navigation";
import { SiteFooter } from "@/components/layout/site-footer";
import { GroupLinksVerifyDisclaimer } from "@/components/layout/info-disclaimer";
// import { CoursePrefsCard } from "@/components/layout/course-prefs-card";

const FORM_ROUTES = new Set([
  "/suggest",
  "/contribute",
  "/contribute/add",
  "/my-course",
]);

function shouldShowVerifyDisclaimer(pathname: string) {
  return (
    pathname === "/" ||
    pathname === "/papers" ||
    pathname.startsWith("/papers/") ||
    pathname.startsWith("/paper/") ||
    pathname === "/search"
  );
}

export function PublicMainShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isFormRoute = FORM_ROUTES.has(pathname);
  const showVerifyDisclaimer = shouldShowVerifyDisclaimer(pathname);

  return (
    <main
      className={
        isFormRoute
          ? "mx-auto min-h-[calc(100vh-8rem)] w-full max-w-[700px] flex-1 px-4 py-6 pb-28 md:px-5 md:pb-10"
          : "mx-auto min-h-[calc(100vh-8rem)] w-full max-w-6xl flex-1 px-4 py-6 pb-28 md:pb-10"
      }
    >
      {/* Course/year prompt — disabled for now
      {!isFormRoute ? (
        <div className="mb-6 hidden md:block">
          <CoursePrefsCard />
        </div>
      ) : null}
      */}
      {showVerifyDisclaimer ? (
        <div className="mb-6">
          <GroupLinksVerifyDisclaimer />
        </div>
      ) : null}
      {children}
      <SiteFooter />
    </main>
  );
}
