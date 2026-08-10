import { prisma } from "@/lib/db/prisma";
import type { PaperType } from "@prisma/client";

const paperInclude = {
  department: true,
  eligibilities: { include: { course: true } },
  groups: {
    where: { status: "ACTIVE" as const },
    include: { eligibilities: { include: { course: true } } },
    orderBy: { sectionName: "asc" as const },
  },
};

export async function getPublicPaper(paperId: string, semesterId: string) {
  return prisma.paper.findFirst({
    where: {
      id: paperId,
      semesterId,
      archivedAt: null,
    },
    include: paperInclude,
  });
}

export async function listPublicPapers(
  semesterId: string,
  paperType?: PaperType,
  department?: string,
  search?: string
) {
  return prisma.paper.findMany({
    where: {
      semesterId,
      archivedAt: null,
      ...(paperType ? { paperType } : {}),
      ...(department
        ? { department: { name: { equals: department, mode: "insensitive" } } }
        : {}),
      ...(search
        ? {
            OR: [
              { paperName: { contains: search, mode: "insensitive" } },
              { department: { name: { contains: search, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    include: {
      department: true,
      eligibilities: { include: { course: true } },
      _count: { select: { groups: true } },
    },
    orderBy: [{ paperType: "asc" }, { paperName: "asc" }],
  });
}

export async function searchPapers(semesterId: string, query: string) {
  const q = query.trim();
  if (!q) return [];

  return prisma.paper.findMany({
    where: {
      semesterId,
      archivedAt: null,
      OR: [
        { paperName: { contains: q, mode: "insensitive" } },
        { department: { name: { contains: q, mode: "insensitive" } } },
        {
          groups: {
            some: {
              OR: [
                { teacherName: { contains: q, mode: "insensitive" } },
                { sectionName: { contains: q, mode: "insensitive" } },
              ],
            },
          },
        },
        {
          eligibilities: {
            some: {
              course: { name: { contains: q, mode: "insensitive" } },
            },
          },
        },
      ],
    },
    include: {
      department: true,
      eligibilities: { include: { course: true } },
      _count: { select: { groups: { where: { status: "ACTIVE" } } } },
    },
    take: 40,
    orderBy: { paperName: "asc" },
  });
}

export async function getRecentGroups(semesterId: string, limit = 6) {
  return prisma.group.findMany({
    where: {
      groupLink: { not: null },
      status: "ACTIVE",
      paper: { semesterId, archivedAt: null },
    },
    include: {
      paper: { include: { department: true } },
      eligibilities: { include: { course: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function listDepartments(semesterId: string) {
  const rows = await prisma.paper.findMany({
    where: { semesterId, archivedAt: null },
    select: { department: { select: { name: true } } },
    distinct: ["departmentId"],
    orderBy: { department: { name: "asc" } },
  });
  return rows.map((r) => r.department.name);
}
