import { prisma } from "@/lib/db/prisma";
import type { Semester } from "@prisma/client";

export async function getActiveSemester(): Promise<Semester | null> {
  return prisma.semester.findFirst({
    where: { status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
  });
}

export async function getActiveSemesterOrThrow(): Promise<Semester> {
  const semester = await getActiveSemester();
  if (!semester) {
    throw new Error("No active semester configured");
  }
  return semester;
}
