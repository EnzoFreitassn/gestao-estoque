import Link from "next/link";
import { ArrowDown, ArrowUp } from "lucide-react";

import type { MovementDTO } from "@/types/movement";
import { formatDateTime, formatQuantity } from "@/lib/format";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function RecentMovements({ data }: { data: MovementDTO[] }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div className="space-y-1.5">
          <CardTitle>Movimentações recentes</CardTitle>
          <CardDescription>As últimas 5 entradas e saídas.</CardDescription>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/movements">Ver todas</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Nenhuma movimentação registrada ainda.
          </p>
        ) : (
          <ul className="divide-y">
            {data.map((movement) => {
              const isIn = movement.type === "IN";
              return (
                <li
                  key={movement.id}
                  className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <span
                    className={
                      isIn
                        ? "flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                        : "flex size-8 shrink-0 items-center justify-center rounded-full bg-destructive/15 text-destructive"
                    }
                  >
                    {isIn ? (
                      <ArrowUp className="size-4" />
                    ) : (
                      <ArrowDown className="size-4" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {movement.product.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(movement.createdAt)} · {movement.user.name}
                    </p>
                  </div>
                  <span
                    className={
                      isIn
                        ? "shrink-0 text-sm font-medium tabular-nums text-emerald-600 dark:text-emerald-400"
                        : "shrink-0 text-sm font-medium tabular-nums text-destructive"
                    }
                  >
                    {isIn ? "+" : "−"}
                    {formatQuantity(movement.quantity, movement.product.unit)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
