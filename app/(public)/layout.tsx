import { SiteHeader } from "@/components/layout/site-header";
import { MobileNav } from "@/components/layout/mobile-nav";

export const dynamic = "force-dynamic";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto min-h-[calc(100vh-8rem)] w-full max-w-5xl flex-1 px-4 py-6 pb-24 md:pb-8">
        {children}
      </main>
      <MobileNav />
    </>
  );
}
