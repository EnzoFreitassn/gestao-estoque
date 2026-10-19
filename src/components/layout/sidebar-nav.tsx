"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@prisma/client";

import { cn } from "@/lib/utils";
import { navItems } from "@/components/layout/nav";
import { useProducts } from "@/hooks/use-products";

type SidebarNavProps = {
  role: Role;
  /** Quando true, mostra só ícones (sidebar colapsada no desktop). */
  collapsed?: boolean;
  /** Chamado ao clicar num link (usado para fechar o sheet no mobile). */
  onNavigate?: () => void;
};

export function SidebarNav({ role, collapsed, onNavigate }: SidebarNavProps) {
  const pathname = usePathname();
  const { data: products } = useProducts();
  const lowStockCount =
    products?.filter((product) => product.lowStock).length ?? 0;

  const visibleItems = navItems.filter(
    (item) => !item.roles || item.roles.includes(role),
  );

  return (
    <nav className="flex flex-col gap-1 px-2">
      {visibleItems.map((item) => {
        const isActive =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        const showBadge = item.href === "/alerts" && lowStockCount > 0;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={isActive ? "page" : undefined}
            title={collapsed ? item.title : undefined}
            className={cn(
              "relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
              isActive
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              collapsed && "justify-center px-0",
            )}
          >
            <span className="relative shrink-0">
              <Icon className={cn("size-4", isActive && "text-brand")} />
              {showBadge && collapsed && (
                <span className="absolute -right-1 -top-1 size-2 rounded-full bg-amber-500" />
              )}
            </span>
            <span className={cn(collapsed && "sr-only")}>{item.title}</span>
            {showBadge && !collapsed && (
              <span className="ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 text-xs font-semibold text-white">
                {lowStockCount}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
