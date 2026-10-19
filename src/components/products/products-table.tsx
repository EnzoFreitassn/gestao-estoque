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
import { AlertCircle, PackageOpen, Plus, Search } from "lucide-react";

import type { ProductDTO } from "@/types/product";
import { useProducts } from "@/hooks/use-products";
import { createProductColumns } from "@/components/products/product-columns";
import { ProductFormDialog } from "@/components/products/product-form-dialog";
import { DeleteProductDialog } from "@/components/products/delete-product-dialog";
import { DataTablePagination } from "@/components/data-table/pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
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

const ALL_CATEGORIES = "__all__";

function globalFilterFn(
  row: { original: ProductDTO },
  _columnId: string,
  filterValue: string,
): boolean {
  const query = filterValue.trim().toLowerCase();
  if (!query) return true;
  const { name, sku, category } = row.original;
  return (
    name.toLowerCase().includes(query) ||
    sku.toLowerCase().includes(query) ||
    category.toLowerCase().includes(query)
  );
}

export function ProductsTable({ canDelete }: { canDelete: boolean }) {
  const { data, isPending, isError, refetch, isRefetching } = useProducts();

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [globalFilter, setGlobalFilter] = React.useState("");

  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<ProductDTO | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<ProductDTO | null>(
    null,
  );

  const products = React.useMemo(() => data ?? [], [data]);

  const categories = React.useMemo(() => {
    const set = new Set(products.map((p) => p.category));
    return Array.from(set).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [products]);

  const columns = React.useMemo(
    () =>
      createProductColumns({
        onEdit: (product) => {
          setEditing(product);
          setFormOpen(true);
        },
        onDelete: (product) => setDeleteTarget(product),
        canDelete,
      }),
    [canDelete],
  );

  const table = useReactTable({
    data: products,
    columns,
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

  const categoryFilter =
    (table.getColumn("category")?.getFilterValue() as string) ?? ALL_CATEGORIES;

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  const columnCount = columns.length;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative sm:max-w-xs">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, SKU ou categoria..."
              value={globalFilter}
              onChange={(event) => setGlobalFilter(event.target.value)}
              className="pl-8"
              aria-label="Buscar produtos"
            />
          </div>

          <Select
            value={categoryFilter}
            onValueChange={(value) =>
              table
                .getColumn("category")
                ?.setFilterValue(value === ALL_CATEGORIES ? undefined : value)
            }
          >
            <SelectTrigger className="sm:w-[200px]" aria-label="Filtrar categoria">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_CATEGORIES}>Todas as categorias</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button onClick={openCreate}>
          <Plus className="size-4" />
          Novo produto
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
                    <div>
                      <p className="font-medium">Erro ao carregar produtos</p>
                      <p className="text-sm text-muted-foreground">
                        Verifique sua conexão e tente novamente.
                      </p>
                    </div>
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
                <TableCell colSpan={columnCount} className="h-40">
                  <div className="flex flex-col items-center justify-center gap-3 text-center">
                    <PackageOpen className="size-8 text-muted-foreground" />
                    <div>
                      <p className="font-medium">
                        {products.length === 0
                          ? "Nenhum produto cadastrado"
                          : "Nenhum resultado para o filtro"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {products.length === 0
                          ? "Comece cadastrando seu primeiro produto."
                          : "Ajuste a busca ou o filtro de categoria."}
                      </p>
                    </div>
                    {products.length === 0 && (
                      <Button size="sm" onClick={openCreate}>
                        <Plus className="size-4" />
                        Novo produto
                      </Button>
                    )}
                  </div>
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

      {!isPending && !isError && products.length > 0 && (
        <DataTablePagination table={table} />
      )}

      <ProductFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        product={editing}
      />
      <DeleteProductDialog
        product={deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      />
    </div>
  );
}
