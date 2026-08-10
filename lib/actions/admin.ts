"use server";

import { prisma } from "@/lib/db/prisma";
import { getAdminSession, validateAdminCredentials } from "@/lib/auth/session";
import { logAdminAction } from "@/lib/audit";
import {
  groupFormSchema,
  paperFormSchema,
  paperImportSchema,
  officialCatalogueImportSchema,
  semesterFormSchema,
  adminLoginSchema,
} from "@/lib/validations";
import { normalizeGroupLink, groupLinkFields } from "@/lib/constants";
import { findDepartmentByName, duplicateGroupLinkMessage } from "@/lib/db/departments";
import { loadCoursesByName, mapImportEligibilities } from "@/lib/admin/import-papers";
import { previewOfficialCatalogue } from "@/lib/catalogue/official";
import type { z } from "zod";
import type { paperImportRowSchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type ActionResult =
  | { ok: true; message?: string; id?: string }
  | { ok: false; error: string };

export async function adminLogin(input: unknown) {
  const parsed = adminLoginSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: "Invalid credentials" };
  }
  if (!validateAdminCredentials(parsed.data.username, parsed.data.password)) {
    return { ok: false as const, error: "Invalid username or password" };
  }
  const session = await getAdminSession();
  session.isLoggedIn = true;
  session.username = parsed.data.username;
  await session.save();
  await logAdminAction("LOGIN", `Admin login: ${parsed.data.username}`);
  redirect("/admin");
}

export async function adminLogout() {
  const session = await getAdminSession();
  await logAdminAction("LOGOUT", "Admin logout");
  session.destroy();
  redirect("/admin/login");
}

async function requireAdminSession() {
  const session = await getAdminSession();
  if (!session.isLoggedIn) throw new Error("Unauthorized");
  return session;
}

function mapEligibilityCreate(
  eligibilities: {
    courseId?: string;
    year?: number;
    combination?: string | null;
    notes?: string;
    appliesToAll?: boolean;
  }[]
) {
  return eligibilities.map((e) => ({
    courseId: e.courseId || null,
    year: e.year ?? null,
    combination: e.combination ?? undefined,
    notes: e.notes,
    appliesToAll: e.appliesToAll ?? false,
  }));
}

export async function createSemester(input: unknown): Promise<ActionResult> {
  await requireAdminSession();
  const parsed = semesterFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid" };
  }
  const { academicYear, semesterNumber } = parsed.data;

  const existing = await prisma.semester.findUnique({
    where: {
      academicYear_semesterNumber: { academicYear, semesterNumber },
    },
  });
  if (existing) {
    return { ok: false, error: "This semester already exists." };
  }

  let newId = "";
  await prisma.$transaction(async (tx) => {
    await tx.semester.updateMany({
      where: { status: "ACTIVE" },
      data: { status: "ARCHIVED" },
    });
    const sem = await tx.semester.create({
      data: {
        academicYear,
        semesterNumber,
        status: "ACTIVE",
      },
    });
    newId = sem.id;
  });

  await logAdminAction(
    "SEMESTER_CREATED",
    `Created empty semester ${academicYear} sem ${semesterNumber}`,
    "Semester",
    newId
  );
  revalidatePath("/admin");
  revalidatePath("/admin/papers");
  revalidatePath("/");
  return { ok: true, message: "Semester created successfully.", id: newId };
}

export async function setActiveSemester(semesterId: string): Promise<ActionResult> {
  await requireAdminSession();
  await prisma.$transaction(async (tx) => {
    await tx.semester.updateMany({
      where: { status: "ACTIVE" },
      data: { status: "ARCHIVED" },
    });
    await tx.semester.update({
      where: { id: semesterId },
      data: { status: "ACTIVE" },
    });
  });
  await logAdminAction("SEMESTER_ACTIVATED", "Set active semester", "Semester", semesterId);
  revalidatePath("/");
  revalidatePath("/admin");
  return { ok: true };
}

export async function createPaper(input: unknown): Promise<ActionResult> {
  await requireAdminSession();
  const parsed = paperFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid" };
  }
  const d = parsed.data;
  const paper = await prisma.paper.create({
    data: {
      semesterId: d.semesterId,
      paperType: d.paperType,
      paperName: d.paperName.trim(),
      paperCode: d.paperCode,
      departmentId: d.departmentId,
      description: d.description,
      sourceDocumentUrl: d.sourceDocumentUrl || undefined,
      eligibilityNotes: d.eligibilityNotes,
      eligibilities: { create: mapEligibilityCreate(d.eligibilities) },
    },
  });
  await logAdminAction("PAPER_CREATED", paper.paperName, "Paper", paper.id);
  revalidatePath("/admin/papers");
  return { ok: true, id: paper.id };
}

export async function updatePaper(
  paperId: string,
  input: unknown
): Promise<ActionResult> {
  await requireAdminSession();
  const parsed = paperFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid" };
  }
  const d = parsed.data;
  await prisma.$transaction(async (tx) => {
    await tx.paperEligibility.deleteMany({ where: { paperId } });
    await tx.paper.update({
      where: { id: paperId },
      data: {
        paperType: d.paperType,
        paperName: d.paperName.trim(),
        paperCode: d.paperCode,
        departmentId: d.departmentId,
        description: d.description,
        sourceDocumentUrl: d.sourceDocumentUrl || undefined,
        eligibilityNotes: d.eligibilityNotes,
        eligibilities: { create: mapEligibilityCreate(d.eligibilities) },
      },
    });
  });
  await logAdminAction("PAPER_UPDATED", d.paperName, "Paper", paperId);
  revalidatePath("/admin/papers");
  revalidatePath(`/paper/${paperId}`);
  return { ok: true };
}

export async function deletePaper(paperId: string): Promise<ActionResult> {
  await requireAdminSession();
  const paper = await prisma.paper.findUnique({ where: { id: paperId } });
  if (!paper) return { ok: false, error: "Not found" };
  await prisma.paper.delete({ where: { id: paperId } });
  await logAdminAction("PAPER_DELETED", paper.paperName, "Paper", paperId);
  revalidatePath("/admin/papers");
  return { ok: true };
}

type ImportRow = z.infer<typeof paperImportRowSchema>;

function paperImportCreateData(
  semesterId: string,
  p: ImportRow,
  departmentId: string,
  eligibilities: ReturnType<typeof mapImportEligibilities>["eligibilities"],
) {
  return {
    semesterId,
    paperType: p.paperType,
    paperName: p.paperName.trim(),
    paperCode: p.paperCode,
    departmentId,
    dseNumber: p.dseNumber ?? undefined,
    seatCapacity: p.seatCapacity ?? undefined,
    prerequisite: p.prerequisite ?? undefined,
    sourceDocument: p.sourceDocument ?? undefined,
    sourcePage: p.sourcePage ?? undefined,
    sourceText: p.sourceText ?? undefined,
    sourceDocumentUrl: p.sourceDocumentUrl,
    eligibilityNotes: p.eligibilityNotes ?? undefined,
    eligibilities: { create: eligibilities },
  };
}

async function validateImportRows(
  semesterId: string,
  rows: ImportRow[],
  coursesByName: Map<string, string>,
) {
  const errors: string[] = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowLabel = `Row ${i + 1} (${row.paperName})`;
    const dept = await findDepartmentByName(row.department);
    if (!dept) {
      errors.push(`${rowLabel}: Unknown department "${row.department}"`);
      continue;
    }
    const { error: eligError } = mapImportEligibilities(
      row.eligibilities,
      coursesByName,
    );
    if (eligError) errors.push(`${rowLabel}: ${eligError}`);
    const dup = await prisma.paper.findFirst({
      where: {
        semesterId,
        paperType: row.paperType,
        paperName: row.paperName.trim(),
        departmentId: dept.id,
      },
    });
    if (dup) errors.push(`${rowLabel}: Paper already exists in this semester`);
  }
  return errors;
}

export async function getOfficialCataloguePreview(semesterNumber?: number) {
  await requireAdminSession();
  return previewOfficialCatalogue(semesterNumber);
}

export async function importOfficialCatalogue(
  semesterId: string,
  catalogueSemesterNumber: number,
  options?: { includeNeedsReview?: boolean },
): Promise<ActionResult> {
  await requireAdminSession();
  const includeNeedsReview = options?.includeNeedsReview ?? false;
  const preview = previewOfficialCatalogue(catalogueSemesterNumber);
  const rows = preview.rows.filter(
    (r) => includeNeedsReview || !r.needsReview,
  );
  if (rows.length === 0) {
    return { ok: false, error: "No importable rows for this semester." };
  }

  const coursesByName = await loadCoursesByName();
  const errors = await validateImportRows(semesterId, rows, coursesByName);
  if (errors.length > 0) {
    return {
      ok: false,
      error: `Import failed:\n${errors.slice(0, 12).join("\n")}`,
    };
  }

  await prisma.$transaction(async (tx) => {
    for (const p of rows) {
      const dept = await tx.department.findFirst({
        where: { name: { equals: p.department.trim(), mode: "insensitive" } },
      });
      if (!dept) throw new Error("Department missing during import");
      const { eligibilities } = mapImportEligibilities(
        p.eligibilities,
        coursesByName,
      );
      await tx.paper.create({
        data: paperImportCreateData(semesterId, p, dept.id, eligibilities),
      });
    }
  });

  await logAdminAction(
    "PAPER_IMPORTED",
    `Imported ${rows.length} official catalogue papers (sem ${catalogueSemesterNumber})`,
    "Semester",
    semesterId,
  );
  revalidatePath("/admin/papers");
  return {
    ok: true,
    message: `Imported ${rows.length} papers from official catalogue (semester ${catalogueSemesterNumber}).`,
  };
}

export async function importPapers(
  semesterId: string,
  jsonText: string
): Promise<ActionResult> {
  await requireAdminSession();
  let raw: unknown;
  try {
    raw = JSON.parse(jsonText);
  } catch {
    return { ok: false, error: "Invalid JSON" };
  }
  const parsed = paperImportSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .slice(0, 8)
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("\n");
    return { ok: false, error: issues || "Invalid import data" };
  }

  const coursesByName = await loadCoursesByName();
  const errors = await validateImportRows(
    semesterId,
    parsed.data,
    coursesByName,
  );

  if (errors.length > 0) {
    return {
      ok: false,
      error: `Import failed — fix the following and try again:\n${errors.join("\n")}`,
    };
  }

  await prisma.$transaction(async (tx) => {
    for (const p of parsed.data) {
      const dept = await tx.department.findFirst({
        where: {
          name: { equals: p.department.trim(), mode: "insensitive" },
        },
      });
      if (!dept) throw new Error("Department missing during import");
      const { eligibilities } = mapImportEligibilities(
        p.eligibilities,
        coursesByName
      );
      await tx.paper.create({
        data: paperImportCreateData(semesterId, p, dept.id, eligibilities),
      });
    }
  });

  await logAdminAction(
    "PAPER_IMPORTED",
    `Imported ${parsed.data.length} papers`,
    "Semester",
    semesterId
  );
  revalidatePath("/admin/papers");
  return { ok: true, message: `Imported ${parsed.data.length} papers.` };
}

export async function createGroup(input: unknown): Promise<ActionResult> {
  await requireAdminSession();
  const parsed = groupFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid" };
  }
  const d = parsed.data;
  const linkFields = d.groupLink ? groupLinkFields(d.groupLink) : null;
  if (linkFields) {
    const dupMsg = await duplicateGroupLinkMessage(
      d.paperId,
      linkFields.normalizedGroupLink
    );
    if (dupMsg) return { ok: false, error: dupMsg };
  }

  const group = await prisma.group.create({
    data: {
      paperId: d.paperId,
      sectionName: d.sectionName,
      teacherName: d.teacherName,
      actualClassRoom: d.actualClassRoom,
      days: d.days,
      startTime: d.startTime,
      endTime: d.endTime,
      groupPlatform: d.groupPlatform,
      groupLink: linkFields?.groupLink ?? null,
      normalizedGroupLink: linkFields?.normalizedGroupLink ?? null,
      contributorName: d.contributorName,
      contributorType: d.contributorType,
      eligibilities: { create: mapEligibilityCreate(d.eligibilities) },
    },
  });
  await logAdminAction("GROUP_CREATED", group.sectionName, "Group", group.id);
  revalidatePath(`/paper/${d.paperId}`);
  return { ok: true, id: group.id };
}

export async function updateGroup(
  groupId: string,
  input: unknown
): Promise<ActionResult> {
  await requireAdminSession();
  const parsed = groupFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid" };
  }
  const d = parsed.data;
  const linkFields = d.groupLink ? groupLinkFields(d.groupLink) : null;
  if (linkFields) {
    const dupMsg = await duplicateGroupLinkMessage(
      d.paperId,
      linkFields.normalizedGroupLink,
      groupId
    );
    if (dupMsg) return { ok: false, error: dupMsg };
  }

  await prisma.$transaction(async (tx) => {
    await tx.groupEligibility.deleteMany({ where: { groupId } });
    await tx.group.update({
      where: { id: groupId },
      data: {
        sectionName: d.sectionName,
        teacherName: d.teacherName,
        actualClassRoom: d.actualClassRoom,
        days: d.days,
        startTime: d.startTime,
        endTime: d.endTime,
        groupPlatform: d.groupPlatform,
        groupLink: linkFields?.groupLink ?? null,
        normalizedGroupLink: linkFields?.normalizedGroupLink ?? null,
        contributorName: d.contributorName,
        contributorType: d.contributorType,
        eligibilities: { create: mapEligibilityCreate(d.eligibilities) },
      },
    });
  });
  await logAdminAction("GROUP_UPDATED", d.sectionName, "Group", groupId);
  revalidatePath(`/paper/${d.paperId}`);
  return { ok: true };
}

export async function deleteGroup(groupId: string): Promise<ActionResult> {
  await requireAdminSession();
  const g = await prisma.group.findUnique({ where: { id: groupId } });
  if (!g) return { ok: false, error: "Not found" };
  await prisma.group.delete({ where: { id: groupId } });
  await logAdminAction("GROUP_DELETED", g.sectionName, "Group", groupId);
  revalidatePath(`/paper/${g.paperId}`);
  return { ok: true };
}

export async function markGroupExpired(
  groupId: string,
  expired: boolean
): Promise<ActionResult> {
  await requireAdminSession();
  await prisma.group.update({
    where: { id: groupId },
    data: { status: expired ? "EXPIRED" : "ACTIVE" },
  });
  revalidatePath("/admin/groups");
  return { ok: true };
}

export async function verifyGroupLink(groupId: string): Promise<ActionResult> {
  await requireAdminSession();
  await prisma.group.update({
    where: { id: groupId },
    data: { linkVerifiedAt: new Date() },
  });
  return { ok: true };
}

export async function approveContribution(
  contributionId: string
): Promise<ActionResult> {
  await requireAdminSession();
  const c = await prisma.groupContribution.findUnique({
    where: { id: contributionId },
    include: { eligibilities: true },
  });
  if (!c || c.status !== "PENDING") {
    return { ok: false, error: "Contribution not found or already processed" };
  }

  const normalized = c.normalizedGroupLink || normalizeGroupLink(c.groupLink);
  const dupMsg = await duplicateGroupLinkMessage(c.paperId, normalized);
  if (dupMsg) return { ok: false, error: dupMsg };

  await prisma.$transaction(async (tx) => {
    const group = await tx.group.create({
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
          create: c.eligibilities.map((e) => ({
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
    await logAdminAction("GROUP_APPROVED", group.sectionName, "Group", group.id);
  });

  revalidatePath("/admin/contributions");
  revalidatePath(`/paper/${c.paperId}`);
  revalidatePath("/");
  return { ok: true };
}

export async function rejectContribution(
  contributionId: string,
  notes?: string
): Promise<ActionResult> {
  await requireAdminSession();
  await prisma.groupContribution.update({
    where: { id: contributionId },
    data: { status: "REJECTED", adminNotes: notes },
  });
  await logAdminAction("GROUP_REJECTED", "Rejected contribution", "GroupContribution", contributionId);
  revalidatePath("/admin/contributions");
  return { ok: true };
}

export async function applySuggestion(suggestionId: string): Promise<ActionResult> {
  await requireAdminSession();
  const s = await prisma.suggestion.findUnique({
    where: { id: suggestionId },
    include: { eligibilities: true, paper: true, group: true },
  });
  if (!s || s.status !== "PENDING") {
    return { ok: false, error: "Suggestion not found" };
  }

  if (
    s.type === "NEW_PAPER" &&
    s.paperType &&
    s.paperName &&
    s.suggestedDepartmentName
  ) {
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
    await prisma.paper.create({
      data: {
        semesterId: semester.id,
        paperType: s.paperType,
        paperName: s.paperName,
        departmentId: dept.id,
        sourceDocumentUrl: s.sourceDocumentUrl,
        eligibilities: {
          create: s.eligibilities.map((e) => ({
            courseId: e.courseId,
            year: e.year,
            combination: e.combination,
            notes: e.notes,
            appliesToAll: e.appliesToAll,
          })),
        },
      },
    });
  } else if (s.groupId && s.suggestedValue) {
    if (s.type === "WRONG_GROUP_LINK") {
      const paperId = s.paperId ?? s.group?.paperId;
      if (!paperId) return { ok: false, error: "Missing paper for group link update" };
      const fields = groupLinkFields(s.suggestedValue);
      const dupMsg = await duplicateGroupLinkMessage(
        paperId,
        fields.normalizedGroupLink,
        s.groupId
      );
      if (dupMsg) return { ok: false, error: dupMsg };
      await prisma.group.update({
        where: { id: s.groupId },
        data: {
          groupLink: fields.groupLink,
          normalizedGroupLink: fields.normalizedGroupLink,
        },
      });
    } else if (s.type === "WRONG_TEACHER") {
      await prisma.group.update({
        where: { id: s.groupId },
        data: { teacherName: s.suggestedValue },
      });
    } else if (s.type === "WRONG_CLASSROOM") {
      await prisma.group.update({
        where: { id: s.groupId },
        data: { actualClassRoom: s.suggestedValue },
      });
    } else if (s.type === "WRONG_SECTION") {
      await prisma.group.update({
        where: { id: s.groupId },
        data: { sectionName: s.suggestedValue },
      });
    }
  } else if (s.paperId && s.suggestedValue) {
    if (s.type === "PAPER_NAME_WRONG") {
      await prisma.paper.update({
        where: { id: s.paperId },
        data: { paperName: s.suggestedValue },
      });
    } else if (s.type === "WRONG_DEPARTMENT") {
      const dept = await findDepartmentByName(s.suggestedValue);
      if (!dept) {
        return { ok: false, error: `Unknown department: ${s.suggestedValue}` };
      }
      await prisma.paper.update({
        where: { id: s.paperId },
        data: { departmentId: dept.id },
      });
    }
  }

  await prisma.suggestion.update({
    where: { id: suggestionId },
    data: { status: "APPROVED" },
  });
  await logAdminAction("SUGGESTION_APPLIED", s.description, "Suggestion", suggestionId);
  revalidatePath("/admin/suggestions");
  return { ok: true };
}

export async function rejectSuggestion(
  suggestionId: string,
  notes?: string
): Promise<ActionResult> {
  await requireAdminSession();
  await prisma.suggestion.update({
    where: { id: suggestionId },
    data: { status: "REJECTED", adminNotes: notes },
  });
  await logAdminAction("SUGGESTION_REJECTED", "Rejected suggestion", "Suggestion", suggestionId);
  revalidatePath("/admin/suggestions");
  return { ok: true };
}

export async function handleReport(
  reportId: string,
  action: "ignore" | "resolve" | "expire"
): Promise<ActionResult> {
  await requireAdminSession();
  const report = await prisma.groupReport.findUnique({
    where: { id: reportId },
    include: { group: true },
  });
  if (!report) return { ok: false, error: "Not found" };

  if (action === "ignore") {
    await prisma.groupReport.update({
      where: { id: reportId },
      data: { status: "IGNORED" },
    });
  } else if (action === "resolve") {
    await prisma.groupReport.update({
      where: { id: reportId },
      data: { status: "RESOLVED" },
    });
  } else if (action === "expire") {
    await prisma.group.update({
      where: { id: report.groupId },
      data: { status: "EXPIRED" },
    });
    await prisma.groupReport.update({
      where: { id: reportId },
      data: { status: "RESOLVED" },
    });
  }

  await logAdminAction("REPORT_HANDLED", `Report ${action}`, "GroupReport", reportId);
  revalidatePath("/admin/reports");
  return { ok: true };
}
