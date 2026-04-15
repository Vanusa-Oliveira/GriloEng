import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Download, Camera, Loader2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import ExportDialog from "./ExportDialog";

export interface SteelRow {
  id: string;
  n: number;
  bitola: string;
  comp: number; // stored in centimeters
  q: number;
}

const BITOLAS = ["5.0", "6.3", "8.0", "10.0", "12.5", "16.0", "20.0", "25.0", "32.0"];

const SteelTable = () => {
  const [rows, setRows] = useState<SteelRow[]>([]);
  const [image, setImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  // comp is in cm, convert to meters for total
  const getCompMeters = (compCm: number) => compCm / 100;
  const getTotalMeters = (row: SteelRow) => +(getCompMeters(row.comp) * row.q).toFixed(2);

  const summary = rows.reduce<Record<string, { totalMeters: number; pesoCalculado: number; pesoCompra: number }>>(
    (acc, row) => {
      const key = row.bitola;
      const meters = getTotalMeters(row);
      const weightPerMeter = getWeightPerMeter(parseFloat(key));
      if (!acc[key]) acc[key] = { totalMeters: 0, pesoCalculado: 0, pesoCompra: 0 };
      acc[key].totalMeters += meters;
      acc[key].pesoCalculado += meters * weightPerMeter * 0.9;
      return acc;
    },
    {}
  );

  Object.values(summary).forEach((data) => {
    data.pesoCompra = Math.ceil(data.pesoCalculado / 5) * 5;
  });

  const pesoTotalCompra = Object.values(summary).reduce((sum, d) => sum + d.pesoCompra, 0);

  const handleImageCapture = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const dataUrl = ev.target?.result as string;
        // Clear old data before processing new photo
        setRows([]);
        setImage(dataUrl);
        toast.info("Dados anteriores descartados. Processando nova imagem...");
        setIsProcessing(true);
        try {
          const { data, error } = await supabase.functions.invoke("extract-table", {
            body: { imageBase64: dataUrl },
          });

          if (error) {
            console.error("Edge function error:", error);
            toast.error("Erro ao processar imagem com IA.");
            return;
          }

          if (data?.rows && data.rows.length > 0) {
            // Replace all rows (start from empty)
            setRows(
              data.rows.map((r: any, i: number) => ({
                id: crypto.randomUUID(),
                n: i + 1,
                bitola: r.bitola,
                comp: r.comp, // AI returns in cm
                q: r.q,
              }))
            );
            toast.success(`${data.rows.length} linhas extraídas com IA!`);
          } else {
            toast.info("Nenhum dado de tabela de aço encontrado na imagem.");
          }
        } catch (err) {
          console.error("AI extraction error:", err);
          toast.error("Erro ao processar imagem.");
        } finally {
          setIsProcessing(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExport = (type: "table" | "summary") => {
    if (type === "summary") {
      exportSummaryAsPng();
    } else {
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
          className="hidden"
          onChange={handleFileChange}
        />
        <Button variant="outline" onClick={handleImageCapture} disabled={isProcessing} className="w-full sm:w-auto">
          {isProcessing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Camera className="h-4 w-4 mr-2" />}
          {isProcessing ? "Processando OCR..." : "Tirar Foto / Galeria"}
        </Button>
        {image && (
          <img src={image} alt="Captura" className="h-16 w-16 rounded-md object-cover border border-border" />
        )}
      </div>

      <div>
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-primary/5">
                <TableHead className="w-14 text-center font-semibold">N</TableHead>
                <TableHead className="font-semibold">Bitola (mm)</TableHead>
                <TableHead className="font-semibold">COMP (cm)</TableHead>
                <TableHead className="font-semibold">Q</TableHead>
                <TableHead className="font-semibold">Total (m)</TableHead>
                <TableHead className="w-14" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Nenhuma linha adicionada. Clique em "Adicionar Linha" ou tire uma foto.
                  </TableCell>
                </TableRow>
              )}
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
                      step="1"
                      min="0"
                      value={row.comp || ""}
                      onChange={(e) => updateRow(row.id, "comp", parseFloat(e.target.value) || 0)}
                      placeholder="0"
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
                  <TableCell className="font-medium">{getTotalMeters(row)}</TableCell>
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
        <Button onClick={addRow} variant="outline" className="flex-1 sm:flex-none">
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Linha
        </Button>
        <Button
          variant="outline"
          onClick={() => { setRows([]); toast.success("Tabela limpa!"); }}
          disabled={rows.length === 0}
          className="flex-1 sm:flex-none text-destructive hover:text-destructive"
        >
          <XCircle className="h-4 w-4 mr-2" />
          Limpar Tudo
        </Button>
        <Button variant="outline" onClick={() => handleExport("table")} disabled={rows.length === 0} className="flex-1 sm:flex-none">
          <Download className="h-4 w-4 mr-2" />
          Exportar Tabela (PNG)
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Resumo por Bitola</h2>
        <div ref={summaryRef}>
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-primary/5">
                  <TableHead className="font-semibold">Bitola (mm)</TableHead>
                  <TableHead className="font-semibold">Comp. Acumulado (m)</TableHead>
                  <TableHead className="font-semibold">Peso Calculado (kg)</TableHead>
                  <TableHead className="font-semibold">Peso p/ Compra (kg)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(summary)
                  .sort(([a], [b]) => parseFloat(a) - parseFloat(b))
                  .map(([bitola, data]) => (
                    <TableRow key={bitola}>
                      <TableCell className="font-medium">Ø {bitola}</TableCell>
                      <TableCell>{data.totalMeters.toFixed(2)}</TableCell>
                      <TableCell>{data.pesoCalculado.toFixed(2)}</TableCell>
                      <TableCell className="font-semibold">{data.pesoCompra}</TableCell>
                    </TableRow>
                  ))}
                {Object.keys(summary).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-4">
                      Nenhum dado inserido
                    </TableCell>
                  </TableRow>
                )}
                {Object.keys(summary).length > 0 && (
                  <TableRow className="bg-primary/10 font-bold">
                    <TableCell colSpan={3} className="text-right font-semibold">PESO TOTAL PARA COMPRA</TableCell>
                    <TableCell className="font-bold text-primary">{pesoTotalCompra} kg</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
        <div className="mt-3">
          <Button variant="outline" onClick={() => handleExport("summary")} disabled={Object.keys(summary).length === 0}>
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
