"use server";

import { movementSchema } from "@/lib/validations/movement";
import * as movementService from "@/server/movements";
import { logAudit } from "@/server/audit";
import { DomainError } from "@/lib/errors";
import type { MovementDTO } from "@/types/movement";
import {
  fail,
  ok,
  requireUser,
  type ActionResult,
} from "@/lib/actions/helpers";

export async function createMovementAction(
  input: unknown,
): Promise<ActionResult<MovementDTO>> {
  const user = await requireUser();

  const parsed = movementSchema.safeParse(input);
  if (!parsed.success) {
    return fail("Verifique os campos.", parsed.error.flatten().fieldErrors);
  }

  try {
    const movement = await movementService.createMovement({
      ...parsed.data,
      userId: user.id,
    });
    await logAudit({
      userId: user.id,
      action: "movement.create",
      entity: "StockMovement",
      entityId: movement.id,
      details: {
        productId: movement.product.id,
        sku: movement.product.sku,
        type: movement.type,
        quantity: movement.quantity,
      },
    });
    return ok(movement);
  } catch (error) {
    if (error instanceof DomainError) {
      return fail(error.message);
    }
    throw error;
  }
}
