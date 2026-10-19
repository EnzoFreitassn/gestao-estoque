import NextAuth from "next-auth";

import { authConfig } from "@/lib/auth.config";

// Usa SOMENTE a config edge-safe (sem Prisma/bcrypt) para proteger rotas.
// A regra de acesso vive no callback `authorized` de auth.config.ts.
export const { auth: middleware } = NextAuth(authConfig);

export default middleware((req) => {
  // O callback `authorized` já decidiu o acesso; aqui apenas deixamos seguir.
  return;
});

export const config = {
  // Protege páginas. Rotas /api se protegem sozinhas (respondem 401 em JSON),
  // então ficam de fora para não receberem redirect HTML.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
