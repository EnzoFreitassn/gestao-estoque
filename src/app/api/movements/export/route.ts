import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { listMovements } from "@/server/movements";
import { buildMovementsWorkbook } from "@/server/excel";

const XLSX_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const movements = await listMovements();
  const buffer = await buildMovementsWorkbook(movements);
  const stamp = new Date().toISOString().slice(0, 10);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": XLSX_TYPE,
      "Content-Disposition": `attachment; filename="movimentacoes-${stamp}.xlsx"`,
    },
  });
}
