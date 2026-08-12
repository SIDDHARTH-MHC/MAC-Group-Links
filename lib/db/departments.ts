import { prisma } from "@/lib/db/prisma";

export async function findDepartmentByName(name: string) {
  return prisma.department.findFirst({
    where: {
      active: true,
      name: { equals: name.trim(), mode: "insensitive" },
    },
  });
}

export async function listActiveDepartments() {
  return prisma.department.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
  });
}

export async function resolveDepartmentByName(name: string) {
  return findDepartmentByName(name);
}

export async function duplicateGroupLinkMessage(
  paperId: string,
  normalizedGroupLink: string,
  excludeGroupId?: string,
  excludeContributionId?: string,
) {
  const existing = await prisma.group.findFirst({
    where: {
      paperId,
      normalizedGroupLink,
      ...(excludeGroupId ? { NOT: { id: excludeGroupId } } : {}),
    },
  });
  if (existing) return "This group link has already been added.";
  const pending = await prisma.groupContribution.findFirst({
    where: {
      paperId,
      normalizedGroupLink,
      status: "PENDING",
      ...(excludeContributionId ? { NOT: { id: excludeContributionId } } : {}),
    },
  });
  if (pending) return "This group link is already pending review for this paper.";
  return null;
}
