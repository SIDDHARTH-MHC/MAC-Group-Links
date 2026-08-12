"use server";

import { prisma } from "@/lib/db/prisma";
import { getActiveSemester } from "@/lib/db/semester";
import {
  groupContributionSchema,
  groupReportSchema,
  newPaperSuggestionSchema,
  suggestionSchema,
} from "@/lib/validations";
import { groupLinkFields } from "@/lib/constants";
import { duplicateGroupLinkMessage } from "@/lib/db/departments";
import {
  paperHasActiveGroupLink,
  paperHasPendingContribution,
} from "@/lib/db/group-visibility";
import { getAuthoritativeCourses } from "@/lib/courses/db-courses";
import { executeApproveContribution } from "@/lib/contributions/approve-contribution";
import { executeApplyNewPaperSuggestion } from "@/lib/suggestions/apply-new-paper-suggestion";
import { getAutoApproveContributions } from "@/lib/settings/site";
import { revalidatePath } from "next/cache";
import { SuggestionType } from "@prisma/client";

export type ActionResult = { ok: true; message: string } | { ok: false; error: string };

async function assertPaperInActiveSemester(paperId: string) {
  const semester = await getActiveSemester();
  if (!semester) throw new Error("No active semester");
  const paper = await prisma.paper.findFirst({
    where: {
      id: paperId,
      semesterId: semester.id,
      archivedAt: null,
    },
  });
  if (!paper) throw new Error("Paper not found");
  return paper;
}

export async function submitGroupContribution(
  input: unknown
): Promise<ActionResult> {
  const parsed = groupContributionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;
  await assertPaperInActiveSemester(data.paperId);

  if (await paperHasActiveGroupLink(data.paperId)) {
    return {
      ok: false,
      error:
        "This paper already has a group link. Ask admin to update or remove it first.",
    };
  }
  if (await paperHasPendingContribution(data.paperId)) {
    return {
      ok: false,
      error:
        "A group link for this paper is already waiting for admin review.",
    };
  }

  const linkFields = groupLinkFields(data.groupLink);
  const dupMsg = await duplicateGroupLinkMessage(
    data.paperId,
    linkFields.normalizedGroupLink
  );
  if (dupMsg) {
    return { ok: false, error: dupMsg };
  }

  const contribution = await prisma.groupContribution.create({
    data: {
      paperId: data.paperId,
      sectionName: data.sectionName || "Group",
      teacherName: data.teacherName,
      actualClassRoom: data.actualClassRoom,
      days: data.days,
      startTime: data.startTime,
      endTime: data.endTime,
      groupPlatform: data.groupPlatform,
      groupLink: linkFields.groupLink,
      normalizedGroupLink: linkFields.normalizedGroupLink,
      contributorName: data.contributorName,
      contributorType: data.contributorType,
      appliesToAll: data.appliesToAll,
      eligibilities: {
        create: data.eligibilities.map((e) => ({
          courseId: e.courseId || null,
          year: e.year ?? null,
          combination: e.combination,
          notes: e.notes,
          appliesToAll: e.appliesToAll ?? false,
        })),
      },
    },
  });

  revalidatePath("/");
  revalidatePath("/contribute/add");
  revalidatePath("/papers");
  revalidatePath("/search");
  revalidatePath(`/paper/${data.paperId}`);

  if (await getAutoApproveContributions()) {
    const approved = await executeApproveContribution(contribution.id, {
      auditDescription: `Auto-approved on submit: ${contribution.sectionName || "Group"}`,
    });
    if (approved.ok) {
      revalidatePath("/admin/contributions");
      return {
        ok: true,
        message: "Your group link is live on the site.",
      };
    }
  }

  return {
    ok: true,
    message:
      "Your submission has been sent to the admin for review.",
  };
}

export async function submitSuggestion(input: unknown): Promise<ActionResult> {
  const parsed = suggestionSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return {
      ok: false,
      error: issue?.message ?? "Please check the form and try again.",
    };
  }
  const data = parsed.data;
  if (data.paperId) await assertPaperInActiveSemester(data.paperId);

  await prisma.suggestion.create({
    data: {
      type: data.type,
      description: data.description,
      suggestedValue: data.suggestedValue,
      paperId: data.paperId,
      groupId: data.groupId,
      contributorName: data.contributorName,
      contributorType: data.contributorType,
    },
  });

  revalidatePath("/admin/suggestions");
  return {
    ok: true,
    message: "Thanks! Your suggestion has been sent to the MAC Group Links admin.",
  };
}

export async function submitNewPaperSuggestion(
  input: unknown
): Promise<ActionResult> {
  const parsed = newPaperSuggestionSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return {
      ok: false,
      error: issue?.message ?? "Please check the form and try again.",
    };
  }
  const data = parsed.data;

  const linkFields = data.groupLink?.trim()
    ? groupLinkFields(data.groupLink)
    : null;

  const suggestion = await prisma.suggestion.create({
    data: {
      type: SuggestionType.NEW_PAPER,
      description: data.notes || `New paper: ${data.paperName}`,
      paperType: data.paperType,
      paperName: data.paperName,
      suggestedDepartmentName: data.suggestedDepartmentName,
      suggestedDepartmentRoom: data.suggestedDepartmentRoom,
      sourceDocumentUrl: data.sourceDocumentUrl || undefined,
      contributorName: data.contributorName,
      contributorType: data.contributorType,
      groupPlatform: linkFields ? (data.groupPlatform ?? "WHATSAPP") : undefined,
      groupLink: linkFields?.groupLink,
      normalizedGroupLink: linkFields?.normalizedGroupLink,
      eligibilities: {
        create: data.eligibilities.map((e) => ({
          courseId: e.courseId || null,
          year: e.year ?? null,
          combination: e.combination,
          notes: e.notes,
          appliesToAll: e.appliesToAll ?? false,
        })),
      },
    },
  });

  revalidatePath("/admin/suggestions");

  if (await getAutoApproveContributions()) {
    const applied = await executeApplyNewPaperSuggestion(suggestion.id, {
      auditDescription: `Auto-approved on submit: ${data.paperName}`,
    });
    if (applied.ok) {
      revalidatePath("/");
      revalidatePath("/contribute/add");
      revalidatePath("/papers");
      revalidatePath("/search");
      revalidatePath(`/paper/${applied.paperId}`);
      return {
        ok: true,
        message: linkFields
          ? "Your paper and group link are live on the site."
          : "Your paper is live on the site.",
      };
    }
  }

  return {
    ok: true,
    message: "Thanks! Your suggestion has been sent to the MAC Group Links admin for review.",
  };
}

export async function submitGroupReport(input: unknown): Promise<ActionResult> {
  const parsed = groupReportSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;
  const group = await prisma.group.findUnique({
    where: { id: data.groupId },
    include: { paper: true },
  });
  if (!group) return { ok: false, error: "Group not found" };

  await prisma.groupReport.create({
    data: {
      groupId: data.groupId,
      paperId: group.paperId,
      reason: data.reason,
      description: data.description,
      reporterName: data.reporterName,
    },
  });

  revalidatePath("/admin/reports");
  return { ok: true, message: "Report submitted. Thank you." };
}

/** DB course rows for the authoritative MAC list only (dropdowns). */
export async function getCourses() {
  return getAuthoritativeCourses();
}
