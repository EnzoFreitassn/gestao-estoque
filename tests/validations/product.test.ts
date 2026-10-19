import { describe, it, expect } from "vitest";

import { productSchema } from "@/lib/validations/product";

const base = {
  name: "Espaguete 500g",
  sku: "MAS-ESP-500",
  category: "Massas secas",
  unit: "kg",
  costPrice: 3.2,
  salePrice: 6.9,
  quantity: 1.5,
  minQuantity: 0.5,
};

describe("productSchema", () => {
  it("aceita um produto válido (kg com fração)", () => {
    expect(productSchema.safeParse(base).success).toBe(true);
  });

  it("rejeita SKU com espaço", () => {
    expect(productSchema.safeParse({ ...base, sku: "MAS ESP" }).success).toBe(
      false,
    );
  });

  it("rejeita preço negativo", () => {
    expect(productSchema.safeParse({ ...base, costPrice: -1 }).success).toBe(
      false,
    );
  });

  it("coage strings numéricas para number", () => {
    const result = productSchema.safeParse({
      ...base,
      costPrice: "3.50",
      quantity: "2",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.costPrice).toBe(3.5);
      expect(result.data.quantity).toBe(2);
    }
  });

  it("exige quantidade inteira para unidade 'pacote'", () => {
    const result = productSchema.safeParse({
      ...base,
      unit: "pacote",
      quantity: 2.5,
    });
    expect(result.success).toBe(false);
  });

  it("aceita quantidade inteira para unidade 'pacote'", () => {
    const result = productSchema.safeParse({
      ...base,
      unit: "pacote",
      quantity: 2,
      minQuantity: 1,
    });
    expect(result.success).toBe(true);
  });

  it("rejeita unidade fora da lista", () => {
    expect(productSchema.safeParse({ ...base, unit: "quilo" }).success).toBe(
      false,
    );
  });

  it("transforma descrição vazia em undefined", () => {
    const result = productSchema.safeParse({ ...base, description: "" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description).toBeUndefined();
    }
  });
});
