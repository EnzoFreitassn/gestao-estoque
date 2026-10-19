import "server-only";

import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type { MovementDTO } from "@/types/movement";
import type {
  DashboardData,
  LowStockItem,
  MovementsByDay,
} from "@/types/dashboard";

const DAYS_IN_CHART = 14;
const LOW_STOCK_LIMIT = 6;

function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10); // yyyy-mm-dd
}

function dayLabel(key: string): string {
  const [, month, day] = key.split("-");
  return `${day}/${month}`;
}

export async function getDashboardData(): Promise<DashboardData> {
  const now = new Date();
  const since7 = new Date(now);
  since7.setDate(now.getDate() - 7);
  const sinceChart = new Date(now);
  sinceChart.setDate(now.getDate() - (DAYS_IN_CHART - 1));
  sinceChart.setHours(0, 0, 0, 0);

  const [products, movementsLast7, chartMovements, recent] = await Promise.all([
    prisma.product.findMany({
      select: {
        id: true,
        name: true,
        sku: true,
        unit: true,
        quantity: true,
        minQuantity: true,
        costPrice: true,
        salePrice: true,
      },
    }),
    prisma.stockMovement.count({ where: { createdAt: { gte: since7 } } }),
    prisma.stockMovement.findMany({
      where: { createdAt: { gte: sinceChart } },
      select: { type: true, createdAt: true },
    }),
    prisma.stockMovement.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        product: { select: { id: true, name: true, sku: true, unit: true } },
        user: { select: { id: true, name: true } },
      },
    }),
  ]);

  // Totais de valor em estoque (Decimal para evitar erro de float).
  let costValue = new Prisma.Decimal(0);
  let saleValue = new Prisma.Decimal(0);
  let belowMin = 0;
  for (const p of products) {
    costValue = costValue.plus(p.quantity.mul(p.costPrice));
    saleValue = saleValue.plus(p.quantity.mul(p.salePrice));
    if (p.quantity.lessThanOrEqualTo(p.minQuantity)) belowMin += 1;
  }

  // Produtos com estoque mais baixo (maior déficit em relação ao mínimo).
  const lowStock: LowStockItem[] = products
    .map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      unit: p.unit,
      quantity: p.quantity.toNumber(),
      minQuantity: p.minQuantity.toNumber(),
      deficit: p.quantity.minus(p.minQuantity).toNumber(),
    }))
    .sort((a, b) => a.deficit - b.deficit)
    .slice(0, LOW_STOCK_LIMIT)
    .map(({ deficit: _deficit, ...rest }) => rest);

  // Série temporal: inicializa todos os dias com zero e preenche.
  const buckets = new Map<string, MovementsByDay>();
  for (let i = 0; i < DAYS_IN_CHART; i += 1) {
    const d = new Date(sinceChart);
    d.setDate(sinceChart.getDate() + i);
    const key = dayKey(d);
    buckets.set(key, { date: dayLabel(key), entradas: 0, saidas: 0 });
  }
  for (const m of chartMovements) {
    const bucket = buckets.get(dayKey(m.createdAt));
    if (!bucket) continue;
    if (m.type === "IN") bucket.entradas += 1;
    else bucket.saidas += 1;
  }

  const recentMovements: MovementDTO[] = recent.map((m) => ({
    id: m.id,
    type: m.type,
    quantity: m.quantity.toNumber(),
    reason: m.reason,
    createdAt: m.createdAt.toISOString(),
    product: m.product,
    user: m.user,
  }));

  return {
    totals: {
      products: products.length,
      stockCostValue: costValue.toNumber(),
      stockSaleValue: saleValue.toNumber(),
      belowMin,
      movementsLast7,
    },
    lowStock,
    movementsByDay: Array.from(buckets.values()),
    recentMovements,
  };
}
