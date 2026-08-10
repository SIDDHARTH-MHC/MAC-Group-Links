import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { MobileNav } from "@/components/layout/mobile-nav";
import { CoursePrefsCard } from "@/components/layout/course-prefs-card";

export const dynamic = "force-dynamic";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto min-h-[calc(100vh-8rem)] w-full max-w-6xl flex-1 px-4 py-6 pb-28 md:pb-10">
        <div className="mb-6 hidden md:block">
          <CoursePrefsCard />
        </div>
        {children}
        <SiteFooter />
      </main>
      <MobileNav />
    </>
  );
}
