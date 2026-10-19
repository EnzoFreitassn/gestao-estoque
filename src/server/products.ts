import "server-only";

import type { Product } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type { ProductDTO } from "@/types/product";
import type { ProductInput } from "@/lib/validations/product";

// Converte o registro do Prisma (Decimal/Date) em um DTO serializável.
// Decimal -> number é seguro para EXIBIÇÃO; o Postgres continua sendo a fonte
// da verdade com precisão decimal.
export function toProductDTO(product: Product): ProductDTO {
  const quantity = product.quantity.toNumber();
  const minQuantity = product.minQuantity.toNumber();

  return {
    id: product.id,
    name: product.name,
    sku: product.sku,
    description: product.description,
    category: product.category,
    unit: product.unit,
    costPrice: product.costPrice.toNumber(),
    salePrice: product.salePrice.toNumber(),
    quantity,
    minQuantity,
    lowStock: quantity <= minQuantity,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}

export async function listProducts(): Promise<ProductDTO[]> {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
  });
  return products.map(toProductDTO);
}

export async function createProduct(data: ProductInput): Promise<ProductDTO> {
  const created = await prisma.product.create({ data });
  return toProductDTO(created);
}

export async function updateProduct(
  id: string,
  data: ProductInput,
): Promise<ProductDTO> {
  const updated = await prisma.product.update({ where: { id }, data });
  return toProductDTO(updated);
}

export async function deleteProduct(id: string): Promise<void> {
  await prisma.product.delete({ where: { id } });
}
