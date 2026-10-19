"use client";

import type { ColumnDef } from "@tanstack/react-table";

import type { AuditLogDTO } from "@/types/audit";
import { formatDateTime } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { DataTableColumnHeader } from "@/components/data-table/column-header";

const ACTION_LABELS: Record<string, string> = {
  "product.create": "Criou produto",
  "product.update": "Editou produto",
  "product.delete": "Excluiu produto",
  "product.import": "Importou produtos",
  "movement.create": "Registrou movimentação",
};

export function actionLabel(action: string): string {
  return ACTION_LABELS[action] ?? action;
}

function actionVariant(
  action: string,
): "default" | "secondary" | "destructive" | "success" | "warning" {
  if (action.endsWith(".create")) return "success";
  if (action.endsWith(".delete")) return "destructive";
  if (action.endsWith(".import")) return "warning";
  return "secondary";
}

function formatDetails(log: AuditLogDTO): string {
  const d = log.details;
  if (!d) return "—";
  if (log.action === "product.import") {
    return `${d.created ?? 0} criados · ${d.skipped ?? 0} ignorados`;
  }
  if (log.action === "movement.create") {
    const type = d.type === "IN" ? "Entrada" : "Saída";
    return `${d.sku ?? ""} · ${type} · ${d.quantity ?? ""}`;
  }
  if (d.sku || d.name) {
    return [d.sku, d.name].filter(Boolean).join(" · ");
  }
  return JSON.stringify(d);
}

export const auditColumns: ColumnDef<AuditLogDTO>[] = [
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Data" />
    ),
    cell: ({ row }) => (
      <span className="whitespace-nowrap text-sm">
        {formatDateTime(row.original.createdAt)}
      </span>
    ),
  },
  {
    id: "user",
    accessorFn: (row) => row.user.name,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Usuário" />
    ),
    cell: ({ row }) => (
      <span className="text-sm font-medium">{row.original.user.name}</span>
    ),
  },
  {
    accessorKey: "action",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Ação" />
    ),
    cell: ({ row }) => (
      <Badge variant={actionVariant(row.original.action)}>
        {actionLabel(row.original.action)}
      </Badge>
    ),
  },
  {
    accessorKey: "entity",
    enableSorting: false,
    header: "Entidade",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {row.original.entity}
      </span>
    ),
  },
  {
    id: "details",
    enableSorting: false,
    header: "Detalhes",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {formatDetails(row.original)}
      </span>
    ),
  },
];
