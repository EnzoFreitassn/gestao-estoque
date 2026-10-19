import "server-only";

import { Readable } from "node:stream";
import ExcelJS from "exceljs";

import { DomainError } from "@/lib/errors";
import { productSchema } from "@/lib/validations/product";
import type { ProductDTO } from "@/types/product";
import type { MovementDTO } from "@/types/movement";
import type { ImportPreview, ImportPreviewRow } from "@/types/import";
import { formatDateTime } from "@/lib/format";

// ---------------------------------------------------------------------------
// Exportação
// ---------------------------------------------------------------------------

const PRODUCT_COLUMNS = [
  { header: "Nome", key: "name", width: 32 },
  { header: "SKU", key: "sku", width: 18 },
  { header: "Categoria", key: "category", width: 20 },
  { header: "Unidade", key: "unit", width: 12 },
  { header: "Preço de custo", key: "costPrice", width: 16 },
  { header: "Preço de venda", key: "salePrice", width: 16 },
  { header: "Quantidade", key: "quantity", width: 14 },
  { header: "Quantidade mínima", key: "minQuantity", width: 18 },
  { header: "Descrição", key: "description", width: 40 },
] as const;

function styleHeader(worksheet: ExcelJS.Worksheet) {
  const header = worksheet.getRow(1);
  header.font = { bold: true };
  header.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFEFEFEF" },
    };
  });
}

async function toBuffer(workbook: ExcelJS.Workbook): Promise<Buffer> {
  const data = await workbook.xlsx.writeBuffer();
  return Buffer.from(data);
}

export async function buildProductsWorkbook(
  products: ProductDTO[],
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet("Produtos");
  ws.columns = PRODUCT_COLUMNS.map((c) => ({ header: c.header, key: c.key, width: c.width }));

  for (const p of products) {
    ws.addRow({
      name: p.name,
      sku: p.sku,
      category: p.category,
      unit: p.unit,
      costPrice: p.costPrice,
      salePrice: p.salePrice,
      quantity: p.quantity,
      minQuantity: p.minQuantity,
      description: p.description ?? "",
    });
  }

  ws.getColumn("costPrice").numFmt = "#,##0.00";
  ws.getColumn("salePrice").numFmt = "#,##0.00";
  styleHeader(ws);
  return toBuffer(workbook);
}

export async function buildTemplateWorkbook(): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet("Modelo");
  ws.columns = PRODUCT_COLUMNS.map((c) => ({ header: c.header, key: c.key, width: c.width }));

  // Linha de exemplo para orientar o preenchimento.
  ws.addRow({
    name: "Espaguete 500g",
    sku: "MAS-ESP-500",
    category: "Massas secas",
    unit: "pacote",
    costPrice: 3.2,
    salePrice: 6.9,
    quantity: 100,
    minQuantity: 40,
    description: "Exemplo — pode apagar esta linha.",
  });

  styleHeader(ws);
  return toBuffer(workbook);
}

export async function buildMovementsWorkbook(
  movements: MovementDTO[],
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet("Movimentações");
  ws.columns = [
    { header: "Data", key: "date", width: 18 },
    { header: "Produto", key: "product", width: 32 },
    { header: "SKU", key: "sku", width: 18 },
    { header: "Tipo", key: "type", width: 10 },
    { header: "Quantidade", key: "quantity", width: 14 },
    { header: "Unidade", key: "unit", width: 10 },
    { header: "Motivo", key: "reason", width: 30 },
    { header: "Usuário", key: "user", width: 22 },
  ];

  for (const m of movements) {
    ws.addRow({
      date: formatDateTime(m.createdAt),
      product: m.product.name,
      sku: m.product.sku,
      type: m.type === "IN" ? "Entrada" : "Saída",
      quantity: m.quantity,
      unit: m.product.unit,
      reason: m.reason ?? "",
      user: m.user.name,
    });
  }

  styleHeader(ws);
  return toBuffer(workbook);
}

// ---------------------------------------------------------------------------
// Importação (parsing + validação linha a linha)
// ---------------------------------------------------------------------------

type RawField =
  | "name"
  | "sku"
  | "category"
  | "unit"
  | "costPrice"
  | "salePrice"
  | "quantity"
  | "minQuantity"
  | "description";

const NUMERIC_FIELDS: RawField[] = [
  "costPrice",
  "salePrice",
  "quantity",
  "minQuantity",
];

const FIELD_LABELS: Record<RawField, string> = {
  name: "Nome",
  sku: "SKU",
  category: "Categoria",
  unit: "Unidade",
  costPrice: "Preço de custo",
  salePrice: "Preço de venda",
  quantity: "Quantidade",
  minQuantity: "Quantidade mínima",
  description: "Descrição",
};

function normalizeHeader(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

const HEADER_MAP: Record<string, RawField> = {
  nome: "name",
  sku: "sku",
  categoria: "category",
  unidade: "unit",
  "preco de custo": "costPrice",
  "preco custo": "costPrice",
  custo: "costPrice",
  "preco de venda": "salePrice",
  "preco venda": "salePrice",
  venda: "salePrice",
  quantidade: "quantity",
  "quantidade atual": "quantity",
  estoque: "quantity",
  "quantidade minima": "minQuantity",
  "estoque minimo": "minQuantity",
  minimo: "minQuantity",
  descricao: "description",
};

function cellValue(cell: ExcelJS.Cell): unknown {
  const value = cell.value;
  if (value && typeof value === "object") {
    if ("result" in value) return (value as { result: unknown }).result;
    if ("text" in value) return (value as { text: unknown }).text;
  }
  return value;
}

export async function parseProductsFile(
  buffer: Buffer,
  extension: string,
): Promise<ImportPreview> {
  const workbook = new ExcelJS.Workbook();

  if (extension === "csv") {
    await workbook.csv.read(Readable.from(buffer));
  } else {
    // Cast por divergência entre o tipo Buffer do @types/node e o esperado
    // pelo ExcelJS (estruturalmente equivalentes).
    await workbook.xlsx.load(buffer as unknown as Parameters<typeof workbook.xlsx.load>[0]);
  }

  const ws = workbook.worksheets[0];
  if (!ws) {
    throw new DomainError("Arquivo sem planilhas.");
  }

  // Mapeia colunas pelo cabeçalho (linha 1).
  const colToField = new Map<number, RawField>();
  ws.getRow(1).eachCell((cell, col) => {
    const field = HEADER_MAP[normalizeHeader(String(cellValue(cell) ?? ""))];
    if (field) colToField.set(col, field);
  });

  if (colToField.size === 0) {
    throw new DomainError(
      "Cabeçalho não reconhecido. Baixe o modelo e use os mesmos títulos de coluna.",
    );
  }

  const rows: ImportPreviewRow[] = [];

  ws.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;

    const raw: Record<string, unknown> = {};
    let hasValue = false;

    for (const [col, field] of colToField) {
      const value = cellValue(row.getCell(col));
      if (value === null || value === undefined || value === "") continue;
      hasValue = true;
      raw[field] = NUMERIC_FIELDS.includes(field)
        ? value
        : String(value).trim();
    }

    if (!hasValue) return; // ignora linhas totalmente vazias

    const parsed = productSchema.safeParse(raw);
    const name = String(raw.name ?? "");
    const sku = String(raw.sku ?? "");

    if (parsed.success) {
      rows.push({ index: rowNumber, name, sku, valid: true, errors: [], data: parsed.data });
    } else {
      const flat = parsed.error.flatten();
      const errors: string[] = [...flat.formErrors];
      for (const [field, messages] of Object.entries(flat.fieldErrors)) {
        if (messages?.[0]) {
          errors.push(`${FIELD_LABELS[field as RawField] ?? field}: ${messages[0]}`);
        }
      }
      rows.push({ index: rowNumber, name, sku, valid: false, errors });
    }
  });

  const valid = rows.filter((r) => r.valid).length;
  return {
    rows,
    summary: { total: rows.length, valid, invalid: rows.length - valid },
  };
}
