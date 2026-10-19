import type { ProductInput } from "@/lib/validations/product";

export type ImportPreviewRow = {
  index: number;
  name: string;
  sku: string;
  valid: boolean;
  errors: string[];
  data?: ProductInput;
};

export type ImportPreview = {
  rows: ImportPreviewRow[];
  summary: { total: number; valid: number; invalid: number };
};
