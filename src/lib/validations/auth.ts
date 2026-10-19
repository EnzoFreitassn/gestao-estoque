import { z } from "zod";

// Schema compartilhado entre client (form de login) e servidor (authorize).
export const loginSchema = z.object({
  email: z
    .string({ required_error: "Informe o email." })
    .min(1, "Informe o email.")
    .email("Email inválido."),
  password: z
    .string({ required_error: "Informe a senha." })
    .min(1, "Informe a senha."),
});

export type LoginInput = z.infer<typeof loginSchema>;
