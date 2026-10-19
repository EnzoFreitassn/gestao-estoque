"use client";

import type { ColumnDef, FilterFn } from "@tanstack/react-table";
import { ArrowDown, ArrowUp } from "lucide-react";

import type { MovementDTO } from "@/types/movement";
import { formatDateTime, formatQuantity } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { DataTableColumnHeader } from "@/components/data-table/column-header";

// Filtro por intervalo de datas aplicado à coluna createdAt.
export const dateRangeFilter: FilterFn<MovementDTO> = (
  row,
  columnId,
  value: { from?: string; to?: string },
) => {
  if (!value?.from && !value?.to) return true;
  const date = new Date(row.getValue<string>(columnId));
  if (value.from && date < new Date(value.from)) return false;
  if (value.to) {
    const to = new Date(value.to);
    to.setHours(23, 59, 59, 999);
    if (date > to) return false;
  }
  return true;
};

export const movementColumns: ColumnDef<MovementDTO>[] = [
  {
    accessorKey: "createdAt",
    filterFn: dateRangeFilter,
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
    id: "product",
    accessorFn: (row) => row.product.name,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Produto" />
    ),
    cell: ({ row }) => (
      <div className="min-w-[160px]">
        <div className="font-medium">{row.original.product.name}</div>
        <div className="font-mono text-xs text-muted-foreground">
          {row.original.product.sku}
        </div>
      </div>
    ),
  },
  {
    accessorKey: "type",
    filterFn: "equalsString",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Tipo" />
    ),
    cell: ({ row }) =>
      row.original.type === "IN" ? (
        <Badge variant="success">
          <ArrowUp className="size-3" />
          Entrada
        </Badge>
      ) : (
        <Badge variant="destructive">
          <ArrowDown className="size-3" />
          Saída
        </Badge>
      ),
  },
  {
    accessorKey: "quantity",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Quantidade" />
    ),
    cell: ({ row }) => {
      const { type, quantity, product } = row.original;
      const sign = type === "IN" ? "+" : "−";
      return (
        <span
          className={
            type === "IN"
              ? "font-medium text-emerald-600 dark:text-emerald-400"
              : "font-medium text-destructive"
          }
        >
          {sign}
          {formatQuantity(quantity, product.unit)}
        </span>
      );
    },
  },
  {
    id: "user",
    accessorFn: (row) => row.user.name,
    enableSorting: false,
    header: "Usuário",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {row.original.user.name}
      </span>
    ),
  },
  {
    accessorKey: "reason",
    enableSorting: false,
    header: "Motivo",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {row.original.reason || "—"}
      </span>
    ),
  },
];
