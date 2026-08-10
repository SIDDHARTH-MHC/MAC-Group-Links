import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import type { Semester } from "@prisma/client";

const loadActiveSemester = unstable_cache(
  async (): Promise<Semester | null> =>
    prisma.semester.findFirst({
      where: { status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
    }),
  ["active-semester"],
  { revalidate: 60, tags: ["active-semester"] },
);

export async function getActiveSemester(): Promise<Semester | null> {
  try {
    return await loadActiveSemester();
  } catch (error) {
    console.error("[getActiveSemester]", error);
    return null;
  }
}

export async function getActiveSemesterOrThrow(): Promise<Semester> {
  const semester = await getActiveSemester();
  if (!semester) {
    throw new Error("No active semester configured");
  }
  return semester;
}
