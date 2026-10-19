"use client";

import { useQuery } from "@tanstack/react-query";

import type { MovementDTO } from "@/types/movement";

export const movementsQueryKey = ["movements"] as const;

async function fetchMovements(): Promise<MovementDTO[]> {
  const response = await fetch("/api/movements");
  if (!response.ok) {
    throw new Error("Não foi possível carregar as movimentações.");
  }
  return response.json();
}

export function useMovements() {
  return useQuery({
    queryKey: movementsQueryKey,
    queryFn: fetchMovements,
  });
}
