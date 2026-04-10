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
  const exportRef = useRef<HTMLDivElement>(null);

  const colCount = parseInt(columns);
  const rowsPerCol = Math.ceil(rows.length / colCount);

  const chunks: SteelRow[][] = [];
  for (let i = 0; i < colCount; i++) {
    chunks.push(rows.slice(i * rowsPerCol, (i + 1) * rowsPerCol));
  }

  // Generate column options based on row count
  const columnOptions = [1, 2, 3, 4].filter((n) => n <= rows.length || n === 1);

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

  const getColLabel = (n: number) => {
    if (n === 1) return "1 Coluna (Vertical)";
    const approx = Math.ceil(rows.length / n);
    return `${n} Colunas (aprox. ${approx} linhas cada)`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Exportar Tabela de Entrada</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Em quantas colunas você deseja dividir a tabela?</Label>
            <Select value={columns} onValueChange={setColumns}>
              <SelectTrigger className="w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {columnOptions.map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {getColLabel(n)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="border border-border rounded-lg p-4 bg-card overflow-auto">
            <div ref={exportRef} style={{ padding: "16px", backgroundColor: "#ffffff" }}>
              <h3 style={{
                fontSize: "18px",
                fontWeight: 700,
                marginBottom: "16px",
                color: "#1e3a5f",
                fontFamily: "Inter, sans-serif",
                textAlign: "center",
              }}>
                Tabela de Entrada — Grilo Engenharia
              </h3>
              <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", justifyContent: "center" }}>
                {chunks.map((chunk, ci) => (
                  <table
                    key={ci}
                    style={{
                      borderCollapse: "collapse",
                      fontSize: "13px",
                      fontFamily: "Inter, sans-serif",
                      minWidth: "200px",
                      flex: colCount > 1 ? "1" : undefined,
                      maxWidth: colCount === 1 ? "400px" : undefined,
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
          <Button onClick={handleExport}>Confirmar Exportação</Button>
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
