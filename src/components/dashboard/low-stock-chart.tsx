"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { LowStockItem } from "@/types/dashboard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const QTY_COLOR = "#6366f1"; // indigo-500
const MIN_COLOR = "#f59e0b"; // amber-500

const tooltipStyle = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  color: "var(--popover-foreground)",
  fontSize: 12,
};

function shorten(name: string): string {
  return name.length > 18 ? `${name.slice(0, 17)}…` : name;
}

export function LowStockChart({ data }: { data: LowStockItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Produtos com estoque mais baixo</CardTitle>
        <CardDescription>
          Quantidade atual comparada ao mínimo definido.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
            Nenhum produto cadastrado.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 4, right: 8, left: 8, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--border)"
                horizontal={false}
              />
              <XAxis
                type="number"
                allowDecimals={false}
                tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={120}
                tickFormatter={shorten}
                tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                cursor={{ fill: "var(--muted)", opacity: 0.4 }}
              />
              <Legend
                wrapperStyle={{ fontSize: 12 }}
                formatter={(value) =>
                  value === "quantity" ? "Estoque atual" : "Mínimo"
                }
              />
              <Bar
                dataKey="quantity"
                fill={QTY_COLOR}
                radius={[0, 4, 4, 0]}
                maxBarSize={18}
              />
              <Bar
                dataKey="minQuantity"
                fill={MIN_COLOR}
                radius={[0, 4, 4, 0]}
                maxBarSize={18}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
