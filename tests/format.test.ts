import { describe, it, expect } from "vitest";

import { formatBRL, formatQuantity, formatDate } from "@/lib/format";

describe("format (pt-BR)", () => {
  it("formata moeda em reais", () => {
    // O separador entre R$ e o número pode ser espaço comum ou não-quebrável.
    expect(formatBRL(1234.5)).toMatch(/R\$\s*1\.234,50/u);
  });

  it("formata quantidade com unidade e vírgula decimal", () => {
    expect(formatQuantity(2.5, "kg")).toBe("2,5 kg");
  });

  it("formata quantidade sem unidade", () => {
    expect(formatQuantity(10)).toBe("10");
  });

  it("formata data no padrão dd/mm/aaaa", () => {
    expect(formatDate(new Date(2026, 0, 15))).toBe("15/01/2026");
  });
});
