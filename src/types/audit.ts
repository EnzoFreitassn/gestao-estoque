export type AuditLogDTO = {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  details: Record<string, unknown> | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
  };
};
