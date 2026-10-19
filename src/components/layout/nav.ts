import {
  AlertTriangle,
  ArrowRightLeft,
  FileClock,
  LayoutDashboard,
  Package,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "@prisma/client";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  /** undefined = visível para todos os papéis. */
  roles?: Role[];
};

// Mapa de navegação da aplicação. Itens de fases futuras já aparecem para
// mostrar a arquitetura da informação; cada rota é implementada na sua fase.
export const navItems: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Produtos", href: "/products", icon: Package },
  { title: "Movimentações", href: "/movements", icon: ArrowRightLeft },
  { title: "Estoque baixo", href: "/alerts", icon: AlertTriangle },
  { title: "Auditoria", href: "/audit", icon: FileClock, roles: ["OWNER"] },
];
