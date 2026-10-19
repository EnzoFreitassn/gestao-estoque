import { describe, it, expect } from "vitest";
import ExcelJS from "exceljs";

import { parseProductsFile, buildProductsWorkbook } from "@/server/excel";
import type { ProductDTO } from "@/types/product";

async function toBuffer(workbook: ExcelJS.Workbook): Promise<Buffer> {
  return Buffer.from(await workbook.xlsx.writeBuffer());
}

const HEADER = [
  "Nome",
  "SKU",
  "Categoria",
  "Unidade",
  "Preço de custo",
  "Preço de venda",
  "Quantidade",
  "Quantidade mínima",
  "Descrição",
];

describe("parseProductsFile (importação)", () => {
  it("separa linhas válidas de inválidas com mensagens", async () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("P");
    ws.addRow(HEADER);
    ws.addRow(["Fusilli", "IMP-1", "Massas", "pacote", 3.1, 6.5, 50, 20, ""]);
    ws.addRow(["Ruim", "IMP-2", "Massas", "quilo", -1, "abc", 2.5, 1, ""]);
    ws.addRow(["Fração", "IMP-3", "Massas", "pacote", 9, 20, 3.5, 2, ""]);

    const preview = await parseProductsFile(await toBuffer(wb), "xlsx");

    expect(preview.summary.total).toBe(3);
    expect(preview.summary.valid).toBe(1);
    expect(preview.summary.invalid).toBe(2);

    const fraction = preview.rows.find((r) => r.sku === "IMP-3");
    expect(fraction?.valid).toBe(false);
    expect(fraction?.errors.join(" ")).toMatch(/inteira/i);
  });

  it("ignora linhas totalmente vazias", async () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("P");
    ws.addRow(HEADER);
    ws.addRow(["Penne", "IMP-9", "Massas", "pacote", 3, 6, 10, 5, ""]);
    ws.addRow([]); // linha vazia

    const preview = await parseProductsFile(await toBuffer(wb), "xlsx");
    expect(preview.summary.total).toBe(1);
  });

  it("faz round-trip com o arquivo exportado", async () => {
    const dto: ProductDTO = {
      id: "1",
      name: "Espaguete",
      sku: "SKU-1",
      description: null,
      category: "Massas",
      unit: "pacote",
      costPrice: 3.2,
      salePrice: 6.9,
      quantity: 100,
      minQuantity: 40,
      lowStock: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const buffer = await buildProductsWorkbook([dto]);
    const preview = await parseProductsFile(buffer, "xlsx");

    expect(preview.summary.valid).toBe(1);
    expect(preview.summary.invalid).toBe(0);
  });

  it("rejeita planilha com cabeçalho desconhecido", async () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("P");
    ws.addRow(["foo", "bar"]);
    ws.addRow(["a", "b"]);

    await expect(
      parseProductsFile(await toBuffer(wb), "xlsx"),
    ).rejects.toThrow();
  });
});
