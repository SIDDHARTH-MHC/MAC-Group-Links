import type { Course } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { MAC_COURSES, MAC_COURSE_NAMES } from "@/lib/constants/courses";

/** Resolve authoritative MAC courses to DB rows (ordered, no legacy extras). */
export async function getAuthoritativeCourses(): Promise<Course[]> {
  const rows = await prisma.course.findMany({
    where: { name: { in: [...MAC_COURSE_NAMES] } },
  });
  const byName = new Map(rows.map((r) => [r.name, r]));
  const ordered: Course[] = [];
  for (const mac of MAC_COURSES) {
    const row = byName.get(mac.name);
    if (row) ordered.push(row);
  }
  return ordered;
}
