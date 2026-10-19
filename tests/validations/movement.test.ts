import { describe, it, expect } from "vitest";

import { movementSchema } from "@/lib/validations/movement";

const base = {
  productId: "prod-1",
  type: "IN",
  quantity: 10,
  reason: "Compra",
};

describe("movementSchema", () => {
  it("aceita uma movimentação válida", () => {
    expect(movementSchema.safeParse(base).success).toBe(true);
  });

  it("rejeita quantidade zero", () => {
    expect(movementSchema.safeParse({ ...base, quantity: 0 }).success).toBe(
      false,
    );
  });

  it("rejeita quantidade negativa", () => {
    expect(movementSchema.safeParse({ ...base, quantity: -5 }).success).toBe(
      false,
    );
  });

  it("rejeita tipo inválido", () => {
    expect(
      movementSchema.safeParse({ ...base, type: "TRANSFER" }).success,
    ).toBe(false);
  });

  it("exige productId", () => {
    expect(movementSchema.safeParse({ ...base, productId: "" }).success).toBe(
      false,
    );
  });

  it("transforma motivo vazio em undefined", () => {
    const result = movementSchema.safeParse({ ...base, reason: "" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.reason).toBeUndefined();
    }
  });
});
