import type { MovementDTO } from "@/types/movement";

export type DashboardTotals = {
  products: number;
  stockCostValue: number;
  stockSaleValue: number;
  belowMin: number;
  movementsLast7: number;
};

export type LowStockItem = {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  minQuantity: number;
  unit: string;
};

export type MovementsByDay = {
  date: string; // rótulo dd/MM
  entradas: number;
  saidas: number;
};

export type DashboardData = {
  totals: DashboardTotals;
  lowStock: LowStockItem[];
  movementsByDay: MovementsByDay[];
  recentMovements: MovementDTO[];
};
