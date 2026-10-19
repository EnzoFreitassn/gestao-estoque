import { auth } from "@/lib/auth";

export type FieldErrors = Record<string, string[] | undefined>;

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: FieldErrors };

export function ok<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}

export function fail(error: string, fieldErrors?: FieldErrors): ActionResult<never> {
  return { ok: false, error, fieldErrors };
}

/** Garante que há sessão. Lança se não houver (nunca deveria, por causa do middleware). */
export async function requireUser() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Não autenticado.");
  }
  return session.user;
}

/** Verifica se o usuário autenticado é OWNER. Retorna o usuário ou null. */
export async function getOwnerOrNull() {
  const user = await requireUser();
  return user.role === "OWNER" ? user : null;
}
