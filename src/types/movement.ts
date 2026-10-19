export type MovementType = "IN" | "OUT";

export type MovementDTO = {
  id: string;
  type: MovementType;
  quantity: number;
  reason: string | null;
  createdAt: string;
  product: {
    id: string;
    name: string;
    sku: string;
    unit: string;
  };
  user: {
    id: string;
    name: string;
  };
};
