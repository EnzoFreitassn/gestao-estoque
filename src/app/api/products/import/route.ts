import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { DomainError } from "@/lib/errors";
import { parseProductsFile } from "@/server/excel";

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Envie um arquivo." }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "Arquivo muito grande (máx. 5 MB)." },
      { status: 400 },
    );
  }

  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!["xlsx", "csv"].includes(extension)) {
    return NextResponse.json(
      { error: "Formato não suportado. Use .xlsx ou .csv." },
      { status: 400 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const preview = await parseProductsFile(buffer, extension);
    return NextResponse.json(preview);
  } catch (error) {
    if (error instanceof DomainError) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }
    throw error;
  }
}
