import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { listProducts } from "@/server/products";
import { buildProductsWorkbook } from "@/server/excel";

const XLSX_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const products = await listProducts();
  const buffer = await buildProductsWorkbook(products);
  const stamp = new Date().toISOString().slice(0, 10);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": XLSX_TYPE,
      "Content-Disposition": `attachment; filename="produtos-${stamp}.xlsx"`,
    },
  });
}
