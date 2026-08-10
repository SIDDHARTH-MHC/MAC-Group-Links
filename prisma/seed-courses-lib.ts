import type { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";
import { join } from "path";
import {
  LEGACY_COURSE_NAME_ALIASES,
  MAC_COURSE_NAMES,
} from "../lib/constants/courses";

type CourseSeed = { name: string; shortName: string };

async function reassignCourseReferences(
  db: PrismaClient,
  fromId: string,
  toId: string,
) {
  if (fromId === toId) return;
  await db.paperEligibility.updateMany({
    where: { courseId: fromId },
    data: { courseId: toId },
  });
  await db.groupEligibility.updateMany({
    where: { courseId: fromId },
    data: { courseId: toId },
  });
  await db.groupContributionEligibility.updateMany({
    where: { courseId: fromId },
    data: { courseId: toId },
  });
  await db.suggestionEligibility.updateMany({
    where: { courseId: fromId },
    data: { courseId: toId },
  });
}

async function eligibilityCountForCourse(db: PrismaClient, courseId: string) {
  const [a, b, c, d] = await Promise.all([
    db.paperEligibility.count({ where: { courseId } }),
    db.groupEligibility.count({ where: { courseId } }),
    db.groupContributionEligibility.count({ where: { courseId } }),
    db.suggestionEligibility.count({ where: { courseId } }),
  ]);
  return a + b + c + d;
}

/** Upsert MAC courses from prisma/data/courses.json (does not touch papers). */
export async function seedMacCoursesFromFiles(db: PrismaClient) {
  const courseSeed = JSON.parse(
    readFileSync(join(process.cwd(), "prisma/data/courses.json"), "utf-8"),
  ) as { courses: CourseSeed[] };

  for (const c of courseSeed.courses) {
    await db.course.upsert({
      where: { name: c.name },
      create: { name: c.name, shortName: c.shortName, active: true },
      update: { shortName: c.shortName, active: true },
    });
  }

  for (const [legacyName, canonicalName] of Object.entries(
    LEGACY_COURSE_NAME_ALIASES,
  )) {
    const legacy = await db.course.findUnique({ where: { name: legacyName } });
    const canonical = await db.course.findUnique({
      where: { name: canonicalName },
    });
    if (legacy && canonical) {
      await reassignCourseReferences(db, legacy.id, canonical.id);
      const refs = await eligibilityCountForCourse(db, legacy.id);
      if (refs === 0) {
        await db.course.delete({ where: { id: legacy.id } });
      } else {
        await db.course.update({
          where: { id: legacy.id },
          data: { active: false },
        });
      }
    }
  }

  const inactive = await db.course.findMany({
    where: { name: { notIn: [...MAC_COURSE_NAMES] }, active: true },
  });
  for (const course of inactive) {
    const refs = await eligibilityCountForCourse(db, course.id);
    if (refs === 0) {
      await db.course.delete({ where: { id: course.id } });
    } else {
      await db.course.update({
        where: { id: course.id },
        data: { active: false },
      });
    }
  }
}
