import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import type { SteelRow } from "./SteelTable";

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rows: SteelRow[];
}

const ExportDialog = ({ open, onOpenChange, rows }: ExportDialogProps) => {
  const [columns, setColumns] = useState("1");
  const [layout, setLayout] = useState<"side" | "stack">("side");
  const exportRef = useRef<HTMLDivElement>(null);

  const colCount = parseInt(columns);
  const rowsPerCol = Math.ceil(rows.length / colCount);

  const chunks: SteelRow[][] = [];
  for (let i = 0; i < colCount; i++) {
    chunks.push(rows.slice(i * rowsPerCol, (i + 1) * rowsPerCol));
  }

  const handleExport = async () => {
    const { toPng } = await import("html-to-image");
    if (!exportRef.current) return;
    try {
      const dataUrl = await toPng(exportRef.current, {
        backgroundColor: "#ffffff",
        pixelRatio: 2,
      });
      const link = document.createElement("a");
      link.download = "tabela-entrada.png";
      link.href = dataUrl;
      link.click();
      toast.success("Tabela exportada como PNG!");
      onOpenChange(false);
    } catch {
      toast.error("Erro ao exportar tabela.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Exportar Tabela de Entrada</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2">
              <Label>Dividir em quantas colunas?</Label>
              <Select value={columns} onValueChange={setColumns}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n} {n === 1 ? "coluna" : "colunas"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {colCount > 1 && (
              <div className="space-y-2">
                <Label>Disposição</Label>
                <Select value={layout} onValueChange={(v) => setLayout(v as "side" | "stack")}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="side">Lado a lado</SelectItem>
                    <SelectItem value="stack">Uma abaixo da outra</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="border border-border rounded-lg p-4 bg-card overflow-auto">
            <div ref={exportRef} style={{ padding: "16px", backgroundColor: "#ffffff" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "12px", color: "#1e3a5f", fontFamily: "Inter, sans-serif" }}>
                Tabela de Entrada — Grilo Engenharia
              </h3>
              <div
                style={{
                  display: layout === "side" ? "flex" : "block",
                  gap: "16px",
                  flexWrap: "wrap",
                }}
              >
                {chunks.map((chunk, ci) => (
                  <table
                    key={ci}
                    style={{
                      borderCollapse: "collapse",
                      fontSize: "13px",
                      fontFamily: "Inter, sans-serif",
                      marginBottom: layout === "stack" ? "16px" : "0",
                      flex: layout === "side" ? "1" : undefined,
                      minWidth: "200px",
                    }}
                  >
                    <thead>
                      <tr style={{ backgroundColor: "#e8f0fe" }}>
                        <th style={thStyle}>N</th>
                        <th style={thStyle}>Bitola</th>
                        <th style={thStyle}>COMP</th>
                        <th style={thStyle}>Q</th>
                      </tr>
                    </thead>
                    <tbody>
                      {chunk.map((row) => (
                        <tr key={row.id}>
                          <td style={tdStyle}>{row.n}</td>
                          <td style={tdStyle}>{row.bitola}</td>
                          <td style={tdStyle}>{row.comp}</td>
                          <td style={tdStyle}>{row.q}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ))}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleExport}>Exportar PNG</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const thStyle: React.CSSProperties = {
  border: "1px solid #d0d5dd",
  padding: "6px 12px",
  textAlign: "left",
  fontWeight: 600,
  color: "#1e3a5f",
};

const tdStyle: React.CSSProperties = {
  border: "1px solid #d0d5dd",
  padding: "6px 12px",
  color: "#333",
};

export default ExportDialog;
