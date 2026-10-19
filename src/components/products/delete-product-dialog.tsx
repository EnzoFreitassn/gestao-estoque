"use client";

import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import type { ProductDTO } from "@/types/product";
import { useDeleteProduct } from "@/hooks/use-product-mutations";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DeleteProductDialogProps = {
  product: ProductDTO | null;
  onOpenChange: (open: boolean) => void;
};

export function DeleteProductDialog({
  product,
  onOpenChange,
}: DeleteProductDialogProps) {
  const deleteProduct = useDeleteProduct();

  async function handleConfirm() {
    if (!product) return;
    try {
      const result = await deleteProduct.mutateAsync(product.id);
      if (result.ok) {
        toast.success("Produto excluído.");
        onOpenChange(false);
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Erro ao excluir. Tente novamente.");
    }
  }

  return (
    <AlertDialog
      open={Boolean(product)}
      onOpenChange={(open) => !open && onOpenChange(false)}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir produto</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir{" "}
            <span className="font-medium text-foreground">
              {product?.name}
            </span>
            ? Essa ação não pode ser desfeita e removerá também o histórico de
            movimentações deste produto.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteProduct.isPending}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(event) => {
              event.preventDefault();
              handleConfirm();
            }}
            disabled={deleteProduct.isPending}
            className={cn(
              buttonVariants({ variant: "destructive" }),
              "gap-2",
            )}
          >
            {deleteProduct.isPending && (
              <Loader2 className="size-4 animate-spin" />
            )}
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
