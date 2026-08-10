import { prisma } from "@/lib/db/prisma";
import type { PaperType } from "@prisma/client";
import { getAdminSession } from "@/lib/auth/session";

export async function getAdminStats(semesterId: string) {
  const session = await getAdminSession();
  if (!session.isLoggedIn) {
    throw new Error("Unauthorized");
  }

  const papers = await prisma.paper.groupBy({
    by: ["paperType"],
    where: { semesterId, archivedAt: null },
    _count: true,
  });
  const totalPapers = papers.reduce((a, p) => a + p._count, 0);
  const paperIds = await prisma.paper.findMany({
    where: { semesterId },
    select: { id: true },
  });
  const ids = paperIds.map((p) => p.id);
  const groups = await prisma.group.findMany({
    where: { paperId: { in: ids } },
  });
  const withLinks = groups.filter((g) => g.groupLink).length;
  const pendingContributions = await prisma.groupContribution.count({
    where: { status: "PENDING", paper: { semesterId } },
  });
  const pendingSuggestions = await prisma.suggestion.count({
    where: { status: "PENDING" },
  });
  const pendingReports = await prisma.groupReport.count({
    where: { status: "PENDING" },
  });

  const byType = (type: PaperType) =>
    papers.find((p) => p.paperType === type)?._count ?? 0;

  return {
    totalPapers,
    sec: byType("SEC"),
    vac: byType("VAC"),
    ge: byType("GE"),
    dse: byType("DSE"),
    aec: byType("AEC"),
    core: byType("CORE"),
    totalGroups: groups.length,
    groupsWithLinks: withLinks,
    groupsWithoutLinks: groups.length - withLinks,
    pendingContributions,
    pendingSuggestions,
    pendingReports,
  };
}
