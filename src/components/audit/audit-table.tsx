"use client";

import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from "@tanstack/react-table";
import { AlertCircle, FileClock, Search } from "lucide-react";

import type { AuditLogDTO } from "@/types/audit";
import { useAudit } from "@/hooks/use-audit";
import { auditColumns, actionLabel } from "@/components/audit/audit-columns";
import { DataTablePagination } from "@/components/data-table/pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function globalFilterFn(
  row: { original: AuditLogDTO },
  _columnId: string,
  filterValue: string,
): boolean {
  const query = filterValue.trim().toLowerCase();
  if (!query) return true;
  const { user, action, entity } = row.original;
  return (
    user.name.toLowerCase().includes(query) ||
    actionLabel(action).toLowerCase().includes(query) ||
    entity.toLowerCase().includes(query)
  );
}

export function AuditTable() {
  const { data, isPending, isError, refetch, isRefetching } = useAudit();

  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "createdAt", desc: true },
  ]);
  const [globalFilter, setGlobalFilter] = React.useState("");

  const logs = React.useMemo(() => data ?? [], [data]);

  const table = useReactTable({
    data: logs,
    columns: auditColumns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 15 } },
  });

  const columnCount = auditColumns.length;

  return (
    <div className="space-y-4">
      <div className="relative sm:max-w-xs">
        <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por usuário, ação ou entidade..."
          value={globalFilter}
          onChange={(event) => setGlobalFilter(event.target.value)}
          className="pl-8"
          aria-label="Buscar na auditoria"
        />
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isPending ? (
              Array.from({ length: 6 }).map((_, index) => (
                <TableRow key={`skeleton-${index}`}>
                  {Array.from({ length: columnCount }).map((__, cellIndex) => (
                    <TableCell key={`skeleton-cell-${cellIndex}`}>
                      <Skeleton className="h-5 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={columnCount} className="h-40">
                  <div className="flex flex-col items-center justify-center gap-3 text-center">
                    <AlertCircle className="size-8 text-destructive" />
                    <p className="font-medium">Erro ao carregar a auditoria</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => refetch()}
                      disabled={isRefetching}
                    >
                      Tentar novamente
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columnCount} className="h-48">
                  <EmptyState
                    icon={FileClock}
                    title="Nenhum registro de auditoria"
                    description="As ações sensíveis (criar, editar, excluir, movimentar) aparecerão aqui."
                  />
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {!isPending && !isError && logs.length > 0 && (
        <DataTablePagination table={table} />
      )}
    </div>
  );
}
