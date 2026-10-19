import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { listProducts } from "@/server/products";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const products = await listProducts();
  return NextResponse.json(products);
}
