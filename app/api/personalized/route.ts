import { NextResponse } from "next/server";
import { getActiveSemester } from "@/lib/db/semester";
import { prisma } from "@/lib/db/prisma";
import { paperMatchesPrefs, matchesEligibility } from "@/lib/eligibility-match";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const courseId = searchParams.get("courseId");
  const yearRaw = searchParams.get("year");
  const combination = searchParams.get("combination");

  if (!courseId || !yearRaw) {
    return NextResponse.json({ papers: [] });
  }

  const year = Number(yearRaw);
  if (!Number.isFinite(year)) {
    return NextResponse.json({ papers: [] });
  }

  const semester = await getActiveSemester();
  if (!semester) {
    return NextResponse.json({ papers: [] });
  }

  const prefs = {
    courseId,
    year,
    combination: combination || null,
  };

  const papers = await prisma.paper.findMany({
    where: { semesterId: semester.id, archivedAt: null },
    include: {
      department: true,
      eligibilities: true,
      groups: {
        where: { status: "ACTIVE" },
        include: { eligibilities: { include: { course: true } } },
      },
    },
    orderBy: { paperName: "asc" },
    take: 80,
  });

  const relevant = papers
    .filter((p) => paperMatchesPrefs(p.eligibilities, prefs))
    .map((p) => ({
      id: p.id,
      paperName: p.paperName,
      paperType: p.paperType,
      departmentName: p.department.name,
      groupCount: p.groups.filter((g) =>
        g.eligibilities.length === 0
          ? true
          : g.eligibilities.some((e) =>
              matchesEligibility(
                e.appliesToAll,
                e.courseId,
                e.year,
                e.combination,
                prefs,
              ),
            ),
      ).length,
    }))
    .filter((p) => p.groupCount > 0)
    .slice(0, 24);

  return NextResponse.json({ papers: relevant });
}
