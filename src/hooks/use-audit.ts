"use client";

import { useQuery } from "@tanstack/react-query";

import type { AuditLogDTO } from "@/types/audit";

export const auditQueryKey = ["audit"] as const;

async function fetchAudit(): Promise<AuditLogDTO[]> {
  const response = await fetch("/api/audit");
  if (!response.ok) {
    throw new Error("Não foi possível carregar a auditoria.");
  }
  return response.json();
}

export function useAudit() {
  return useQuery({
    queryKey: auditQueryKey,
    queryFn: fetchAudit,
  });
}
