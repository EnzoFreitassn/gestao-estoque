"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  productSchema,
  UNITS,
  INTEGER_UNITS,
  type ProductInput,
  type Unit,
} from "@/lib/validations/product";
import type { ProductDTO } from "@/types/product";
import {
  useCreateProduct,
  useUpdateProduct,
} from "@/hooks/use-product-mutations";
import type { FieldErrors } from "@/lib/actions/helpers";
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

type ProductFormValues = {
  name: string;
  sku: string;
  description?: string;
  category: string;
  unit: Unit;
  costPrice: number;
  salePrice: number;
  quantity: number;
  minQuantity: number;
};

function toFormValues(product?: ProductDTO | null): ProductFormValues {
  if (!product) {
    return {
      name: "",
      sku: "",
      description: "",
      category: "",
      unit: "un",
      costPrice: 0,
      salePrice: 0,
      quantity: 0,
      minQuantity: 0,
    };
  }
  return {
    name: product.name,
    sku: product.sku,
    description: product.description ?? "",
    category: product.category,
    unit: product.unit as Unit,
    costPrice: product.costPrice,
    salePrice: product.salePrice,
    quantity: product.quantity,
    minQuantity: product.minQuantity,
  };
}

type ProductFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Quando presente, o diálogo edita; caso contrário, cria. */
  product?: ProductDTO | null;
};

export function ProductFormDialog({
  open,
  onOpenChange,
  product,
}: ProductFormDialogProps) {
  const isEditing = Boolean(product);
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const isPending = createProduct.isPending || updateProduct.isPending;

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: toFormValues(product),
  });

  // Repreenche o form quando abre (novo) ou troca o produto (edição).
  React.useEffect(() => {
    if (open) {
      form.reset(toFormValues(product));
    }
  }, [open, product, form]);

  function applyFieldErrors(fieldErrors?: FieldErrors) {
    if (!fieldErrors) return;
    for (const [field, messages] of Object.entries(fieldErrors)) {
      if (messages?.[0]) {
        form.setError(field as keyof ProductFormValues, {
          message: messages[0],
        });
      }
    }
  }

  async function onSubmit(values: ProductFormValues) {
    const payload = values as ProductInput;
    try {
      const result = isEditing
        ? await updateProduct.mutateAsync({ id: product!.id, values: payload })
        : await createProduct.mutateAsync(payload);

      if (result.ok) {
        toast.success(
          isEditing ? "Produto atualizado." : "Produto criado com sucesso.",
        );
        onOpenChange(false);
      } else {
        applyFieldErrors(result.fieldErrors);
        toast.error(result.error);
      }
    } catch {
      toast.error("Erro inesperado. Tente novamente.");
    }
  }

  const selectedUnit = form.watch("unit");
  const integerOnly = INTEGER_UNITS.includes(selectedUnit);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar produto" : "Novo produto"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Altere os dados do produto e salve."
              : "Preencha os dados para cadastrar um produto."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
            noValidate
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Espaguete 500g" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SKU</FormLabel>
                    <FormControl>
                      <Input placeholder="MAS-ESP-500" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <FormControl>
                      <Input placeholder="Massas secas" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unidade</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {UNITS.map((unit) => (
                          <SelectItem key={unit} value={unit}>
                            {unit}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="costPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço de custo (R$)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        inputMode="decimal"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="salePrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço de venda (R$)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        inputMode="decimal"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantidade atual</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step={integerOnly ? "1" : "0.001"}
                        min="0"
                        inputMode="decimal"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="minQuantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantidade mínima</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step={integerOnly ? "1" : "0.001"}
                        min="0"
                        inputMode="decimal"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Abaixo disso, o produto entra em alerta.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Descrição (opcional)</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        placeholder="Observações sobre o produto..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="size-4 animate-spin" />}
                {isEditing ? "Salvar alterações" : "Cadastrar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
