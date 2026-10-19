"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  createProductAction,
  deleteProductAction,
  importProductsAction,
  updateProductAction,
} from "@/lib/actions/products";
import type { ProductInput } from "@/lib/validations/product";
import { productsQueryKey } from "@/hooks/use-products";

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: ProductInput) => createProductAction(values),
    onSuccess: (result) => {
      if (result.ok) {
        queryClient.invalidateQueries({ queryKey: productsQueryKey });
      }
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: ProductInput }) =>
      updateProductAction(id, values),
    onSuccess: (result) => {
      if (result.ok) {
        queryClient.invalidateQueries({ queryKey: productsQueryKey });
      }
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteProductAction(id),
    onSuccess: (result) => {
      if (result.ok) {
        queryClient.invalidateQueries({ queryKey: productsQueryKey });
      }
    },
  });
}

export function useImportProducts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (rows: unknown[]) => importProductsAction(rows),
    onSuccess: (result) => {
      if (result.ok && result.data.created > 0) {
        queryClient.invalidateQueries({ queryKey: productsQueryKey });
      }
    },
  });
}
