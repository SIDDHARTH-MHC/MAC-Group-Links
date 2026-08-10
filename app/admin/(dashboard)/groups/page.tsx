import { notFound } from "next/navigation";
import { AdminGroupsPanel } from "@/components/admin/groups-panel";
import { prisma } from "@/lib/db/prisma";
import { getAuthoritativeCourses } from "@/lib/courses/db-courses";

export const dynamic = "force-dynamic";

export default async function AdminGroupsPage({
  searchParams,
}: {
  searchParams: Promise<{ paperId?: string }>;
}) {
  const { paperId } = await searchParams;
  if (!paperId) notFound();

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

  return <AdminGroupsPanel paper={paper} groups={paper.groups} courses={courses} />;
}
