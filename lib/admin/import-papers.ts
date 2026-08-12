import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { findDepartmentByName } from "@/lib/db/departments";
import { paperImportSchema } from "@/lib/validations";
import type { z } from "zod";
import {
  BA_PROGRAMME_COURSE_NAME,
  MAC_COURSES,
  resolveMacCourseName,
} from "@/lib/courses/mac";

export type ImportRow = z.infer<typeof paperImportSchema>[number];

export function paperImportCreateData(
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

export async function validateImportRows(
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

export type ImportCatalogueResult = {
  imported: number;
  skipped: number;
  errors: string[];
};

export async function importCatalogueRows(
  semesterId: string,
  rows: ImportRow[],
  options?: { skipExisting?: boolean },
): Promise<ImportCatalogueResult> {
  const skipExisting = options?.skipExisting ?? false;
  const coursesByName = await loadCoursesByName();

  if (!skipExisting) {
    const errors = await validateImportRows(semesterId, rows, coursesByName);
    if (errors.length > 0) {
      return { imported: 0, skipped: 0, errors };
    }
  }

  const departments = await prisma.department.findMany({
    where: { active: true },
    select: { id: true, name: true },
  });
  const deptByName = new Map(
    departments.map((d) => [d.name.trim().toLowerCase(), d.id]),
  );

  const existingPapers = await prisma.paper.findMany({
    where: { semesterId },
    select: { paperType: true, paperName: true, departmentId: true },
  });
  const existingKeys = new Set(
    existingPapers.map(
      (p) =>
        `${p.paperType}|${p.paperName.trim().toLowerCase()}|${p.departmentId}`,
    ),
  );

  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];

  const createRow = async (
    p: ImportRow,
    db: Pick<typeof prisma, "paper"> = prisma,
  ) => {
    const rowLabel = `${p.paperType} — ${p.paperName}`;
    const deptId = deptByName.get(p.department.trim().toLowerCase());
    if (!deptId) {
      errors.push(`${rowLabel}: Unknown department "${p.department}"`);
      return;
    }

    const key = `${p.paperType}|${p.paperName.trim().toLowerCase()}|${deptId}`;
    if (existingKeys.has(key)) {
      skipped += 1;
      return;
    }

    const { eligibilities, error: eligError } = mapImportEligibilities(
      p.eligibilities,
      coursesByName,
    );
    if (eligError) {
      errors.push(`${rowLabel}: ${eligError}`);
      return;
    }

    await db.paper.create({
      data: paperImportCreateData(semesterId, p, deptId, eligibilities),
    });
    existingKeys.add(key);
    imported += 1;
  };

  if (skipExisting) {
    for (const p of rows) {
      await createRow(p);
    }
  } else {
    await prisma.$transaction(
      async (tx) => {
        for (const p of rows) {
          await createRow(p, tx);
        }
      },
      { maxWait: 60_000, timeout: 120_000 },
    );
  }

  return { imported, skipped, errors };
}

export function mapImportEligibilities(
  rows: ImportRow["eligibilities"],
  coursesByName: Map<string, string>,
): {
  eligibilities: Prisma.PaperEligibilityUncheckedCreateWithoutPaperInput[];
  error?: string;
} {
  const created: Prisma.PaperEligibilityUncheckedCreateWithoutPaperInput[] = [];
  for (const row of rows) {
    if (row.appliesToAll) {
      created.push({ appliesToAll: true });
      continue;
    }
    const courseId = row.course
      ? resolveCourseIdForImport(row.course, coursesByName)
      : undefined;
    if (row.course && !courseId) {
      return { eligibilities: [], error: `Unknown course: ${row.course}` };
    }
    created.push({
      courseId: courseId ?? null,
      year: row.year ?? null,
      combination: row.combination ?? null,
      notes: row.notes ?? null,
      appliesToAll: false,
    });
  }
  if (created.length === 0) {
    created.push({ appliesToAll: true });
  }
  return { eligibilities: created };
}

export async function loadCoursesByName() {
  const courses = await prisma.course.findMany({ where: { active: true } });
  const map = new Map<string, string>();
  for (const c of courses) {
    map.set(c.name.trim().toLowerCase(), c.id);
    map.set(c.shortName.trim().toLowerCase(), c.id);
  }
  for (const c of MAC_COURSES) {
    const id = map.get(c.name.toLowerCase());
    if (id) {
      map.set(c.shortName.toLowerCase(), id);
    }
  }
  for (const [alias, canonical] of Object.entries({
    "ba programme": BA_PROGRAMME_COURSE_NAME,
    "b.a. programme": BA_PROGRAMME_COURSE_NAME,
  })) {
    const id = map.get(canonical.toLowerCase());
    if (id) map.set(alias, id);
  }
  return map;
}

export function resolveCourseIdForImport(
  courseRaw: string,
  coursesByName: Map<string, string>,
): string | undefined {
  const canonical = resolveMacCourseName(courseRaw);
  if (canonical) {
    return coursesByName.get(canonical.toLowerCase());
  }
  return coursesByName.get(courseRaw.trim().toLowerCase());
}
