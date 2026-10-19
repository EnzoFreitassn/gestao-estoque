import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type StatCardProps = {
  title: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  accent?: "default" | "warning";
  /** Quando presente, o card inteiro vira um link. */
  href?: string;
};

export function StatCard({
  title,
  value,
  hint,
  icon: Icon,
  accent = "default",
  href,
}: StatCardProps) {
  const card = (
    <Card
      className={cn(
        href &&
          "transition-colors hover:border-foreground/20 hover:bg-accent/40",
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon
          className={cn(
            "size-4",
            accent === "warning" ? "text-amber-500" : "text-muted-foreground",
          )}
        />
      </CardHeader>
      <CardContent>
        <div
          className={cn(
            "font-display text-2xl font-semibold tracking-tight tabular-nums",
            accent === "warning" && "text-amber-600 dark:text-amber-400",
          )}
        >
          {value}
        </div>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="block focus-visible:outline-none">
        {card}
      </Link>
    );
  }

  return card;
}
