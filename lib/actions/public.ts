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
import { getAuthoritativeCourses } from "@/lib/courses/db-courses";
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

  const linkFields = groupLinkFields(data.groupLink);
  const dupMsg = await duplicateGroupLinkMessage(
    data.paperId,
    linkFields.normalizedGroupLink
  );
  if (dupMsg) {
    return { ok: false, error: dupMsg };
  }

  await prisma.groupContribution.create({
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
  revalidatePath(`/paper/${data.paperId}`);
  return {
    ok: true,
    message:
      "Your submission has been sent to the admin for review.",
  };
}

export async function submitSuggestion(input: unknown): Promise<ActionResult> {
  const parsed = suggestionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
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
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  await prisma.suggestion.create({
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

  return { ok: true, message: "Suggestion submitted successfully." };
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
