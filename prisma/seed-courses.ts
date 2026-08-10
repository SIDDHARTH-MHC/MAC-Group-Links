import { prisma } from "@/lib/db/prisma";
import { readFileSync } from "fs";
import { join } from "path";
import {
  LEGACY_COURSE_NAME_ALIASES,
  MAC_COURSE_NAMES,
} from "@/lib/constants/courses";

type CourseSeed = { name: string; shortName: string };

async function reassignCourseReferences(fromId: string, toId: string) {
  if (fromId === toId) return;
  await prisma.paperEligibility.updateMany({
    where: { courseId: fromId },
    data: { courseId: toId },
  });
  await prisma.groupEligibility.updateMany({
    where: { courseId: fromId },
    data: { courseId: toId },
  });
  await prisma.groupContributionEligibility.updateMany({
    where: { courseId: fromId },
    data: { courseId: toId },
  });
  await prisma.suggestionEligibility.updateMany({
    where: { courseId: fromId },
    data: { courseId: toId },
  });
}

async function eligibilityCountForCourse(courseId: string) {
  const [a, b, c, d] = await Promise.all([
    prisma.paperEligibility.count({ where: { courseId } }),
    prisma.groupEligibility.count({ where: { courseId } }),
    prisma.groupContributionEligibility.count({ where: { courseId } }),
    prisma.suggestionEligibility.count({ where: { courseId } }),
  ]);
  return a + b + c + d;
}

/** Upsert MAC course master list without wiping papers. */
async function main() {
  const courseSeed = JSON.parse(
    readFileSync(join(process.cwd(), "prisma/data/courses.json"), "utf-8"),
  ) as { courses: CourseSeed[] };

  for (const c of courseSeed.courses) {
    await prisma.course.upsert({
      where: { name: c.name },
      create: { name: c.name, shortName: c.shortName, active: true },
      update: { shortName: c.shortName, active: true },
    });
  }

  for (const [legacyName, canonicalName] of Object.entries(
    LEGACY_COURSE_NAME_ALIASES,
  )) {
    const legacy = await prisma.course.findUnique({ where: { name: legacyName } });
    const canonical = await prisma.course.findUnique({
      where: { name: canonicalName },
    });
    if (legacy && canonical) {
      await reassignCourseReferences(legacy.id, canonical.id);
      const refs = await eligibilityCountForCourse(legacy.id);
      if (refs === 0) {
        await prisma.course.delete({ where: { id: legacy.id } });
        console.log("Removed unused legacy course:", legacyName);
      } else {
        await prisma.course.update({
          where: { id: legacy.id },
          data: { active: false },
        });
        console.log("Deactivated legacy course (still referenced):", legacyName);
      }
    }
  }

  const inactive = await prisma.course.findMany({
    where: { name: { notIn: [...MAC_COURSE_NAMES] }, active: true },
  });
  for (const course of inactive) {
    const refs = await eligibilityCountForCourse(course.id);
    if (refs === 0) {
      await prisma.course.delete({ where: { id: course.id } });
      console.log("Removed orphan course (no eligibilities):", course.name);
    } else {
      await prisma.course.update({
        where: { id: course.id },
        data: { active: false },
      });
      console.log(
        "Deactivated orphan course (eligibilities preserved):",
        course.name,
      );
    }
  }

  console.log("Upserted", courseSeed.courses.length, "MAC courses.");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
