import { prisma } from "@/lib/db/prisma";
import type { AuditAction } from "@prisma/client";

export async function logAdminAction(
  action: AuditAction,
  description: string,
  entityType?: string,
  entityId?: string
) {
  await prisma.adminAuditLog.create({
    data: {
      action,
      description,
      entityType,
      entityId,
    },
  });
}
