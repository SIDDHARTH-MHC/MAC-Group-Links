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
        <h1 className="text-2xl font-bold">Dashboard</h1>
        {semester ? (
          <p className="text-slate-600">
            Active semester:{" "}
            {cnSemesterLabel(semester.academicYear, semester.semesterNumber)}
          </p>
        ) : (
          <p className="text-amber-700">No active semester — create one first.</p>
        )}
      </div>

      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total papers" value={stats.totalPapers} />
          <StatCard title="Total groups" value={stats.totalGroups} />
          <StatCard title="Groups with links" value={stats.groupsWithLinks} />
          <StatCard title="Groups without links" value={stats.groupsWithoutLinks} />
          <StatCard title="Pending contributions" value={stats.pendingContributions} />
          <StatCard title="Pending suggestions" value={stats.pendingSuggestions} />
          <StatCard title="Pending reports" value={stats.pendingReports} />
        </div>
      )}

      {stats && (
        <Card>
          <CardHeader>
            <CardTitle>Papers by type</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-2 text-sm sm:grid-cols-6">
            <span>SEC: {stats.sec}</span>
            <span>VAC: {stats.vac}</span>
            <span>GE: {stats.ge}</span>
            <span>DSE: {stats.dse}</span>
            <span>AEC: {stats.aec}</span>
            <span>CORE: {stats.core}</span>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap gap-2">
        <Button asChild>
          <Link href="/admin/semesters">+ New semester</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/admin/papers">Add paper</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/admin/contributions">Review contributions</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/admin/suggestions">Review suggestions</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/admin/reports">Review reports</Link>
        </Button>
      </div>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-slate-600">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}
