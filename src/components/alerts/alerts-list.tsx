"use client";

import * as React from "react";
import Link from "next/link";
import { AlertCircle, ArrowRightLeft, CheckCircle2 } from "lucide-react";

import { useProducts } from "@/hooks/use-products";
import { formatQuantity } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function AlertsList() {
  const { data, isPending, isError, refetch, isRefetching } = useProducts();

  const lowStock = React.useMemo(() => {
    const items = (data ?? []).filter((product) => product.lowStock);
    // Mais crítico primeiro: maior déficit relativo (zerados no topo).
    return items.sort(
      (a, b) =>
        a.quantity - a.minQuantity - (b.quantity - b.minQuantity),
    );
  }, [data]);

  if (isPending) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <AlertCircle className="size-8 text-destructive" />
          <p className="font-medium">Erro ao carregar os alertas</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
          >
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (lowStock.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <CheckCircle2 className="size-10 text-emerald-500" />
          <div>
            <p className="font-medium">Tudo em ordem!</p>
            <p className="text-sm text-muted-foreground">
              Nenhum produto está no ou abaixo do estoque mínimo.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Produto</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Estoque atual</TableHead>
            <TableHead>Mínimo</TableHead>
            <TableHead>Situação</TableHead>
            <TableHead className="text-right">Ação</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lowStock.map((product) => {
            const zeroed = product.quantity <= 0;
            return (
              <TableRow key={product.id}>
                <TableCell>
                  <div className="font-medium">{product.name}</div>
                  <div className="font-mono text-xs text-muted-foreground">
                    {product.sku}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{product.category}</Badge>
                </TableCell>
                <TableCell>
                  {formatQuantity(product.quantity, product.unit)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatQuantity(product.minQuantity, product.unit)}
                </TableCell>
                <TableCell>
                  {zeroed ? (
                    <Badge variant="destructive">Zerado</Badge>
                  ) : (
                    <Badge variant="warning">Abaixo do mínimo</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" asChild>
                    <Link
                      href={`/movements?productId=${product.id}&new=1`}
                    >
                      <ArrowRightLeft className="size-4" />
                      Repor
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
