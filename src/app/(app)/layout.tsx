import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { AppShell } from "@/components/layout/app-shell";

// Grupo de rotas protegidas. O middleware já bloqueia não autenticados;
// aqui garantimos a sessão no servidor e passamos o usuário para o shell.
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return <AppShell user={session.user}>{children}</AppShell>;
}
