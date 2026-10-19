"use server";

import { Prisma } from "@prisma/client";

import { productSchema } from "@/lib/validations/product";
import * as productService from "@/server/products";
import { logAudit } from "@/server/audit";
import type { ProductDTO } from "@/types/product";
import {
  fail,
  ok,
  requireUser,
  type ActionResult,
} from "@/lib/actions/helpers";

// Trata o erro de SKU duplicado (constraint única) com mensagem amigável.
function handlePrismaError(error: unknown): ActionResult<never> {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    return fail("Já existe um produto com este SKU.", {
      sku: ["SKU já cadastrado."],
    });
  }
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2025"
  ) {
    return fail("Produto não encontrado.");
  }
  throw error;
}

export async function createProductAction(
  input: unknown,
): Promise<ActionResult<ProductDTO>> {
  const user = await requireUser();

  const parsed = productSchema.safeParse(input);
  if (!parsed.success) {
    return fail("Verifique os campos.", parsed.error.flatten().fieldErrors);
  }

  try {
    const product = await productService.createProduct(parsed.data);
    await logAudit({
      userId: user.id,
      action: "product.create",
      entity: "Product",
      entityId: product.id,
      details: { sku: product.sku, name: product.name },
    });
    return ok(product);
  } catch (error) {
    return handlePrismaError(error);
  }
}

export async function updateProductAction(
  id: string,
  input: unknown,
): Promise<ActionResult<ProductDTO>> {
  const user = await requireUser();

  const parsed = productSchema.safeParse(input);
  if (!parsed.success) {
    return fail("Verifique os campos.", parsed.error.flatten().fieldErrors);
  }

  try {
    const product = await productService.updateProduct(id, parsed.data);
    await logAudit({
      userId: user.id,
      action: "product.update",
      entity: "Product",
      entityId: product.id,
      details: { sku: product.sku, name: product.name },
    });
    return ok(product);
  } catch (error) {
    return handlePrismaError(error);
  }
}

export async function deleteProductAction(
  id: string,
): Promise<ActionResult<undefined>> {
  const user = await requireUser();

  // Controle de acesso fino: apenas OWNER exclui produtos do catálogo.
  if (user.role !== "OWNER") {
    return fail("Apenas o dono pode excluir produtos.");
  }

  try {
    await productService.deleteProduct(id);
    await logAudit({
      userId: user.id,
      action: "product.delete",
      entity: "Product",
      entityId: id,
      details: {},
    });
    return ok(undefined);
  } catch (error) {
    return handlePrismaError(error);
  }
}

export type ImportResult = {
  created: number;
  skipped: { sku: string; reason: string }[];
};

// Importa produtos em lote. Re-valida CADA linha no servidor (nunca confia no
// que o client enviou) e trata SKU duplicado item a item.
export async function importProductsAction(
  rows: unknown,
): Promise<ActionResult<ImportResult>> {
  const user = await requireUser();

  if (!Array.isArray(rows)) {
    return fail("Dados de importação inválidos.");
  }

  const result: ImportResult = { created: 0, skipped: [] };

  for (const row of rows) {
    const parsed = productSchema.safeParse(row);
    if (!parsed.success) {
      const sku =
        typeof row === "object" && row && "sku" in row
          ? String((row as { sku: unknown }).sku)
          : "(sem SKU)";
      result.skipped.push({ sku, reason: "Dados inválidos." });
      continue;
    }

    try {
      await productService.createProduct(parsed.data);
      result.created += 1;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        result.skipped.push({
          sku: parsed.data.sku,
          reason: "SKU já cadastrado.",
        });
      } else {
        throw error;
      }
    }
  }

  if (result.created > 0) {
    await logAudit({
      userId: user.id,
      action: "product.import",
      entity: "Product",
      entityId: "-",
      details: { created: result.created, skipped: result.skipped.length },
    });
  }

  return ok(result);
}
