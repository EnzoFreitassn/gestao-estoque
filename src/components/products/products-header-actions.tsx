"use client";

import * as React from "react";
import { Download, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ImportDialog } from "@/components/products/import-dialog";

export function ProductsHeaderActions() {
  const [importOpen, setImportOpen] = React.useState(false);

  return (
    <>
      <Button variant="outline" onClick={() => setImportOpen(true)}>
        <Upload className="size-4" />
        Importar
      </Button>
      <Button variant="outline" asChild>
        <a href="/api/products/export">
          <Download className="size-4" />
          Exportar
        </a>
      </Button>
      <ImportDialog open={importOpen} onOpenChange={setImportOpen} />
    </>
  );
}
