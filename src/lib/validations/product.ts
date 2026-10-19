import { z } from "zod";

// Unidades suportadas. As "inteiras" não aceitam fração na quantidade.
export const UNITS = ["kg", "g", "litro", "un", "pacote", "caixa"] as const;
export type Unit = (typeof UNITS)[number];

export const INTEGER_UNITS: Unit[] = ["un", "pacote", "caixa"];

const price = z.coerce
  .number({ invalid_type_error: "Informe um valor numérico." })
  .min(0, "Não pode ser negativo.")
  .max(99_999_999.99, "Valor acima do limite.");

const amount = z.coerce
  .number({ invalid_type_error: "Informe um valor numérico." })
  .min(0, "Não pode ser negativo.")
  .max(999_999_999.999, "Valor acima do limite.");

export const productSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Informe o nome.")
      .max(120, "Máximo de 120 caracteres."),
    sku: z
      .string()
      .trim()
      .min(1, "Informe o SKU.")
      .max(40, "Máximo de 40 caracteres.")
      .regex(
        /^[A-Za-z0-9._-]+$/,
        "Use apenas letras, números, ponto, hífen ou underscore.",
      ),
    description: z
      .string()
      .trim()
      .max(500, "Máximo de 500 caracteres.")
      .optional()
      .or(z.literal(""))
      .transform((value) => (value ? value : undefined)),
    category: z
      .string()
      .trim()
      .min(1, "Informe a categoria.")
      .max(60, "Máximo de 60 caracteres."),
    unit: z.enum(UNITS, { required_error: "Selecione a unidade." }),
    costPrice: price,
    salePrice: price,
    quantity: amount,
    minQuantity: amount,
  })
  .superRefine((data, ctx) => {
    // Regra de negócio: unidade inteira (un/pacote/caixa) não aceita fração.
    if (INTEGER_UNITS.includes(data.unit)) {
      if (!Number.isInteger(data.quantity)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["quantity"],
          message: `A unidade "${data.unit}" exige quantidade inteira.`,
        });
      }
      if (!Number.isInteger(data.minQuantity)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["minQuantity"],
          message: `A unidade "${data.unit}" exige quantidade inteira.`,
        });
      }
    }
  });

export type ProductInput = z.infer<typeof productSchema>;
