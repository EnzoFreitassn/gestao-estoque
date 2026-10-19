import "server-only";

import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { DomainError } from "@/lib/errors";
import { INTEGER_UNITS, type Unit } from "@/lib/validations/product";
import type { MovementFilter } from "@/lib/validations/movement";
import type { MovementDTO, MovementType } from "@/types/movement";

// include compartilhado para montar o DTO com produto + usuário.
const movementInclude = {
  product: { select: { id: true, name: true, sku: true, unit: true } },
  user: { select: { id: true, name: true } },
} satisfies Prisma.StockMovementInclude;

type MovementWithRelations = Prisma.StockMovementGetPayload<{
  include: typeof movementInclude;
}>;

function toMovementDTO(movement: MovementWithRelations): MovementDTO {
  return {
    id: movement.id,
    type: movement.type,
    quantity: movement.quantity.toNumber(),
    reason: movement.reason,
    createdAt: movement.createdAt.toISOString(),
    product: movement.product,
    user: movement.user,
  };
}

type CreateMovementArgs = {
  productId: string;
  type: MovementType;
  quantity: number;
  reason?: string;
  userId: string;
};

/**
 * Registra uma movimentação e ajusta a quantidade do produto ATOMICAMENTE.
 * Regras (no servidor): sem estoque negativo em saídas; unidade inteira não
 * aceita fração.
 */
export async function createMovement(
  args: CreateMovementArgs,
): Promise<MovementDTO> {
  return prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({
      where: { id: args.productId },
      select: { id: true, unit: true, quantity: true },
    });

    if (!product) {
      throw new DomainError("Produto não encontrado.");
    }

    if (
      INTEGER_UNITS.includes(product.unit as Unit) &&
      !Number.isInteger(args.quantity)
    ) {
      throw new DomainError(
        `A unidade "${product.unit}" exige quantidade inteira.`,
      );
    }

    const delta = new Prisma.Decimal(args.quantity);
    const nextQuantity =
      args.type === "IN"
        ? product.quantity.plus(delta)
        : product.quantity.minus(delta);

    if (nextQuantity.lessThan(0)) {
      throw new DomainError(
        "Estoque insuficiente para esta saída. Verifique a quantidade disponível.",
      );
    }

    const movement = await tx.stockMovement.create({
      data: {
        productId: args.productId,
        type: args.type,
        quantity: args.quantity,
        reason: args.reason,
        userId: args.userId,
      },
      include: movementInclude,
    });

    await tx.product.update({
      where: { id: args.productId },
      data: { quantity: nextQuantity },
    });

    return toMovementDTO(movement);
  });
}

export async function listMovements(
  filter: MovementFilter = {},
): Promise<MovementDTO[]> {
  const where: Prisma.StockMovementWhereInput = {};

  if (filter.productId) {
    where.productId = filter.productId;
  }
  if (filter.type) {
    where.type = filter.type;
  }
  if (filter.from || filter.to) {
    where.createdAt = {};
    if (filter.from) where.createdAt.gte = new Date(filter.from);
    if (filter.to) where.createdAt.lte = new Date(filter.to);
  }

  const movements = await prisma.stockMovement.findMany({
    where,
    include: movementInclude,
    orderBy: { createdAt: "desc" },
  });

  return movements.map(toMovementDTO);
}
