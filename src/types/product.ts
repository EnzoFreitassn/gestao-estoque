// DTO serializável (Decimal -> number, Date -> ISO string) para enviar ao client.
export type ProductDTO = {
  id: string;
  name: string;
  sku: string;
  description: string | null;
  category: string;
  unit: string;
  costPrice: number;
  salePrice: number;
  quantity: number;
  minQuantity: number;
  /** quantity <= minQuantity (derivado, conveniência para a UI). */
  lowStock: boolean;
  createdAt: string;
  updatedAt: string;
};
