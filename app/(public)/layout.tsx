import { SiteHeader } from "@/components/layout/site-header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { PublicMainShell } from "@/components/layout/public-main-shell";

export const dynamic = "force-dynamic";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteHeader />
      <PublicMainShell>{children}</PublicMainShell>
      <MobileNav />
    </>
  );
}
