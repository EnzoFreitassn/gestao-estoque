import { redirect } from "next/navigation";

// A raiz apenas encaminha para o dashboard; o middleware cuida da autenticação
// (manda para /login se não houver sessão).
export default function RootPage() {
  redirect("/dashboard");
}
