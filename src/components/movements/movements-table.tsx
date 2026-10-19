"use client";

import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnFiltersState,
  type SortingState,
} from "@tanstack/react-table";
import { AlertCircle, ArrowRightLeft, Plus, Search, X } from "lucide-react";

import type { MovementDTO } from "@/types/movement";
import { useMovements } from "@/hooks/use-movements";
import {
  movementColumns,
  dateRangeFilter,
} from "@/components/movements/movement-columns";
import { MovementFormDialog } from "@/components/movements/movement-form-dialog";
import { DataTablePagination } from "@/components/data-table/pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const ALL_TYPES = "__all__";

function globalFilterFn(
  row: { original: MovementDTO },
  _columnId: string,
  filterValue: string,
): boolean {
  const query = filterValue.trim().toLowerCase();
  if (!query) return true;
  const { product, reason } = row.original;
  return (
    product.name.toLowerCase().includes(query) ||
    product.sku.toLowerCase().includes(query) ||
    (reason ?? "").toLowerCase().includes(query)
  );
}

type MovementsTableProps = {
  initialProductId?: string;
  autoOpenNew?: boolean;
};

export function MovementsTable({
  initialProductId,
  autoOpenNew,
}: MovementsTableProps) {
  const { data, isPending, isError, refetch, isRefetching } = useMovements();

  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "createdAt", desc: true },
  ]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [dateFrom, setDateFrom] = React.useState("");
  const [dateTo, setDateTo] = React.useState("");
  const [dialogOpen, setDialogOpen] = React.useState(Boolean(autoOpenNew));

  // Dados escopados ao produto (histórico por produto), quando aplicável.
  const allMovements = React.useMemo(() => data ?? [], [data]);
  const movements = React.useMemo(
    () =>
      initialProductId
        ? allMovements.filter((m) => m.product.id === initialProductId)
        : allMovements,
    [allMovements, initialProductId],
  );

  const scopedProduct = initialProductId
    ? allMovements.find((m) => m.product.id === initialProductId)?.product
    : undefined;

  // Sincroniza os inputs de data com o filtro da coluna createdAt.
  React.useEffect(() => {
    setColumnFilters((prev) => {
      const others = prev.filter((f) => f.id !== "createdAt");
      if (!dateFrom && !dateTo) return others;
      return [...others, { id: "createdAt", value: { from: dateFrom, to: dateTo } }];
    });
  }, [dateFrom, dateTo]);

  const typeFilter =
    (columnFilters.find((f) => f.id === "type")?.value as string) ?? ALL_TYPES;

  const table = useReactTable({
    data: movements,
    columns: movementColumns,
    filterFns: { dateRange: dateRangeFilter },
    state: { sorting, columnFilters, globalFilter },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  const columnCount = movementColumns.length;

  function setTypeFilter(value: string) {
    table
      .getColumn("type")
      ?.setFilterValue(value === ALL_TYPES ? undefined : value);
  }

  function clearDates() {
    setDateFrom("");
    setDateTo("");
  }

  return (
    <div className="space-y-4">
      {scopedProduct && (
        <div className="flex items-center justify-between rounded-lg border bg-muted/40 px-4 py-2 text-sm">
          <span>
            Histórico de{" "}
            <span className="font-medium">{scopedProduct.name}</span>
          </span>
          <Button variant="ghost" size="sm" asChild>
            <a href="/movements">Ver todas</a>
          </Button>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:flex lg:flex-wrap lg:items-end">
          <div className="relative sm:max-w-xs">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por produto ou motivo..."
              value={globalFilter}
              onChange={(event) => setGlobalFilter(event.target.value)}
              className="pl-8"
              aria-label="Buscar movimentações"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Tipo</Label>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="sm:w-[150px]" aria-label="Filtrar tipo">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_TYPES}>Todos</SelectItem>
                <SelectItem value="IN">Entrada</SelectItem>
                <SelectItem value="OUT">Saída</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="date-from" className="text-xs text-muted-foreground">
              De
            </Label>
            <Input
              id="date-from"
              type="date"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
              className="sm:w-[150px]"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="date-to" className="text-xs text-muted-foreground">
              Até
            </Label>
            <Input
              id="date-to"
              type="date"
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
              className="sm:w-[150px]"
            />
          </div>

          {(dateFrom || dateTo) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearDates}
              className="h-9"
            >
              <X className="size-4" />
              Limpar datas
            </Button>
          )}
        </div>

        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="size-4" />
          Registrar movimentação
        </Button>
      </div>

      {/* Tabela */}
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
              Array.from({ length: 5 }).map((_, index) => (
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
                    <p className="font-medium">Erro ao carregar movimentações</p>
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
                    icon={ArrowRightLeft}
                    title={
                      movements.length === 0
                        ? "Nenhuma movimentação registrada"
                        : "Nenhum resultado para os filtros"
                    }
                    description={
                      movements.length === 0
                        ? "Registre a primeira entrada ou saída."
                        : "Ajuste a busca, o tipo ou o período."
                    }
                    action={
                      movements.length === 0 ? (
                        <Button size="sm" onClick={() => setDialogOpen(true)}>
                          <Plus className="size-4" />
                          Registrar movimentação
                        </Button>
                      ) : undefined
                    }
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

      {!isPending && !isError && movements.length > 0 && (
        <DataTablePagination table={table} />
      )}

      <MovementFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        defaultProductId={initialProductId}
      />
    </div>
  );
}
