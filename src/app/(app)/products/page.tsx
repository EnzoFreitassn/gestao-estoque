import type { Metadata } from "next";

import { auth } from "@/lib/auth";
import { PageHeader } from "@/components/layout/page-header";
import { ProductsTable } from "@/components/products/products-table";
import { ProductsHeaderActions } from "@/components/products/products-header-actions";

export const metadata: Metadata = {
  title: "Produtos | Gestão de Estoque",
};

export default async function ProductsPage() {
  const session = await auth();
  const canDelete = session?.user?.role === "OWNER";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Produtos"
        description="Gerencie o catálogo e os níveis de estoque."
      >
        <ProductsHeaderActions />
      </PageHeader>
      <ProductsTable canDelete={canDelete} />
    </div>
  );
}
