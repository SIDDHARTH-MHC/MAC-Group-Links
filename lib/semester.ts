import { prisma } from "@/lib/db/prisma";
import type { PaperType, Semester } from "@prisma/client";

export function formatSemesterLabel(semester: { academicYear: string; semesterNumber: number }): string {
  return `${semester.academicYear} • Semester ${semester.semesterNumber}`;
}

export async function getActiveSemester(): Promise<Semester | null> {
  return prisma.semester.findFirst({
    where: { status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
  });
}

export async function getSemesterById(id: string): Promise<Semester | null> {
  return prisma.semester.findUnique({ where: { id } });
}

export const PAPER_TYPES: PaperType[] = ["SEC", "VAC", "GE", "DSE", "AEC", "CORE"];

export function parsePaperTypeParam(param: string): PaperType | null {
  const upper = param.toUpperCase();
  if (PAPER_TYPES.includes(upper as PaperType)) {
    return upper as PaperType;
  }
  return null;
}
