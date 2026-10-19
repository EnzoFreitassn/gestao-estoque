"use client";

import { useQuery } from "@tanstack/react-query";

import type { ProductDTO } from "@/types/product";

export const productsQueryKey = ["products"] as const;

async function fetchProducts(): Promise<ProductDTO[]> {
  const response = await fetch("/api/products");
  if (!response.ok) {
    throw new Error("Não foi possível carregar os produtos.");
  }
  return response.json();
}

export function useProducts() {
  return useQuery({
    queryKey: productsQueryKey,
    queryFn: fetchProducts,
  });
}
