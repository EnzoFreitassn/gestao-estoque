import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { PageHeader } from "@/components/layout/page-header";
import { AuditTable } from "@/components/audit/audit-table";

export const metadata: Metadata = {
  title: "Auditoria | Gestão de Estoque",
};

export default async function AuditPage() {
  const session = await auth();

  // Controle de acesso fino no servidor: só OWNER acessa a auditoria.
  if (session?.user?.role !== "OWNER") {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Auditoria"
        description="Registro das ações sensíveis realizadas no sistema."
      />
      <AuditTable />
    </div>
  );
}
