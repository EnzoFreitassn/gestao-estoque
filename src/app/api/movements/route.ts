import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { listMovements } from "@/server/movements";
import { movementFilterSchema } from "@/lib/validations/movement";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const parsed = movementFilterSchema.safeParse({
    productId: searchParams.get("productId") ?? undefined,
    type: searchParams.get("type") ?? undefined,
    from: searchParams.get("from") ?? undefined,
    to: searchParams.get("to") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Filtro inválido." }, { status: 400 });
  }

  const movements = await listMovements(parsed.data);
  return NextResponse.json(movements);
}
