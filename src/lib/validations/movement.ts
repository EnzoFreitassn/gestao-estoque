import { z } from "zod";

export const movementSchema = z.object({
  productId: z.string().min(1, "Selecione um produto."),
  type: z.enum(["IN", "OUT"], { required_error: "Selecione o tipo." }),
  quantity: z.coerce
    .number({ invalid_type_error: "Informe um valor numérico." })
    .positive("A quantidade deve ser maior que zero.")
    .max(999_999_999.999, "Valor acima do limite."),
  reason: z
    .string()
    .trim()
    .max(200, "Máximo de 200 caracteres.")
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : undefined)),
});

export type MovementInput = z.infer<typeof movementSchema>;

// Filtros do histórico (usados na API e nos hooks).
export const movementFilterSchema = z.object({
  productId: z.string().optional(),
  type: z.enum(["IN", "OUT"]).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

export type MovementFilter = z.infer<typeof movementFilterSchema>;
