import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminGroupsPanel } from "@/components/admin/groups-panel";
import { prisma } from "@/lib/db/prisma";
import { getAuthoritativeCourses } from "@/lib/courses/db-courses";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function AdminGroupsPage({
  searchParams,
}: {
  searchParams: Promise<{ paperId?: string }>;
}) {
  const { paperId } = await searchParams;

  if (!paperId) {
    const papers = await prisma.paper.findMany({
      include: {
        department: true,
        _count: { select: { groups: true } },
      },
      orderBy: [{ paperType: "asc" }, { paperName: "asc" }],
    });

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Groups</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Choose a paper to add, edit, or remove class group links.
          </p>
        </div>

        {papers.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-card px-4 py-8 text-sm text-muted-foreground">
            No papers in the catalogue yet.{" "}
            <Link
              href="/admin/papers"
              className="font-medium text-primary underline-offset-2 hover:underline"
            >
              Add papers
            </Link>{" "}
            first.
          </p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/40 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Paper</th>
                  <th className="hidden px-4 py-3 font-medium sm:table-cell">Type</th>
                  <th className="hidden px-4 py-3 font-medium md:table-cell">
                    Department
                  </th>
                  <th className="px-4 py-3 font-medium">Groups</th>
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {papers.map((paper) => (
                  <tr key={paper.id} className="hover:bg-muted/20">
                    <td className="px-4 py-3 font-medium text-foreground">
                      {paper.paperName}
                    </td>
                    <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                      {paper.paperType}
                    </td>
                    <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                      {paper.department.name}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-muted-foreground">
                      {paper._count.groups}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/admin/groups?paperId=${paper.id}`}>
                          Manage
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  const [paper, courses] = await Promise.all([
    prisma.paper.findUnique({
      where: { id: paperId },
      include: {
        groups: { include: { eligibilities: { include: { course: true } } } },
      },
    }),
    getAuthoritativeCourses(),
  ]);
  if (!paper) notFound();

  return (
    <div className="space-y-4">
      <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
        <Link href="/admin/groups">← All papers</Link>
      </Button>
      <AdminGroupsPanel paper={paper} groups={paper.groups} courses={courses} />
    </div>
  );
}
