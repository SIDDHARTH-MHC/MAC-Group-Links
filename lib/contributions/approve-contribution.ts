import { prisma } from "@/lib/db/prisma";
import { logAdminAction } from "@/lib/audit";
import { normalizeGroupLink } from "@/lib/constants";
import { duplicateGroupLinkMessage } from "@/lib/db/departments";
import { paperHasActiveGroupLink } from "@/lib/db/group-visibility";

export type ApproveContributionResult =
  | { ok: true; paperId: string }
  | { ok: false; error: string };

export async function executeApproveContribution(
  contributionId: string,
  options?: { auditDescription?: string },
): Promise<ApproveContributionResult> {
  const c = await prisma.groupContribution.findUnique({
    where: { id: contributionId },
    include: { eligibilities: true },
  });
  if (!c || c.status !== "PENDING") {
    return { ok: false, error: "Contribution not found or already processed" };
  }

  const normalized = c.normalizedGroupLink || normalizeGroupLink(c.groupLink);
  const dupMsg = await duplicateGroupLinkMessage(
    c.paperId,
    normalized,
    undefined,
    contributionId,
  );
  if (dupMsg) return { ok: false, error: dupMsg };

  if (await paperHasActiveGroupLink(c.paperId)) {
    return {
      ok: false,
      error:
        "This paper already has a group link. Edit or delete it in admin first.",
    };
  }

  const eligibilityRows =
    c.eligibilities.length > 0
      ? c.eligibilities
      : c.appliesToAll
        ? [
            {
              courseId: null,
              year: null,
              combination: null,
              notes: null,
              appliesToAll: true,
            },
          ]
        : [];

  const group = await prisma.$transaction(async (tx) => {
    const created = await tx.group.create({
      data: {
        paperId: c.paperId,
        sectionName: c.sectionName || "Group",
        teacherName: c.teacherName,
        actualClassRoom: c.actualClassRoom,
        days: c.days,
        startTime: c.startTime,
        endTime: c.endTime,
        groupPlatform: c.groupPlatform,
        groupLink: c.groupLink.trim(),
        normalizedGroupLink: normalized,
        contributorName: c.contributorName,
        contributorType: c.contributorType,
        contributionId: c.id,
        eligibilities: {
          create: eligibilityRows.map((e) => ({
            courseId: e.courseId,
            year: e.year,
            combination: e.combination,
            notes: e.notes,
            appliesToAll: e.appliesToAll,
          })),
        },
      },
    });
    await tx.groupContribution.update({
      where: { id: contributionId },
      data: { status: "APPROVED" },
    });
    return created;
  });

  await logAdminAction(
    "GROUP_APPROVED",
    options?.auditDescription ?? group.sectionName,
    "Group",
    group.id,
  );

  return { ok: true, paperId: c.paperId };
}
