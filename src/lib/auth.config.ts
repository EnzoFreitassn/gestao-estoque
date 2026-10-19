import type { NextAuthConfig } from "next-auth";

// Configuração "edge-safe": SEM Prisma/bcrypt aqui. É o que o middleware importa,
// que roda no runtime edge. A lógica pesada (authorize) fica em auth.ts (node).
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  providers: [], // os providers são adicionados em auth.ts
  callbacks: {
    // Protege rotas: tudo exige sessão, exceto a página de login.
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnLogin = nextUrl.pathname === "/login";

      if (isOnLogin) {
        if (isLoggedIn) {
          return Response.redirect(new URL("/dashboard", nextUrl));
        }
        return true;
      }

      return isLoggedIn;
    },
  },
} satisfies NextAuthConfig;
