"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowDownCircle, ArrowUpCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { movementSchema, type MovementInput } from "@/lib/validations/movement";
import { INTEGER_UNITS, type Unit } from "@/lib/validations/product";
import { useProducts } from "@/hooks/use-products";
import { useCreateMovement } from "@/hooks/use-movement-mutations";
import { formatQuantity } from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type MovementFormValues = {
  productId: string;
  type: "IN" | "OUT";
  quantity: number;
  reason?: string;
};

type MovementFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultProductId?: string;
};

export function MovementFormDialog({
  open,
  onOpenChange,
  defaultProductId,
}: MovementFormDialogProps) {
  const { data: products = [] } = useProducts();
  const createMovement = useCreateMovement();

  const form = useForm<MovementFormValues>({
    resolver: zodResolver(movementSchema),
    defaultValues: {
      productId: defaultProductId ?? "",
      type: "IN",
      quantity: 1,
      reason: "",
    },
  });

  React.useEffect(() => {
    if (open) {
      form.reset({
        productId: defaultProductId ?? "",
        type: "IN",
        quantity: 1,
        reason: "",
      });
    }
  }, [open, defaultProductId, form]);

  const selectedProductId = form.watch("productId");
  const selectedType = form.watch("type");
  const selectedProduct = products.find((p) => p.id === selectedProductId);
  const integerOnly = selectedProduct
    ? INTEGER_UNITS.includes(selectedProduct.unit as Unit)
    : false;

  async function onSubmit(values: MovementFormValues) {
    try {
      const result = await createMovement.mutateAsync(values as MovementInput);
      if (result.ok) {
        toast.success(
          values.type === "IN"
            ? "Entrada registrada."
            : "Saída registrada.",
        );
        onOpenChange(false);
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Erro inesperado. Tente novamente.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar movimentação</DialogTitle>
          <DialogDescription>
            Entradas somam e saídas subtraem do estoque do produto.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
            noValidate
          >
            <FormField
              control={form.control}
              name="productId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Produto</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o produto" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} ({product.sku})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedProduct && (
                    <FormDescription>
                      Estoque atual:{" "}
                      {formatQuantity(
                        selectedProduct.quantity,
                        selectedProduct.unit,
                      )}
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo</FormLabel>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant={field.value === "IN" ? "default" : "outline"}
                      onClick={() => field.onChange("IN")}
                      className="justify-start"
                    >
                      <ArrowUpCircle className="size-4" />
                      Entrada
                    </Button>
                    <Button
                      type="button"
                      variant={
                        field.value === "OUT" ? "destructive" : "outline"
                      }
                      onClick={() => field.onChange("OUT")}
                      className="justify-start"
                    >
                      <ArrowDownCircle className="size-4" />
                      Saída
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantidade</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step={integerOnly ? "1" : "0.001"}
                      min="0"
                      inputMode="decimal"
                      {...field}
                    />
                  </FormControl>
                  {selectedType === "OUT" && selectedProduct && (
                    <FormDescription>
                      Não é possível retirar mais do que o estoque disponível.
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Motivo (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={2}
                      placeholder="Ex.: compra de insumos, venda, ajuste de inventário..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={createMovement.isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={createMovement.isPending}>
                {createMovement.isPending && (
                  <Loader2 className="size-4 animate-spin" />
                )}
                Registrar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
