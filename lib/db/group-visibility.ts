import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

/** Active group row that counts as a published class link. */
export const activeGroupWithLinkWhere = {
  status: "ACTIVE" as const,
  groupLink: { not: null },
} satisfies Prisma.GroupWhereInput;

/** Papers visible on public browse/search (at least one published link). */
export const publicPaperCatalogueWhere = {
  groups: { some: activeGroupWithLinkWhere },
} satisfies Prisma.PaperWhereInput;

/** Papers students may still submit a new group link for. */
export const paperOpenForContributionWhere = {
  groups: { none: activeGroupWithLinkWhere },
} satisfies Prisma.PaperWhereInput;

export async function paperHasActiveGroupLink(
  paperId: string,
): Promise<boolean> {
  const count = await prisma.group.count({
    where: { paperId, ...activeGroupWithLinkWhere },
  });
  return count > 0;
}

export async function paperHasPendingContribution(
  paperId: string,
): Promise<boolean> {
  const count = await prisma.groupContribution.count({
    where: { paperId, status: "PENDING" },
  });
  return count > 0;
}
