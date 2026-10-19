import { Wheat } from "lucide-react";

import { cn } from "@/lib/utils";

type BrandProps = {
  /** Esconde o nome, mostrando só o símbolo (sidebar recolhida). */
  iconOnly?: boolean;
  /** Tamanho do símbolo. */
  size?: "sm" | "md";
  className?: string;
};

// Marca do produto: "Farina" (farinha — a base de toda massa).
export function Brand({ iconOnly, size = "md", className }: BrandProps) {
  const box = size === "sm" ? "size-7" : "size-8";
  const icon = size === "sm" ? "size-4" : "size-[18px]";

  return (
    <span className={cn("flex items-center gap-2", className)}>
      <span
        className={cn(
          "flex items-center justify-center rounded-md bg-brand text-brand-foreground shadow-sm",
          box,
        )}
      >
        <Wheat className={icon} />
      </span>
      {!iconOnly && (
        <span className="flex flex-col leading-none">
          <span className="font-display text-base font-semibold tracking-tight">
            Farina
          </span>
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Estoque
          </span>
        </span>
      )}
    </span>
  );
}
