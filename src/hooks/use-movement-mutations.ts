"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createMovementAction } from "@/lib/actions/movements";
import type { MovementInput } from "@/lib/validations/movement";
import { movementsQueryKey } from "@/hooks/use-movements";
import { productsQueryKey } from "@/hooks/use-products";

export function useCreateMovement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: MovementInput) => createMovementAction(values),
    onSuccess: (result) => {
      if (result.ok) {
        // A movimentação altera a quantidade do produto — invalida ambos.
        queryClient.invalidateQueries({ queryKey: movementsQueryKey });
        queryClient.invalidateQueries({ queryKey: productsQueryKey });
      }
    },
  });
}
