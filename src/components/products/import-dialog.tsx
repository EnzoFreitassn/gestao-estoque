"use client";

import * as React from "react";
import {
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Loader2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import type { ImportPreview } from "@/types/import";
import { useImportProducts } from "@/hooks/use-product-mutations";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type ImportDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ImportDialog({ open, onOpenChange }: ImportDialogProps) {
  const [fileName, setFileName] = React.useState<string | null>(null);
  const [isParsing, setIsParsing] = React.useState(false);
  const [preview, setPreview] = React.useState<ImportPreview | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const importProducts = useImportProducts();

  function reset() {
    setFileName(null);
    setPreview(null);
    setIsParsing(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleOpenChange(next: boolean) {
    if (!next) reset();
    onOpenChange(next);
  }

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setPreview(null);
    setIsParsing(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/products/import", {
        method: "POST",
        body: formData,
      });
      const body = await response.json();
      if (!response.ok) {
        toast.error(body.error ?? "Não foi possível ler o arquivo.");
        reset();
        return;
      }
      setPreview(body as ImportPreview);
    } catch {
      toast.error("Erro ao enviar o arquivo.");
      reset();
    } finally {
      setIsParsing(false);
    }
  }

  async function handleConfirm() {
    if (!preview) return;
    const validRows = preview.rows
      .filter((row) => row.valid && row.data)
      .map((row) => row.data);

    try {
      const result = await importProducts.mutateAsync(validRows);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      const { created, skipped } = result.data;
      if (created > 0) {
        toast.success(
          `${created} ${created === 1 ? "produto importado" : "produtos importados"}.` +
            (skipped.length ? ` ${skipped.length} ignorado(s).` : ""),
        );
      } else {
        toast.warning("Nenhum produto importado.");
      }
      handleOpenChange(false);
    } catch {
      toast.error("Erro ao importar. Tente novamente.");
    }
  }

  const validCount = preview?.summary.valid ?? 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importar produtos</DialogTitle>
          <DialogDescription>
            Envie uma planilha (.xlsx ou .csv). Cada linha é validada antes de
            confirmar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              onClick={() => inputRef.current?.click()}
              disabled={isParsing || importProducts.isPending}
            >
              <FileSpreadsheet className="size-4" />
              {fileName ? "Trocar arquivo" : "Escolher arquivo"}
            </Button>
            <Button variant="ghost" asChild>
              <a href="/api/products/import/template">
                <Download className="size-4" />
                Baixar modelo
              </a>
            </Button>
            {fileName && (
              <span className="text-sm text-muted-foreground">{fileName}</span>
            )}
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.csv"
              className="hidden"
              onChange={handleFile}
            />
          </div>

          {isParsing && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Lendo e validando a planilha...
            </div>
          )}

          {preview && (
            <>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{preview.summary.total} linhas</Badge>
                <Badge variant="success">{preview.summary.valid} válidas</Badge>
                {preview.summary.invalid > 0 && (
                  <Badge variant="destructive">
                    {preview.summary.invalid} com erro
                  </Badge>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">Linha</TableHead>
                      <TableHead>Produto</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Situação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.rows.map((row) => (
                      <TableRow key={row.index}>
                        <TableCell className="text-muted-foreground">
                          {row.index}
                        </TableCell>
                        <TableCell className="font-medium">
                          {row.name || "—"}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {row.sku || "—"}
                        </TableCell>
                        <TableCell>
                          {row.valid ? (
                            <span className="inline-flex items-center gap-1 text-sm text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="size-4" />
                              OK
                            </span>
                          ) : (
                            <div className="flex items-start gap-1 text-sm text-destructive">
                              <XCircle className="mt-0.5 size-4 shrink-0" />
                              <span>{row.errors.join(" • ")}</span>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={importProducts.isPending}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!preview || validCount === 0 || importProducts.isPending}
          >
            {importProducts.isPending && (
              <Loader2 className="size-4 animate-spin" />
            )}
            Importar {validCount > 0 ? `${validCount} válidas` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
