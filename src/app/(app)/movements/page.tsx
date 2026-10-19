import type { Metadata } from "next";

import { Download } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { MovementsTable } from "@/components/movements/movements-table";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Movimentações | Gestão de Estoque",
};

export default async function MovementsPage({
  searchParams,
}: {
  searchParams: Promise<{ productId?: string; new?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Movimentações"
        description="Registre entradas e saídas e acompanhe o histórico do estoque."
      >
        <Button variant="outline" asChild>
          <a href="/api/movements/export">
            <Download className="size-4" />
            Exportar
          </a>
        </Button>
      </PageHeader>
      <MovementsTable
        initialProductId={params.productId}
        autoOpenNew={params.new === "1"}
      />
    </div>
  );
}
