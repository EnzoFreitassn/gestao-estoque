import "server-only";

import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type { AuditLogDTO } from "@/types/audit";

type AuditEntry = {
  userId: string;
  action: string;
  entity: string;
  entityId: string;
  details?: Record<string, unknown>;
};

/**
 * Registra uma ação sensível. NÃO deve derrubar a operação principal: se o log
 * falhar, apenas registra no console e segue.
 */
export async function logAudit(entry: AuditEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: entry.userId,
        action: entry.action,
        entity: entry.entity,
        entityId: entry.entityId,
        details: (entry.details ?? undefined) as Prisma.InputJsonValue,
      },
    });
  } catch (error) {
    console.error("[audit] falha ao registrar log:", error);
  }
}

export async function listAuditLogs(): Promise<AuditLogDTO[]> {
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
    include: { user: { select: { id: true, name: true } } },
  });

  return logs.map((log) => ({
    id: log.id,
    action: log.action,
    entity: log.entity,
    entityId: log.entityId,
    details:
      log.details && typeof log.details === "object"
        ? (log.details as Record<string, unknown>)
        : null,
    createdAt: log.createdAt.toISOString(),
    user: log.user,
  }));
}
