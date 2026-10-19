import type { Metadata } from "next";
import { AlertTriangle, ArrowRightLeft, DollarSign, Package } from "lucide-react";

import { auth } from "@/lib/auth";
import { getDashboardData } from "@/server/dashboard";
import { formatBRL } from "@/lib/format";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { MovementsChart } from "@/components/dashboard/movements-chart";
import { LowStockChart } from "@/components/dashboard/low-stock-chart";
import { RecentMovements } from "@/components/dashboard/recent-movements";

export const metadata: Metadata = {
  title: "Dashboard | Gestão de Estoque",
};

export default async function DashboardPage() {
  const [session, data] = await Promise.all([auth(), getDashboardData()]);
  const userName = session?.user?.name?.trim() ?? "";
  const { totals } = data;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Olá${userName ? `, ${userName}` : ""} 👋`}
        description="Visão geral do seu estoque."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total de produtos"
          value={String(totals.products)}
          hint="Itens cadastrados"
          icon={Package}
        />
        <StatCard
          title="Valor em estoque (custo)"
          value={formatBRL(totals.stockCostValue)}
          hint={`Venda potencial: ${formatBRL(totals.stockSaleValue)}`}
          icon={DollarSign}
        />
        <StatCard
          title="Abaixo do mínimo"
          value={String(totals.belowMin)}
          hint="Produtos que precisam de reposição"
          icon={AlertTriangle}
          accent={totals.belowMin > 0 ? "warning" : "default"}
          href="/alerts"
        />
        <StatCard
          title="Movimentações (7 dias)"
          value={String(totals.movementsLast7)}
          hint="Entradas e saídas recentes"
          icon={ArrowRightLeft}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <MovementsChart data={data.movementsByDay} />
        <LowStockChart data={data.lowStock} />
      </div>

      <RecentMovements data={data.recentMovements} />
    </div>
  );
}
