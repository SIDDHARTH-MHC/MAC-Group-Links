import Link from "next/link";
import { getActiveSemester } from "@/lib/db/semester";
import { getAdminStats } from "@/lib/db/admin-stats";
import { cnSemesterLabel } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminDashboardPage() {
  const semester = await getActiveSemester();
  const stats = semester ? await getAdminStats(semester.id) : null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        {semester ? (
          <div className="mt-3 rounded-lg border border-border bg-card px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Active semester
            </p>
            <p className="mt-1 font-semibold text-foreground">
              {cnSemesterLabel(semester.academicYear, semester.semesterNumber)}
            </p>
          </div>
        ) : (
          <p className="mt-2 text-destructive">No active semester — create one first.</p>
        )}
      </div>

      {stats && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard title="Papers" value={stats.totalPapers} />
            <StatCard title="Groups" value={stats.totalGroups} />
            <StatCard
              title="Pending contributions"
              value={stats.pendingContributions}
            />
            <StatCard
              title="Pending suggestions"
              value={stats.pendingSuggestions}
            />
            <StatCard title="Reports" value={stats.pendingReports} />
          </div>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">Quick actions</h2>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <Button asChild size="lg">
                <Link href="/admin/papers">Add Paper</Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/admin/papers/import">Import Catalogue</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/admin/contributions">Review Contributions</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/admin/suggestions">Review Suggestions</Link>
              </Button>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold tabular-nums text-foreground">{value}</p>
      </CardContent>
    </Card>
  );
}
