import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { paperImportSchema } from "@/lib/validations";
import type { z } from "zod";
import {
  BA_PROGRAMME_COURSE_NAME,
  MAC_COURSES,
  resolveMacCourseName,
} from "@/lib/courses/mac";

type ImportRow = z.infer<typeof paperImportSchema>[number];

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
