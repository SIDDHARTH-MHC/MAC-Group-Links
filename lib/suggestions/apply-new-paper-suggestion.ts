import { prisma } from "@/lib/db/prisma";
import { logAdminAction } from "@/lib/audit";
import { groupLinkFields, normalizeGroupLink } from "@/lib/constants";
import { findDepartmentByName, duplicateGroupLinkMessage } from "@/lib/db/departments";

export type ApplyNewPaperSuggestionResult =
  | { ok: true; paperId: string; groupId?: string }
  | { ok: false; error: string };

export async function executeApplyNewPaperSuggestion(
  suggestionId: string,
  options?: { auditDescription?: string },
): Promise<ApplyNewPaperSuggestionResult> {
  const s = await prisma.suggestion.findUnique({
    where: { id: suggestionId },
    include: { eligibilities: true },
  });
  if (!s || s.status !== "PENDING") {
    return { ok: false, error: "Suggestion not found or already processed" };
  }
  if (
    s.type !== "NEW_PAPER" ||
    !s.paperType ||
    !s.paperName ||
    !s.suggestedDepartmentName
  ) {
    return { ok: false, error: "Not a valid new-paper suggestion" };
  }

  const semester = await prisma.semester.findFirst({
    where: { status: "ACTIVE" },
  });
  if (!semester) return { ok: false, error: "No active semester" };

  let dept = await findDepartmentByName(s.suggestedDepartmentName);
  if (!dept) {
    dept = await prisma.department.create({
      data: {
        name: s.suggestedDepartmentName.trim(),
        departmentRoom: s.suggestedDepartmentRoom ?? undefined,
      },
    });
  }

  const hasGroupLink = Boolean(s.groupLink?.trim());
  let normalizedGroupLink: string | undefined;
  if (hasGroupLink) {
    normalizedGroupLink =
      s.normalizedGroupLink || normalizeGroupLink(s.groupLink!);
  }

  const eligibilityRows = s.eligibilities.map((e) => ({
    courseId: e.courseId,
    year: e.year,
    combination: e.combination,
    notes: e.notes,
    appliesToAll: e.appliesToAll,
  }));

  try {
    const result = await prisma.$transaction(async (tx) => {
      const paper = await tx.paper.create({
        data: {
          semesterId: semester.id,
          paperType: s.paperType!,
          paperName: s.paperName!,
          departmentId: dept!.id,
          sourceDocumentUrl: s.sourceDocumentUrl,
          eligibilities: {
            create: eligibilityRows,
          },
        },
      });

      let groupId: string | undefined;
      if (hasGroupLink && normalizedGroupLink) {
        const linkFields = groupLinkFields(s.groupLink!);
        const dupMsg = await duplicateGroupLinkMessage(
          paper.id,
          normalizedGroupLink,
        );
        if (dupMsg) {
          throw new Error(dupMsg);
        }

        const group = await tx.group.create({
          data: {
            paperId: paper.id,
            sectionName: "Group",
            groupPlatform: s.groupPlatform ?? "WHATSAPP",
            groupLink: linkFields.groupLink,
            normalizedGroupLink: linkFields.normalizedGroupLink,
            contributorName: s.contributorName,
            contributorType: s.contributorType,
            eligibilities: {
              create: eligibilityRows,
            },
          },
        });
        groupId = group.id;
      }

      await tx.suggestion.update({
        where: { id: suggestionId },
        data: { status: "APPROVED" },
      });

      return { paperId: paper.id, groupId };
    });

    await logAdminAction(
      "SUGGESTION_APPLIED",
      options?.auditDescription ?? s.description,
      "Suggestion",
      suggestionId,
    );

    if (result.groupId) {
      await logAdminAction(
        "GROUP_CREATED",
        `Group from new-paper suggestion: ${s.paperName}`,
        "Group",
        result.groupId,
      );
    }

    return { ok: true, paperId: result.paperId, groupId: result.groupId };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to apply suggestion";
    return { ok: false, error: message };
  }
}
