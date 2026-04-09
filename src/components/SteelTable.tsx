import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Download, Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Tesseract from "tesseract.js";
import ExportDialog from "./ExportDialog";

export interface SteelRow {
  id: string;
  n: number;
  bitola: string;
  comp: number;
  q: number;
}

const BITOLAS = ["5.0", "6.3", "8.0", "10.0", "12.5", "16.0", "20.0", "25.0", "32.0"];

const SteelTable = () => {
  const [rows, setRows] = useState<SteelRow[]>([
    { id: crypto.randomUUID(), n: 1, bitola: "10.0", comp: 0, q: 0 },
  ]);
  const [image, setImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      { id: crypto.randomUUID(), n: prev.length + 1, bitola: "10.0", comp: 0, q: 0 },
    ]);
  };

  const removeRow = (id: string) => {
    setRows((prev) => {
      const filtered = prev.filter((r) => r.id !== id);
      return filtered.map((r, i) => ({ ...r, n: i + 1 }));
    });
  };

  const updateRow = (id: string, field: keyof SteelRow, value: string | number) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  const getTotal = (row: SteelRow) => +(row.comp * row.q).toFixed(2);

  const summary = rows.reduce<Record<string, { totalMeters: number; totalKg: number }>>(
    (acc, row) => {
      const key = row.bitola;
      const meters = getTotal(row);
      const weightPerMeter = getWeightPerMeter(parseFloat(key));
      if (!acc[key]) acc[key] = { totalMeters: 0, totalKg: 0 };
      acc[key].totalMeters += meters;
      acc[key].totalKg += meters * weightPerMeter;
      return acc;
    },
    {}
  );

  const handleImageCapture = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setImage(ev.target?.result as string);
      reader.readAsDataURL(file);
      toast.success("Imagem carregada com sucesso!");
    }
  };

  const handleExport = (type: "table" | "summary") => {
    if (type === "summary") {
      exportSummaryAsPng();
    } else {
      setExportType("table");
      setShowExportDialog(true);
    }
  };

  const exportSummaryAsPng = async () => {
    const { toPng } = await import("html-to-image");
    if (!summaryRef.current) return;
    try {
      const dataUrl = await toPng(summaryRef.current, { backgroundColor: "#ffffff", pixelRatio: 2 });
      const link = document.createElement("a");
      link.download = "resumo-bitola.png";
      link.href = dataUrl;
      link.click();
      toast.success("Resumo exportado como PNG!");
    } catch {
      toast.error("Erro ao exportar resumo.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 items-center">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileChange}
        />
        <Button variant="outline" onClick={handleImageCapture}>
          <Camera className="h-4 w-4 mr-2" />
          Tirar Foto / Galeria
        </Button>
        {image && (
          <img src={image} alt="Captura" className="h-16 w-16 rounded-md object-cover border border-border" />
        )}
      </div>

      <div ref={tableRef}>
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-primary/5">
                <TableHead className="w-14 text-center font-semibold">N</TableHead>
                <TableHead className="font-semibold">Bitola (mm)</TableHead>
                <TableHead className="font-semibold">COMP (m)</TableHead>
                <TableHead className="font-semibold">Q</TableHead>
                <TableHead className="font-semibold">Total (m)</TableHead>
                <TableHead className="w-14" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="text-center font-medium text-muted-foreground">{row.n}</TableCell>
                  <TableCell>
                    <Select value={row.bitola} onValueChange={(v) => updateRow(row.id, "bitola", v)}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {BITOLAS.map((b) => (
                          <SelectItem key={b} value={b}>{b}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={row.comp || ""}
                      onChange={(e) => updateRow(row.id, "comp", parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step="1"
                      min="0"
                      value={row.q || ""}
                      onChange={(e) => updateRow(row.id, "q", parseInt(e.target.value) || 0)}
                      placeholder="0"
                    />
                  </TableCell>
                  <TableCell className="font-medium">{getTotal(row)}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => removeRow(row.id)} className="text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button onClick={addRow} variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Linha
        </Button>
        <Button variant="outline" onClick={() => handleExport("table")}>
          <Download className="h-4 w-4 mr-2" />
          Exportar Tabela (PNG)
        </Button>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-foreground mb-3">Resumo por Bitola</h2>
        <div ref={summaryRef}>
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-primary/5">
                  <TableHead className="font-semibold">Bitola (mm)</TableHead>
                  <TableHead className="font-semibold">Total (m)</TableHead>
                  <TableHead className="font-semibold">Peso (kg)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(summary)
                  .sort(([a], [b]) => parseFloat(a) - parseFloat(b))
                  .map(([bitola, data]) => (
                    <TableRow key={bitola}>
                      <TableCell className="font-medium">{bitola}</TableCell>
                      <TableCell>{data.totalMeters.toFixed(2)}</TableCell>
                      <TableCell>{data.totalKg.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                {Object.keys(summary).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-4">
                      Nenhum dado inserido
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
        <div className="mt-3">
          <Button variant="outline" onClick={() => handleExport("summary")}>
            <Download className="h-4 w-4 mr-2" />
            Exportar Resumo (PNG)
          </Button>
        </div>
      </div>

      <ExportDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        rows={rows}
      />
    </div>
  );
};

function getWeightPerMeter(bitola: number): number {
  const weights: Record<number, number> = {
    5.0: 0.154,
    6.3: 0.245,
    8.0: 0.395,
    10.0: 0.617,
    12.5: 0.963,
    16.0: 1.578,
    20.0: 2.466,
    25.0: 3.853,
    32.0: 6.313,
  };
  return weights[bitola] || 0;
}

export default SteelTable;
