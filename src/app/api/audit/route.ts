import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { listAuditLogs } from "@/server/audit";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }
  // Controle de acesso fino: auditoria é exclusiva do OWNER.
  if (session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const logs = await listAuditLogs();
  return NextResponse.json(logs);
}
