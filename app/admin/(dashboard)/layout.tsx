import { AdminSidebar } from "@/components/admin/admin-sidebar";

export const dynamic = "force-dynamic";

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-muted/30 md:flex">
      <AdminSidebar />
      <div className="min-w-0 flex-1">
        <main className="p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
