import type { Metadata } from "next";

import { PageHeader } from "@/components/layout/page-header";
import { AlertsList } from "@/components/alerts/alerts-list";

export const metadata: Metadata = {
  title: "Estoque baixo | Gestão de Estoque",
};

export default function AlertsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Estoque baixo"
        description="Produtos no ou abaixo do limiar mínimo, priorizados por criticidade."
      />
      <AlertsList />
    </div>
  );
}
