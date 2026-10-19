"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import {
  ArrowRightLeft,
  History,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";

import type { ProductDTO } from "@/types/product";
import { formatBRL, formatQuantity } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTableColumnHeader } from "@/components/data-table/column-header";

type ColumnActions = {
  onEdit: (product: ProductDTO) => void;
  onDelete: (product: ProductDTO) => void;
  /** Exclusão é exclusiva do OWNER. */
  canDelete: boolean;
};

export function createProductColumns({
  onEdit,
  onDelete,
  canDelete,
}: ColumnActions): ColumnDef<ProductDTO>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Produto" />
      ),
      cell: ({ row }) => (
        <div className="min-w-[160px]">
          <div className="font-medium">{row.original.name}</div>
          {row.original.description && (
            <div className="line-clamp-1 text-xs text-muted-foreground">
              {row.original.description}
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: "sku",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="SKU" />
      ),
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">
          {row.original.sku}
        </span>
      ),
    },
    {
      accessorKey: "category",
      filterFn: "equalsString",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Categoria" />
      ),
      cell: ({ row }) => (
        <Badge variant="secondary">{row.original.category}</Badge>
      ),
    },
    {
      accessorKey: "quantity",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Estoque" />
      ),
      cell: ({ row }) => {
        const { quantity, unit, lowStock } = row.original;
        return (
          <div className="flex items-center gap-2">
            <span>{formatQuantity(quantity, unit)}</span>
            {lowStock && <Badge variant="warning">Baixo</Badge>}
          </div>
        );
      },
    },
    {
      accessorKey: "costPrice",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Custo" />
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {formatBRL(row.original.costPrice)}
        </span>
      ),
    },
    {
      accessorKey: "salePrice",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Venda" />
      ),
      cell: ({ row }) => formatBRL(row.original.salePrice),
    },
    {
      id: "actions",
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => {
        const product = row.original;
        return (
          <div className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  aria-label={`Ações para ${product.name}`}
                >
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={`/movements?productId=${product.id}&new=1`}>
                    <ArrowRightLeft className="size-4" />
                    Movimentar estoque
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/movements?productId=${product.id}`}>
                    <History className="size-4" />
                    Ver histórico
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onEdit(product)}>
                  <Pencil className="size-4" />
                  Editar
                </DropdownMenuItem>
                {canDelete && (
                  <DropdownMenuItem
                    onClick={() => onDelete(product)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="size-4" />
                    Excluir
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];
}
